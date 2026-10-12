/**
 * WebLLM Local 1B Browser AI Engine (WebGPU)
 * Runs Llama-3.2-1B-Instruct-q4f16_1-MLC 100% locally inside the browser.
 */

import { CreateMLCEngine } from "@mlc-ai/web-llm";

// Default 1B Model: Meta Llama 3.2 1B Instruct (Quantized q4f16_1 for WebGPU)
export const DEFAULT_1B_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

const SYSTEM_PROMPT = `You are the AICon Assistant — an intelligent AI running 100% locally inside the user's browser via WebGPU for the AICon Championship.
Key Information:
- Theme: "Technology should amplify human identity, not replace it."
- Host Venue: GEMS Our Own Indian School, Dubai (Al Quoz 1).
- 3 Flagship Events: 
  1. AI Ethics Panel
  2. Hackathon
  3. AI Studio
- Registration: 100% Free. Team sizes vary: AI Ethics Panel (individual), AI Studio (3 members), Hackathon (4 members).
Be friendly, helpful, concise, and structured. Use Markdown formatting when helpful.`;

let mlcEngine = null;
let isInitializing = false;

export function checkWebGPUSupport() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export async function getOrInitWebLLMEngine(onProgress) {
  if (mlcEngine) return mlcEngine;
  if (!checkWebGPUSupport()) {
    throw new Error("WebGPU is not supported on this browser/device.");
  }
  if (isInitializing) {
    throw new Error("Model is currently loading. Please wait a moment...");
  }

  isInitializing = true;

  try {
    mlcEngine = await CreateMLCEngine(DEFAULT_1B_MODEL, {
      initProgressCallback: (progress) => {
        if (onProgress) onProgress(progress);
      }
    });
    isInitializing = false;
    return mlcEngine;
  } catch (err) {
    isInitializing = false;
    mlcEngine = null;
    throw err;
  }
}

export async function streamLLMResponse(chatHistory, onChunk, onProgress) {
  const engine = await getOrInitWebLLMEngine(onProgress);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chatHistory
  ];

  const completion = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 512,
  });

  let fullText = "";

  for await (const chunk of completion) {
    const delta = chunk.choices[0]?.delta?.content || "";
    fullText += delta;
    if (onChunk) onChunk(fullText, delta);
  }

  return fullText;
}
