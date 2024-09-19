import { spawn } from 'child_process';
import { initializeMongoVectorStore } from './mongoVectorStore.js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,  // Ensure your API key is correctly set
});


function convertVideoToAudio(videoPath, outputAudioPath) {
    return new Promise((resolve, reject) => {
        // Avoid appending `.mp3` again if it already has that extension
        const outputPathWithExtension = outputAudioPath.endsWith('.mp3') ? outputAudioPath : `${outputAudioPath}.mp3`;

        const ffmpeg = spawn('ffmpeg', ['-i', videoPath, '-q:a', '0', '-map', 'a', outputPathWithExtension]);

        ffmpeg.stderr.on('data', (data) => {
            console.error(`FFmpeg error output: ${data}`);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log('Audio extraction successful:', outputPathWithExtension);
                resolve(outputPathWithExtension);
            } else {
                reject(new Error(`FFmpeg failed with exit code ${code}`));
            }
        });

        ffmpeg.on('error', (err) => {
            reject(new Error(`FFmpeg encountered an error: ${err.message}`));
        });
    });
}



export async function transcribeAudioToText(audioPath) {
    try {
        console.log('audioPath provided:', audioPath);

        if (!fs.existsSync(audioPath)) {
            throw new Error(`File does not exist: ${audioPath}`);
        }

        console.log('Sending this file to Whisper API for transcription:', audioPath);
        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: 'whisper-1',
        });

        console.log('Raw API response:', JSON.stringify(response, null, 2));

        if (!response || !response.text) {
            throw new Error('Unexpected API response format');
        }

        return response.text;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        console.error('Error details:', error.response?.data || 'No additional error details');
        throw error;
    }
}


export async function extractTextFromFile(filePath) {
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        return content;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

export async function processAudioVideo(filePath, originalName) {
    try {
        let textContent = '';

        if (originalName.endsWith('.mp4') || originalName.endsWith('.mkv')) {
            const audioPath = filePath.replace(/\.[^/.]+$/, ".mp3");
            await convertVideoToAudio(filePath, audioPath);
            textContent = await transcribeAudioToText(audioPath);
            fs.unlinkSync(audioPath);
        } else if (originalName.endsWith('.mp3') || originalName.endsWith('.wav')) {
            textContent = await transcribeAudioToText(filePath);
        } else {
            throw new Error('Unsupported file format for audio/video processing');
        }

        // Ensure textContent is not empty
        if (!textContent || textContent.trim().length === 0) {
            throw new Error('Transcription resulted in empty text');
        }

        console.log('Transcribed text:', textContent);

        // Split text into chunks
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const chunks = await splitter.splitText(textContent);

        console.log('Number of chunks:', chunks.length);
        console.log('First chunk:', chunks[0]);

        // Ensure chunks are not empty
        if (chunks.length === 0) {
            throw new Error('Text splitting resulted in no chunks');
        }

        // Initialize and store in MongoDB vector store
        const vectorStore = await initializeMongoVectorStore(new OpenAIEmbeddings());
        
        // Convert chunks to the format expected by addDocuments
        const documents = chunks.map(chunk => ({
            pageContent: chunk,
            metadata: { source: originalName }
        }));

        await vectorStore.addDocuments(documents);

        return chunks;
    } catch (error) {
        console.error('Error processing audio/video file:', error);
        throw error;
    }
}