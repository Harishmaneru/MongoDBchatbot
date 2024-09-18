import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getResponseFromAI } from './src/vectorstore/retrieval.js';  
import { extractTextFromFile, processAndStoreDocument } from './src/vectorstore/documentProcessing.js'; // Document processing functions
import { Server } from 'socket.io';
import http from 'http';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Example endpoint for uploading PDF and storing in MongoDB
app.post('/KnowledgeBase', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }

        // Extract text from the uploaded file
        const extractedText = await extractTextFromFile(file.path, file.originalname);

        // Process and store the document (text splitting, embeddings, and saving to MongoDB)
        const docs = await processAndStoreDocument(extractedText, file.originalname);

        // Remove file after processing
        fs.unlinkSync(file.path);

        console.log(`Added ${docs.length} chunks to MongoDB vector store`); // Ensure docs is defined and used correctly

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


const server = http.createServer(app);
const io = new Server(server);

 
io.on('connection', (socket) => {
    console.log('A user has connected');
    socket.on('chat message', async (msg) => {
        try {
            const response = await getResponseFromAI(msg); 
            socket.emit('chat message', response);
        } catch (error) {
            console.error('Error processing message:', error);
            socket.emit('chat message', "I'm sorry, I encountered an error processing your message.");
        }
    });

    socket.on('disconnect', () => {
        console.log('A user has disconnected');
    });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
