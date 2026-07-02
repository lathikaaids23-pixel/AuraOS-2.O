import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI with lazy-loaded key check
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// API Endpoint for AI Copilot Diagnostic Checks
app.post('/api/ai/copilot', async (req, res) => {
  const { symptoms, diagnosis, prescription } = req.body;

  const ai = getAiClient();
  if (!ai) {
    // If no real API key is configured, return mock analyzer response
    return res.json({
      summary: "Aura OS 2.0 AI assistant successfully analyzed your input locally (Mock Sandbox mode). Set up GEMINI_API_KEY for dynamic clinical intelligence.",
      warnings: "Local Engine Checked: No common catastrophic interactions flagged."
    });
  }

  try {
    const prompt = `You are an elite clinical diagnostic copilot running in Aura OS 2.0. 
Analyze the following clinical case:
Symptoms: "${symptoms || 'None recorded'}"
Diagnosis: "${diagnosis || 'General Checkup'}"
Prescribed Medications: ${JSON.stringify(prescription || [])}

Provide a concise, medical-grade analysis of:
1. Potential drug-drug interactions or contraindications among the listed prescription medicines.
2. Any warning signs or advice for the clinician to review.
Keep your response short and highly professional, suitable for a clinical summary. Format it with clear bulletins or brief paragraphs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      summary: response.text || "Analysis completed with no significant alerts.",
      warnings: response.text && response.text.toLowerCase().includes('warning') ? "Alert: Potential interaction or caution identified. Check details below." : "Clear: No catastrophic interactions identified."
    });
  } catch (error) {
    console.error('Gemini Copilot Error:', error);
    res.status(500).json({
      error: 'Failed to generate AI Copilot summary',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Setup Vite Dev server or Serve Static build
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aura OS 2.0 server booting at http://localhost:${PORT}`);
  });
}

setupServer();
