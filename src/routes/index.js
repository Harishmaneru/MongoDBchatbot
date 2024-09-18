// src/routes/index.js
import express from 'express';
import { createCustomRetrievalChain } from '../vectorstore/retrieval.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
    try {
        const { question } = req.body;
        const response = await createCustomRetrievalChain(question);
        res.send({ message: response });
    } catch (error) {
        res.status(500).send({ error: 'Failed to retrieve answer' });
    }
});

export default router;
