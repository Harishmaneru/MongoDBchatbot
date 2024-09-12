// import { io } from "https://cdn.socket.io/4.6.1/socket.io.esm.min.js";

// const socket = io(); // Connect to the Socket.io server

// document.addEventListener('submit', (e) => {
//     e.preventDefault();
//     progressConversation();
// });

// let convState = [];
// let convHistory = "";

// async function progressConversation() {
//     const userInput = document.getElementById('user-input');
//     const chatbotConversation = document.getElementById('chatbot-conversation-container');
//     const question = userInput.value;
//     userInput.value = '';

//     // Add user message to the chat
//     const newHumanSpeechBubble = document.createElement('div');
//     newHumanSpeechBubble.classList.add('speech', 'speech-human');
//     chatbotConversation.appendChild(newHumanSpeechBubble);
//     newHumanSpeechBubble.textContent = question;
//     chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

//     // Send the message to the server
//     socket.emit('chat message', {question: question, history: convHistory});
//     convState.push(question);
// }

// // Ensure that this listener is registered only once
// socket.on('chat message', (response) => {
//     const chatbotConversation = document.getElementById('chatbot-conversation-container');
//     const newAiSpeechBubble = document.createElement('div');
//     newAiSpeechBubble.classList.add('speech', 'speech-ai');
//     chatbotConversation.appendChild(newAiSpeechBubble);
//     newAiSpeechBubble.textContent = response;
//     chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
//     convState.push(response);

//     function formatConvHistory(messages) {
//         let formattedHistory = '';
//         for (let i = 0; i < messages.length; i += 2) {
//             const humanMessage = messages[i] ? `Human: ${messages[i]}` : '';
//             const aiMessage = messages[i + 1] ? `AI: ${messages[i + 1]}` : '';
//             formattedHistory += `${humanMessage}\n${aiMessage}\n\n`;
//         }
//         return formattedHistory;
//     }

//     convHistory += formatConvHistory(convState); 
//     convState = [];
//     console.log(convHistory);   
//     console.log(convState);

// });
