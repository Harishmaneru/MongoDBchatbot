import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { Server } from 'socket.io';
import fs from 'fs';
import http from 'http';   
import https from 'https';
import indexRouter from './src/routes/index.js';  
import { getResponseFromAI } from './src/vectorstore/retrieval.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use('/', indexRouter);
const server = https.createServer(app);   
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

// Start the server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
