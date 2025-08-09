'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const messageArea = document.querySelector('#messageArea');

let stompClient = null;
let username = null;

// Check if this tab already has a username saved in sessionStorage
window.addEventListener('load', () => {
    const storedName = sessionStorage.getItem('chatUsername');
    if (storedName) {
        username = storedName;
        showChatPage();
        connectToSocket();
    }
});

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);

function connect(event) {
    event.preventDefault();

    if (sessionStorage.getItem('chatUsername')) {
        alert("You are already connected as " + sessionStorage.getItem('chatUsername'));
        return;
    }

    username = document.querySelector('#name').value.trim();
    if (!username) return;

    // Save username only for this tab
    sessionStorage.setItem('chatUsername', username);

    showChatPage();
    connectToSocket();
}

function showChatPage() {
    usernamePage.classList.add('hidden');
    chatPage.classList.remove('hidden');
}

function connectToSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, onConnected, onError);
}

function onConnected() {
    stompClient.subscribe('/topic/public', onMessageReceived);
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({ sender: username, type: 'JOIN' }));
}

function onError(error) {
    alert("Could not connect to WebSocket server. Please refresh and try again!");
}

function sendMessage(event) {
    event.preventDefault();

    const messageContent = messageInput.value.trim();
    if (messageContent && stompClient) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };

        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
}

function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    const messageElement = document.createElement('li');

    if (message.type === 'JOIN' || message.type === 'LEAVE') {
        messageElement.textContent =
            message.type === 'JOIN'
                ? `${message.sender} joined the chat`
                : `${message.sender} left the chat`;
        messageElement.classList.add('event-message');
    } else {
        messageElement.innerHTML = `<strong>${message.sender}:</strong> ${message.content}`;
    }

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}
