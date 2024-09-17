// // import { ChatOpenAI } from "@langchain/openai";
// // import { ChatPromptTemplate } from "@langchain/core/prompts";
// // import { StringOutputParser } from "@langchain/core/output_parsers";

// // import { retriever } from "./utils/retriever.js";
// // import { pageContentCombinator } from "./utils/filecombiner.js";

// // import dotenv from "dotenv";

// // dotenv.config();

// // // document.addEventListener('submit', (e) => {
// // //     e.preventDefault()
// // //     progressConversation()
// // // });

// // const openaiApiKey = process.env.OPENAI_API_KEY;

// // const llm = new ChatOpenAI({ 
// //     openaiApiKey, 
// //     temperature: 0.3,
// // });

// // const standloneQuestionTemplate = 'Turn a user question into a standalone question: {userQuestion}';

// // const standaloneQuestionPrompt = ChatPromptTemplate.fromTemplate(standloneQuestionTemplate)

// // /**
// //  * Challenge:
// //  * 1. Create a template and a prompt to get an answer to the users original question.
// //  * Remenber to include the original question in the prompt and the text chunks we got bacj from the retriever as input variables.
// //  * Call there input variables 'question' and 'context'
// //  * 
// //  * We want this chatbot to :
// //  * -be friendly 
// //  * -only answer from the context we got from the retriever and never make up information.
// //  * -apoligize if it can't find the answer and in that case advise the user to email help@chatbot.com
// //  */

// // const answerTemplate = `You are a helpful and enthusiastic support agent. You are here to help the user with their question based in the provided context. Try to find the answer in the context. If you can't find the answer, apologize and please advise the questioner to email help@chatbot.com. Always speak as you are a friend and never make up information.
// // question: {userQuestion}
// // context: {context}
// // answer:
// // `;
// // const answerPrompt = ChatPromptTemplate.fromTemplate(answerTemplate);

// // // In order to make this work we need to convert the response from the retriever into a string, so we use the pageContentCombinator to do that.

// // const chain = standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser()).pipe(retriever).pipe(pageContentCombinator)

// // const response = await chain.invoke({ userQuestion: "What are the categories of taxes??"});

// // console.log(response);

// import { ChatOpenAI } from "@langchain/openai";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
// import { retriever } from "./utils/retriever.js";
// import { pageContentCombinator } from "./utils/filecombinator.js";
// import dotenv from "dotenv";

// dotenv.config();

// const openaiApiKey = process.env.OPENAI_API_KEY;
// const llm = new ChatOpenAI({
//     openaiApiKey,
//     temperature: 0.3,
// });



// const answerTemplate = `You are a helpful and enthusiastic support agent. Answer the user's question based ONLY on the provided context. Be friendly in your response. If you can't find the answer in the context, apologize and advise the user to email help@chatbot.com. Never make up information or use external knowledge.

// Context: {context}

// Question: {userQuestion}

// Answer:`;

// const answerPrompt = ChatPromptTemplate.fromTemplate(answerTemplate);

// const chain = RunnableSequence.from([
//     {
//         context: retriever.pipe(pageContentCombinator),
//         userQuestion: new RunnablePassthrough(),
//     },
//     answerPrompt,
//     llm,
//     new StringOutputParser()
// ]);

// export async function chatAgent(userQuestion) {
//     try {
//         const response = await chain.invoke(userQuestion);
//         return response;
//     } catch (error) {
//         console.error("Error getting response", error);
//         throw error;
//     }
// }

// // Example usage
// // const response = await chatAgent("What are the categories of taxes?");
// // console.log(response);