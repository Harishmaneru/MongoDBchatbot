 
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from '@langchain/openai';
import { connectToMongoDB } from './mongoSetup.js';

const embeddings = new OpenAIEmbeddings();

export async function initializeMongoVectorStore() {
    const collection = await connectToMongoDB();
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection,
        indexName: "default",
        textKey: "text",
        embeddingKey: "embedding",
      });
    return vectorStore;
}
