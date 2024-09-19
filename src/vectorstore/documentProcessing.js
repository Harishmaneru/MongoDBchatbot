import { spawn } from 'child_process';
import { initializeMongoVectorStore } from './mongoVectorStore.js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function convertVideoToAudio(videoPath, outputAudioPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', ['-i', videoPath, '-q:a', '0', '-map', 'a', outputAudioPath]);
        
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve(outputAudioPath);
            } else {
                reject(new Error(`FFmpeg failed with exit code ${code}`));
            }
        });
    });
}

export async function transcribeAudioToText(audioPath) {
    try {
        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: 'whisper-1'
        });
        return response.text;
    } catch (error) {
        console.error('Error transcribing audio:', error);
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
        
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const chunks = await splitter.splitText(textContent);
        
        const vectorStore = await initializeMongoVectorStore(new OpenAIEmbeddings());
        await vectorStore.addDocuments(chunks);

        return chunks;
    } catch (error) {
        console.error('Error processing audio/video file:', error);
        throw error;
    }
}