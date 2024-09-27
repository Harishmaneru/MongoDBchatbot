import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { Server } from 'socket.io';
import fs from 'fs';
import https from 'https';
import http from 'http';
import indexRouter from './src/routes/index.js';  
import { getResponseFromAI } from './src/vectorstore/retrieval.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
    origin: 'http://127.0.0.1:4200',   
    methods: ['GET', 'POST'],
    credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use('/', indexRouter);

const options = {
    key: fs.readFileSync('./onepgr.com.key', 'utf8'),
    cert: fs.readFileSync('./STAR_onepgr_com.crt', 'utf8'),
    ca: fs.readFileSync('./STAR_onepgr_com.ca-bundle', 'utf8')   
};

const server = https.createServer(options, app);

 
const io = new Server(server, {
    cors: {
        origin: 'http://127.0.0.1:4200',   
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('A user has connected');
    socket.on('chat message', async (msg) => {
        try {
            const response = await getResponseFromAI(msg); 
           // console.log('Generated response:', response); 
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
