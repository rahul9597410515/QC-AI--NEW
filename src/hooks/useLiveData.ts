import React, { useState, useEffect, useRef } from 'react';
import { generateDefectEvent, generateBoundingBoxes } from '../data/defectStream';
import type { DefectEvent, BoundingBox } from '../data/defectStream';
import { generateSensorReadings, generateSensorSnapshot } from '../data/sensorStream';
import type { SensorReading, SensorSnapshot } from '../data/sensorStream';
import { useApp } from '../context/AppContext';

// ── useSimulatedFeed ──────────────────────────────
export function useSimulatedFeed(intervalMs = 4000) {
    const { environment, inspectionsPaused, addDefect, incrementInspections } = useApp();
    const [latestDefect, setLatestDefect] = useState<DefectEvent | null>(null);

    useEffect(() => {
        if (inspectionsPaused) return;
        const id = setInterval(() => {
            const evt = generateDefectEvent(environment);
            setLatestDefect(evt);
            addDefect(evt);
            incrementInspections(Math.floor(Math.random() * 3) + 1);
        }, intervalMs + Math.random() * 2000);
        return () => clearInterval(id);
    }, [environment, inspectionsPaused, intervalMs, addDefect, incrementInspections]);

    return latestDefect;
}

// ── useSensorStream ──────────────────────────────
export function useSensorStream(intervalMs = 2000) {
    const [readings, setReadings] = useState<SensorReading[]>(generateSensorReadings);
    const [history, setHistory] = useState<SensorSnapshot[]>(() => {
        return Array.from({ length: 30 }, (_, i) => {
            const snap = generateSensorSnapshot();
            snap.timestamp = new Date(Date.now() - (30 - i) * intervalMs);
            return snap;
        });
    });

    useEffect(() => {
        const id = setInterval(() => {
            const newReadings = generateSensorReadings();
            setReadings(newReadings);
            const snap = generateSensorSnapshot();
            setHistory(prev => [...prev.slice(-59), snap]);
        }, intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);

    return { readings, history };
}

// ── useLiveCanvas ──────────────────────────────
export function useLiveCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, camera: number) {
    const [boxes, setBoxes] = useState<BoundingBox[]>([]);
    const frameRef = useRef(0);
    const boxAgesRef = useRef<BoundingBox[]>([]);
    const animRef = useRef<number>(0);

    // Periodically inject new bounding boxes
    useEffect(() => {
        const id = setInterval(() => {
            const newBoxes = generateBoundingBoxes(Math.floor(Math.random() * 3) + 1);
            boxAgesRef.current = [...boxAgesRef.current.filter(b => b.age > 0), ...newBoxes];
            setBoxes([...boxAgesRef.current]);
        }, 3500 + Math.random() * 1500);
        return () => clearInterval(id);
    }, [camera]);

    // Animate canvas background (simulated product texture)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        function drawFrame() {
            if (!canvas || !ctx) return;
            const W = canvas.width;
            const H = canvas.height;
            frameRef.current++;

            // Dark textured background
            ctx.fillStyle = '#0A0F1E';
            ctx.fillRect(0, 0, W, H);

            // Grid lines
            ctx.strokeStyle = 'rgba(0,212,255,0.06)';
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

            // Product surface simulation (noise texture)
            const imageData = ctx.createImageData(W, H);
            const data = imageData.data;
            const t = frameRef.current;
            for (let i = 0; i < W * H; i++) {
                const x = i % W;
                const y = Math.floor(i / W);
                const noise = Math.sin(x * 0.1 + t * 0.03) * Math.cos(y * 0.08 + t * 0.02) * 20 + Math.random() * 8;
                const v = Math.max(0, Math.min(255, 40 + noise));
                data[i * 4] = v * 0.6;
                data[i * 4 + 1] = v * 0.75;
                data[i * 4 + 2] = v;
                data[i * 4 + 3] = 180;
            }
            ctx.putImageData(imageData, 0, 0);

            // Scanline
            const scanY = (t * 2.5) % (H + 4);
            const grad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 4);
            grad.addColorStop(0, 'rgba(0,212,255,0)');
            grad.addColorStop(0.5, 'rgba(0,212,255,0.25)');
            grad.addColorStop(1, 'rgba(0,212,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, scanY - 2, W, 6);

            // Corner brackets
            const bs = 20;
            ctx.strokeStyle = 'rgba(0,212,255,0.7)';
            ctx.lineWidth = 2;
            [[0, 0], [W, 0], [0, H], [W, H]].forEach(([cx, cy]) => {
                const sx = cx === 0 ? 1 : -1;
                const sy = cy === 0 ? 1 : -1;
                ctx.beginPath(); ctx.moveTo(cx + sx * bs, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * bs); ctx.stroke();
            });

            animRef.current = requestAnimationFrame(drawFrame);
        }

        animRef.current = requestAnimationFrame(drawFrame);
        return () => cancelAnimationFrame(animRef.current);
    }, [canvasRef]);

    // Age boxes
    useEffect(() => {
        const id = setInterval(() => {
            boxAgesRef.current = boxAgesRef.current
                .map(b => ({ ...b, age: b.age - 1 }))
                .filter(b => b.age > 0);
            setBoxes([...boxAgesRef.current]);
        }, 500);
        return () => clearInterval(id);
    }, []);

    return boxes;
}
