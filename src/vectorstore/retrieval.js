import { initializeMongoVectorStore } from './mongoVectorStore.js';  
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to query the vector store and get relevant documents
export async function createCustomRetrievalChain(question) {
    const vectorStore = await initializeMongoVectorStore();
    
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

 
export async function getResponseFromAI(message) {
    try {
        const userMessage = message.question.toLowerCase();

        
        if (userMessage.includes('hi') || userMessage.includes('hello') || userMessage.includes('hey')) {
            return 'Hello! How can I assist you today?';
        }

        
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

         
        const response = await createCustomRetrievalChain(userMessage);
        return response;

    } catch (error) {
        console.error('Error with AI response:', error);
        throw new Error("There was an issue communicating with the AI.");
    }
}
