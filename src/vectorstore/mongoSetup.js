 
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb+srv://harish:Onepgrchatbot%401997@cluster0.eph9b.mongodb.net/?retryWrites=true&w=majority&tls=true';
const dbName = 'ChatBotKnowledgeBase';
const collectionName = 'Data';

const client = new MongoClient(mongoUri);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(dbName);
        return db.collection(collectionName);
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw new Error('Failed to connect to MongoDB');
    }
}

export async function closeMongoConnection() {
    await client.close();
}
