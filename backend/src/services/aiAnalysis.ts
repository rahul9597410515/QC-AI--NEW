// ============================================
// QC AI Backend — AI Analysis Service
// Supports: mock | openai | gemini
// ============================================
import { env } from '../config/env';
import { generateBoundingBoxes, BoundingBox } from './defectSimulator';

export interface AnalysisResult {
    boxes: BoundingBox[];
    processingTimeMs: number;
    provider: string;
}

export async function analyzeImage(_imageBase64: string): Promise<AnalysisResult> {
    const startMs = Date.now();

    if (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
        return analyzeWithOpenAI(_imageBase64, startMs);
    }
    if (env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY) {
        return analyzeWithGemini(_imageBase64, startMs);
    }

    // Default: mock analysis
    return mockAnalysis(startMs);
}

// ── Mock (random bounding boxes) ──────────────
async function mockAnalysis(startMs: number): Promise<AnalysisResult> {
    // Simulate processing delay (0.8–2s)
    await sleep(800 + Math.random() * 1200);
    const numDefects = Math.floor(Math.random() * 5); // 0–4 defects
    const boxes = numDefects > 0 ? generateBoundingBoxes(numDefects) : [];
    return { boxes, processingTimeMs: Date.now() - startMs, provider: 'mock' };
}

// ── OpenAI Vision ──────────────────────────────
async function analyzeWithOpenAI(imageBase64: string, startMs: number): Promise<AnalysisResult> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `You are a manufacturing quality control AI. Analyze this product image for defects.
Return ONLY valid JSON in this exact format — no other text:
{"defects":[{"type":"Scratch","severity":"warning","confidence":87.2,"x":12.5,"y":23.1,"w":8.3,"h":5.2}]}
severity must be one of: "critical", "warning", "info".
x,y,w,h are percentages (0-100) of image dimensions.
If no defects, return {"defects":[]}.`,
                    },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' } },
                ],
            }],
            max_tokens: 512,
            response_format: { type: 'json_object' },
        }),
    });

    if (!res.ok) {
        console.error('OpenAI error:', await res.text());
        return mockAnalysis(startMs);
    }

    const json = await res.json() as { choices: { message: { content: string } }[] };
    const content = json.choices[0]?.message?.content ?? '{"defects":[]}';
    const parsed = JSON.parse(content) as { defects: { type: string; severity: string; confidence: number; x: number; y: number; w: number; h: number }[] };

    const boxes: BoundingBox[] = (parsed.defects ?? []).map((d, i) => ({
        id: `openai-${i}-${Date.now()}`,
        type: d.type,
        severity: (d.severity as 'critical' | 'warning' | 'info') ?? 'info',
        confidence: d.confidence,
        x: d.x, y: d.y, w: d.w, h: d.h,
    }));

    return { boxes, processingTimeMs: Date.now() - startMs, provider: 'openai' };
}

// ── Gemini Vision ──────────────────────────────
async function analyzeWithGemini(imageBase64: string, startMs: number): Promise<AnalysisResult> {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `You are a manufacturing quality control AI. Analyze this product image for defects.
Return ONLY valid JSON: {"defects":[{"type":"Scratch","severity":"warning","confidence":87.2,"x":12.5,"y":23.1,"w":8.3,"h":5.2}]}
severity: "critical" | "warning" | "info". x,y,w,h in % of image. No defects → {"defects":[]}.`,
                        },
                        { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
                    ],
                }],
                generationConfig: { responseMimeType: 'application/json' },
            }),
        }
    );

    if (!res.ok) {
        console.error('Gemini error:', await res.text());
        return mockAnalysis(startMs);
    }

    const json = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    const text = json.candidates[0]?.content?.parts[0]?.text ?? '{"defects":[]}';
    const parsed = JSON.parse(text) as { defects: { type: string; severity: string; confidence: number; x: number; y: number; w: number; h: number }[] };

    const boxes: BoundingBox[] = (parsed.defects ?? []).map((d, i) => ({
        id: `gemini-${i}-${Date.now()}`,
        type: d.type,
        severity: (d.severity as 'critical' | 'warning' | 'info') ?? 'info',
        confidence: d.confidence,
        x: d.x, y: d.y, w: d.w, h: d.h,
    }));

    return { boxes, processingTimeMs: Date.now() - startMs, provider: 'gemini' };
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
