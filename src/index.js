// import { OpenAI } from '@langchain/openai';
// import express from 'express';
// import http from 'http';
// import { Server } from 'socket.io';
// import path from 'path';
// import dotenv from 'dotenv';
// import https from 'https';
// import fs from 'fs';
// import cors from 'cors';
// import { MongoClient } from 'mongodb';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(express.json());

// // MongoDB connection setup
// const mongoUri = 'mongodb+srv://harishmaneru:Xe2Mz13z83IDhbPW@cluster0.bu3exkw.mongodb.net/?retryWrites=true&w=majority&tls=true';
// const client = new MongoClient(mongoUri);
// const dbName = 'ChatBotKnowledgeBase';
// const collectionName = 'Data';

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// // Function to dynamically load modules
// async function loadLangchainModules() {
//     const  { MongoDBAtlasVectorSearch } = await import( '@langchain/mongodb/dist/vectorstores');
//     const { OpenAIEmbeddings } = await import('langchain/embeddings/openai');
//     const { RetrievalQAChain } = await import('langchain/chains');

//     return { MongoDBAtlasVectorSearch, OpenAIEmbeddings, RetrievalQAChain };
// }

// // Create the vector store using MongoDB
// async function createVectorStore() {
//     const { MongoDBVectorStore, OpenAIEmbeddings } = await loadLangchainModules();
//     const db = client.db(dbName);  // Connect to the database
//     const collection = db.collection(collectionName);  // Access the collection
//     const embeddings = new OpenAIEmbeddings();  // Create embeddings using OpenAI
//     return new MongoDBVectorStore(embeddings, { client, dbName, collection });
// }

// // Function to handle AI responses
// async function getResponseFromAI(message) {
//     try {
//         const { RetrievalQAChain } = await loadLangchainModules();  // Load dynamically

//         const userMessage = message.question;  // Extract the user's question

//         if (typeof userMessage !== 'string') {
//             throw new Error("Invalid input: message content should be a string.");
//         }

//         // Retrieve the vector store and set up the retriever for document-based responses
//         const vectorStore = await createVectorStore();
//         const retriever = vectorStore.asRetriever();
//         const chain = new RetrievalQAChain({
//             llm: openai,
//             retriever: retriever,
//         });

//         const response = await chain.call({ question: userMessage });
//         return response.text;
//     } catch (error) {
//         console.error('Error with OpenAI API:', error);
//         throw new Error("There was an issue communicating with the AI.");
//     }
// }

// // HTTPS options for SSL certificates
// const options = {
//     key: fs.readFileSync('./onepgr.com.key', 'utf8'),
//     cert: fs.readFileSync('./STAR_onepgr_com.crt', 'utf8'),
//     ca: fs.readFileSync('./STAR_onepgr_com.ca-bundle', 'utf8')
// };

// // Use https instead of http
// const server = http.createServer(options, app);
// const io = new Server(server);

// // Serve static files
// app.use(express.static('src/public'));

// // Set up the basic route to serve the chatbot UI
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, '/home.html'));
// });

// // Listen for client connections through Socket.IO
// io.on('connection', (socket) => {
//     console.log('A user has connected');

//     // Listen for chat messages from the client
//     socket.on('chat message', async (msg) => {
//         try {
//             console.log('Message received:', msg);
//             const response = await getResponseFromAI(msg);  // Get AI response
//             socket.emit('chat message', response);  // Send the response back to the client
//         } catch (error) {
//             console.error('Error processing message:', error);
//             socket.emit('chat message', "I'm sorry, I encountered an error processing your message.");
//         }
//     });

//     // Client disconnect event
//     socket.on('disconnect', () => {
//         console.log('A user has disconnected');
//     });
// });

// // Set up the server port
// const PORT = process.env.PORT || 3002;
// server.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server running on port ${PORT}`);
// });


  
import { OpenAI } from 'openai';
import express from 'express';
import http from 'http';
import https from 'https';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import csv from 'csv-parser';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Memory-based vector store to store vectors and documents in memory
const vectorStore = new MemoryVectorStore(new OpenAIEmbeddings());

// Function to add vectors and documents to the vector store
async function addDocumentsToStore(docs) {
    await vectorStore.addDocuments(docs);
}

// Ensure the uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for file uploads

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
console.log(storage);
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }  
});

async function splitTextIntoChunks(text) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000,  
        chunkOverlap: 200,   
    });

    const chunks = await splitter.createDocuments([text]);
    return chunks;
}


