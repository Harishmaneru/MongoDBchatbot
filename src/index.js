import OpenAI from 'openai'; // Use import instead of require
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();



// Supabase initialization
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Please check your .env file.');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

async function getResponseFromAI(message) {
    try {
        // Assuming `message` is an object that contains a `question` property
        const userMessage = message.question;  // Extract the user's question as a string

        if (typeof userMessage !== 'string') {
            throw new Error("Invalid input: message content should be a string.");
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: userMessage }],  // Pass the extracted string here
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error with OpenAI API:', error);
        throw new Error("There was an issue communicating with the AI.");
    }
}



// Express and Socket.io server setup
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
    socket.on('chat message', async (msg) => {
        try {
          console.log('Message received:', msg);
          const response = await getResponseFromAI(msg);
          socket.emit('chat message', response);
        } catch (error) {
          console.error('Error processing message:', error);
          socket.emit('chat message', "I'm sorry, I encountered an error processing your message.");
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
