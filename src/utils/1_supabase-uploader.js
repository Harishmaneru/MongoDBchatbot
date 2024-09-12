import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js"; 
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();
const DataPdfPath = "./src/docs/Generative-AI.pdf";
const loader = new PDFLoader(DataPdfPath, { splitPages: false, parsedItemSeparator: "" });
function eliminarEspaciosExtras(texto) {
    let lineas = texto.split('\n');
    lineas = lineas.map(linea => linea.replace(/\s+/g, ' ').trim());
    return lineas.join('\n');
}
try{
    const docs = await loader.load();
    const cleanText = eliminarEspaciosExtras(docs[0].pageContent);
    console.log(cleanText)
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 700, 
        separators: ["\n\n", "\n", " ", ""],
        chunkOverlap: 80
    }); 
    const documents = await splitter.createDocuments([cleanText]);
    const output = documents.map((doc, index) => ({
        ...doc, 
        id:`${index}`,
    }));

  
    console.log(output)
    const sbApiKey = process.env.SUPABASE_KEY;
    const sbApiUrl = process.env.SUPABASE_URL;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const supabase = createClient(sbApiUrl, sbApiKey);
    const embeddings = new OpenAIEmbeddings({ openaiApiKey });

    const vectorStore = new SupabaseVectorStore(embeddings, {
        client: supabase,
        tableName: "documents",
        queryName: "match-documents",
    });
    await vectorStore.addDocuments(output);
    console.log("Done!");
} catch (error) {
    console.error(error);
}