// Function to extract text from uploaded files
async function extractTextFromFile(filePath, originalName) {
    try {
        console.log('Extracting text from file:', filePath);

        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist at path: ${filePath}`);
        }

        const extension = path.extname(originalName).toLowerCase();
        console.log('File extension:', extension);

        let extractedText = '';

        switch (extension) {
            case '.pdf':
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(dataBuffer);
                extractedText = pdfData.text;
                break;
            case '.csv':
                extractedText = await new Promise((resolve, reject) => {
                    const results = [];
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', (data) => results.push(JSON.stringify(data)))
                        .on('end', () => resolve(results.join('\n')))
                        .on('error', reject);
                });
                break;
            case '.docx':
                const result = await mammoth.extractRawText({ path: filePath });
                extractedText = result.value;
                break;
            default:
                throw new Error(`Unsupported file format: ${extension}`);
        }

        console.log('Text extracted successfully. Length:', extractedText.length);
        return extractedText;
    } catch (error) {
        console.error('Error in extractTextFromFile:', error);
        throw error;
    }
}

// Upload route
app.post('/data', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }

        console.log('Uploaded File Info:', file);

        // Extract text from the uploaded file
        const text = await extractTextFromFile(file.path, file.originalname);

        // Split text into chunks before creating embeddings
        const chunks = await splitTextIntoChunks(text);

        // Create Document objects for each chunk and add them to the vector store
        const docs = chunks.map((chunk, index) => new Document({
            pageContent: chunk.pageContent,
            metadata: { fileName: file.originalname, chunkIndex: index, fileType: path.extname(file.originalname) }
        }));

        await addDocumentsToStore(docs);

        console.log('Document chunks added to vectorStore');

        //  remove the file after processing
        fs.unlinkSync(file.path);

        res.status(200).send({
            message: 'File added to the vector store successfully',
            fileName: file.originalname,
            fileSize: file.size,
            chunkCount: docs.length,
            documentMetadata: docs.map(doc => doc.metadata)
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send({ message: 'Error processing the file', error: error.toString() });
    }
});



app.post('/upload-test', upload.none(), (req, res) => {
    console.log('Test upload body:', req.body);
    res.send('Test upload received');
});


async function createCustomRetrievalChain(question) {
    const relevantDocs = await vectorStore.similaritySearch(question, 5);

    const messages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Based on the following documents: ${JSON.stringify(relevantDocs)}, answer the question: ${question}` }
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 200,
    });

    if (response.choices && response.choices[0].message.content) {
        return response.choices[0].message.content;
    } else {
        throw new Error('No valid message content found in the API response');
    }
}


async function getResponseFromAI(message) {
    try {
        const userMessage = message.question.toLowerCase();

  
        if (userMessage.includes('hi') || userMessage.includes('hello') || userMessage.includes('hey')) {
            return 'Hello! How can I assist you today?';
        }

        // Personalized greeting for introductions
        const nameMatch = userMessage.match(/i(?:'| a)m (\w+)/i);
        const greetingMatch = userMessage.match(/\bgood (morning|afternoon|evening)\b/i);

        if (nameMatch) {
            const userName = nameMatch[1];
            if (greetingMatch) {
                const timeOfDay = greetingMatch[1];
                return `Good ${timeOfDay}, ${userName}! How can I help you today?`;
            } else {
                return `Hello, ${userName}! How can I assist you today?`;
            }
        }

        if (greetingMatch) {
            const timeOfDay = greetingMatch[1];
            return `Good ${timeOfDay}! How can I assist you today?`;
        }

        // If no greetings or names are detected, proceed with retrieval
        const response = await createCustomRetrievalChain(userMessage);
        return response;

    } catch (error) {
        console.error('Error with AI response:', error);
        throw new Error("There was an issue communicating with the AI.");
    }
}


const options = {
    key: fs.readFileSync('./onepgr.com.key', 'utf8'),
    cert: fs.readFileSync('./STAR_onepgr_com.crt', 'utf8'),
    ca: fs.readFileSync('./STAR_onepgr_com.ca-bundle', 'utf8')
};

// Create server
const server = https.createServer(options, app);
const io = new Server(server);

// Serve static files
app.use(express.static('src/public'));

// Set up the basic route to serve the chatbot UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/home.html'));
});

// Listen for client connections through Socket.IO
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