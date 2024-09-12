import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { chatAgent } from './utils/6_agent.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();


// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Please check your .env file.');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to serve static files
app.use(express.static('src/public'));

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up a basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/home.html'));
});

// Listen for client connections
io.on('connection', (socket) => {
    console.log('A user has connected');

    // Listen for chat messages
    socket.on('chat message', async (data) => {
        console.log('Message received:', data.question);

        try {
            const response = await chatAgent({ question: data.question, history: data.history });
            console.log('Response:', response);
            socket.emit('chat message', response);
        } catch (error) {
            console.error('Error processing message:', error);
            socket.emit('error', 'An error occurred while processing your message.');
        }
    });

    // Client disconnect event
    socket.on('disconnect', () => {
        console.log('A user has disconnected');
    });
});

// Set up the server port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});