import express from 'express';
import multer from 'multer';
import fs from 'fs';

import { extractTextFromFile, processAudioVideo, processAndStoreDocument } from '../vectorstore/documentProcessing.js';
import { createCustomRetrievalChain } from '../vectorstore/retrieval.js';

const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save to 'uploads' folder
    },
    filename: function (req, file, cb) {
        // Extract original file extension
        const fileExtension = file.originalname.split('.').pop();
        // Use original name or any other naming scheme
        cb(null, `${file.fieldname}-${Date.now()}.${fileExtension}`);
    }
});

const upload = multer({ storage: storage }); // Use diskStorage for custom behavior
 
 
router.post('/KnowledgeBase', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }

 
        const fileType = file.originalname.split('.').pop().toLowerCase();

        let docs;
        if (['pdf', 'docx', 'csv'].includes(fileType)) {
          
            const extractedText = await extractTextFromFile(file.path, file.originalname);
            docs = await processAndStoreDocument(extractedText, file.originalname);
        } else if (['mp3', 'wav', 'mp4', 'mkv'].includes(fileType)) {
   
            docs = await processAudioVideo(file.path, file.originalname);
        } else {
            return res.status(400).send({ message: 'Unsupported file type' });
        }

 
        fs.unlinkSync(file.path);

        res.status(200).send({
            message: 'File processed and uploaded successfully',
            fileName: file.originalname,
            chunkCount: docs.length
        });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send({ message: 'Error processing file', error: error.toString() });
    }
});

 
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
