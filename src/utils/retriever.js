import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

import dotenv from "dotenv";

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;
const embeddings = new OpenAIEmbeddings({ openaiApiKey });
const supabase = createClient( process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Supabase Key:', process.env.SUPABASE_KEY);
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY);

const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
});

const retriever = vectorStore.asRetriever(); 

export { retriever };

