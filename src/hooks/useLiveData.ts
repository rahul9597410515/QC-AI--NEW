import React, { useState, useEffect, useRef } from 'react';
import { generateBoundingBoxes } from '../data/defectStream';
import type { DefectEvent, BoundingBox } from '../data/defectStream';
import type { SensorReading, SensorSnapshot } from '../data/sensorStream';
import { generateSensorReadings, generateSensorSnapshot } from '../data/sensorStream';
import { useApp } from '../context/AppContext';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';

// ── useSimulatedFeed — now driven by Socket.IO ─────────────────
export function useSimulatedFeed() {
    const { environment, inspectionsPaused, addDefect, incrementInspections } = useApp();
    const [latestDefect, setLatestDefect] = useState<DefectEvent | null>(null);

    useEffect(() => {
        if (inspectionsPaused) return;

        const socket = getSocket();
        // Tell backend which environment we care about
        socket.emit('set-environment', environment);

        const handler = (evt: DefectEvent) => {
            // backend sends timestamp as string — convert it
            const defect: DefectEvent = {
                ...evt,
                timestamp: new Date((evt as unknown as { timestamp: string }).timestamp ?? Date.now()),
            };
            setLatestDefect(defect);
            addDefect(defect);
            incrementInspections(Math.floor(Math.random() * 3) + 1);
        };

        socket.on('defect:new', handler);
        return () => { socket.off('defect:new', handler); };
    }, [environment, inspectionsPaused, addDefect, incrementInspections]);

    return latestDefect;
}

// ── useSensorStream — now driven by Socket.IO ─────────────────
export function useSensorStream() {
    const [readings, setReadings] = useState<SensorReading[]>(generateSensorReadings);
    const [history, setHistory] = useState<SensorSnapshot[]>(() =>
        Array.from({ length: 30 }, (_, i) => {
            const snap = generateSensorSnapshot();
            snap.timestamp = new Date(Date.now() - (30 - i) * 2000);
            return snap;
        })
    );

    useEffect(() => {
        // Initial REST load for sensor state
        api.getSensorsLatest().then(data => {
            if (Array.isArray(data) && data.length > 0) setReadings(data as SensorReading[]);
        }).catch(() => {/* fallback to local mock */ });

        const socket = getSocket();

        const handler = (data: SensorReading[]) => {
            setReadings(data);
            // Build a snapshot from readings
            const snap: SensorSnapshot = {
                timestamp: new Date(),
                temperature: 0, vibration: 0, pressure: 0,
                humidity: 0, speed: 0, current: 0,
            };
            data.forEach(r => { (snap as unknown as Record<string, number>)[r.key] = r.value; });
            setHistory(prev => [...prev.slice(-59), snap]);
        };

        socket.on('sensor:update', handler);
        return () => { socket.off('sensor:update', handler); };
    }, []);

    return { readings, history };
}

// ── useLiveCanvas — unchanged (canvas animation) ──────────────
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
        }, 3500);
        return () => clearInterval(id);
    }, [camera]);

    // Animate canvas background
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

            ctx.fillStyle = '#0A0F1E';
            ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = 'rgba(0,212,255,0.06)';
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

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

            const scanY = (t * 2.5) % (H + 4);
            const grad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 4);
            grad.addColorStop(0, 'rgba(0,212,255,0)');
            grad.addColorStop(0.5, 'rgba(0,212,255,0.25)');
            grad.addColorStop(1, 'rgba(0,212,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, scanY - 2, W, 6);

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
