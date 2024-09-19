import fs from 'fs';
import pdfParse from 'pdf-parse';
import csv from 'csv-parser';
import mammoth from 'mammoth';
import { OpenAIEmbeddings } from '@langchain/openai';
import { initializeMongoVectorStore } from './mongoVectorStore.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
export async function extractTextFromFile(filePath, originalName) {
    try {
        console.log(`Extracting text from: ${originalName}`);
        const extension = originalName.split('.').pop().toLowerCase();
        let extractedText = '';
        switch (extension) {
            case 'pdf':
                console.log('Processing PDF file...');
                const pdfBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(pdfBuffer);
                extractedText = pdfData.text;
                console.log(`Extracted ${extractedText.length} characters from PDF.`);
                break;
            case 'csv':
                console.log('Processing CSV file...');
                extractedText = await new Promise((resolve, reject) => {
                    const results = [];
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', (data) => results.push(JSON.stringify(data)))
                        .on('end', () => resolve(results.join('\n')))
                        .on('error', reject);
                });
                console.log(`Extracted ${extractedText.length} characters from CSV.`);
                break;
            case 'docx':
                console.log('Processing DOCX file...');
                const mammothResult = await mammoth.extractRawText({ path: filePath });
                extractedText = mammothResult.value;
                console.log(`Extracted ${extractedText.length} characters from DOCX.`);
                break;
            default:
                throw new Error(`Unsupported file type: ${extension}`);
        }

        return extractedText;
    } catch (error) {
        console.error('Error extracting text from file:', error);
        throw error;
    }
}

// Function to process and store the document in MongoDB
export async function processAndStoreDocument(text, fileName) {
    try {
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 200 });
        const chunks = await splitter.splitText(text);

        const docs = chunks.map((chunk, index) => ({
            pageContent: chunk,
            metadata: { fileName, chunkIndex: index }
        }));

        const embeddings = new OpenAIEmbeddings();
        const vectorStore = await initializeMongoVectorStore();

        // Add document chunks to the MongoDB vector store
        await vectorStore.addDocuments(docs);
        console.log(`Added ${docs.length} chunks from ${fileName} to vector store`);
        
        // Return docs if needed for further processing or logging
        return docs;

    } catch (error) {
        console.error('Error processing and storing document:', error);
        throw error;
    }
}
