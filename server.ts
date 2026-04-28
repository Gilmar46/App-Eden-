import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // AI Chat Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      console.log("AI Chat Request received:", message);
      
      if (!message) {
        return res.status(400).json({ error: "Mensagem é obrigatória" });
      }

      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set in environment");
        return res.status(500).json({ error: "Configuração de IA ausente no servidor" });
      }

      const prompt = `Você é um assistente cristão que responde com base na Bíblia, com linguagem simples, acolhedora e respeitosa.

Pergunta do usuário: ${message}`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      console.log("AI Chat raw response:", response);

      const text = response.text || "Desculpe, não consegui processar sua dúvida agora.";

      res.json({ response: text });
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: "Erro ao processar consulta de IA: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
