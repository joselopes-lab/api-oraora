
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from '../firebase'; // Import the initialized admin SDK

const router = express.Router();

// Initialize the Google AI client with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

router.post('/chatbot', async (req, res) => {
  try {
    const { mensagemUsuario, uid } = req.body;

    if (!mensagemUsuario || !uid) {
      return res.status(400).json({ error: 'mensagemUsuario and uid are required' });
    }

    let baseImoveisMd = '';
    try {
        const bucket = admin.storage().bucket();
        const filePath = `users/${uid}/carteira.md`;
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        if (exists) {
            const [buffer] = await file.download();
            baseImoveisMd = buffer.toString('utf8');
        } else {
            console.log(`File not found for user ${uid}: ${filePath}`);
            // You can either stop here or proceed with an empty property list
            return res.status(404).json({ error: 'A carteira de imóveis para este corretor não foi encontrada.' });
        }
    } catch (storageError) {
        console.error('Error fetching from Firebase Storage:', storageError);
        return res.status(500).json({ error: 'Falha ao buscar a carteira de imóveis.' });
    }


    const prompt = `
      Você é um assistente virtual imobiliário de um corretor.
      Sua única fonte de verdade é o catálogo de imóveis abaixo, formatado em Markdown.
      Se o usuário perguntar sobre um imóvel que não está no catálogo, informe que não temos essa opção no momento.
      Não invente informações ou preços.
      ---
      CATÁLOGO DE IMÓVEIS
      ---
      ${baseImoveisMd}
      ---------------------------
      Pergunta do cliente: ${mensagemUsuario}
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ generatedText: text });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

export default router;
