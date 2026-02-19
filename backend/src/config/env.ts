import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required env var: ${key}`);
    return value;
}

export const env = {
    PORT: parseInt(process.env['PORT'] ?? '3001', 10),
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',
    DATABASE_URL: required('DATABASE_URL'),
    JWT_SECRET: required('JWT_SECRET'),
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '7d',
    CORS_ORIGIN: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    AI_PROVIDER: (process.env['AI_PROVIDER'] ?? 'mock') as 'mock' | 'openai' | 'gemini',
    OPENAI_API_KEY: process.env['OPENAI_API_KEY'] ?? '',
    GEMINI_API_KEY: process.env['GEMINI_API_KEY'] ?? '',
};
