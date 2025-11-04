import { getConversations, getMessagesWithUser, createMessage } from './services/api.js';
import { showToast } from './notifications.js';
import { getSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const conversationsList = document.getElementById('conversations-list');
    const chatHeader = document.querySelector('.chat-header h3');
    const chatAvatar = document.querySelector('.chat-header .avatar');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const user = getSession()?.user;

    if (!user) {
        window.location.href = '/auth/login.html';
        return;
    }

    let conversations = [];
    let activeConversation = null;

    const renderConversations = () => {
        if (!conversationsList) return;
        const conversationsHTML = conversations.map(convo => `
            <div class="conversation-item ${activeConversation?.id === convo.id ? 'active' : ''}" data-conversation-id="${convo.id}">
                <img src="${convo.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="User Avatar" class="avatar">
                <div class="conversation-details">
                    <div class="conversation-header">
                        <span class="user-name">${convo.name}</span>
                        <span class="message-time">${new Date(convo.created_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p class="last-message">${convo.last_message}</p>
                </div>
            </div>
        `).join('');
        conversationsList.innerHTML = conversationsHTML;
    };

    const renderMessages = (messages) => {
        if (!chatMessages) return;
        const messagesHTML = messages.map(msg => `
            <div class="message-bubble ${msg.from_user_id === user.id ? 'outgoing' : 'incoming'}">
                <p>${msg.body}</p>
                <span class="message-timestamp">${new Date(msg.created_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `).join('');
        chatMessages.innerHTML = messagesHTML;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const loadConversations = async () => {
        try {
            const response = await getConversations();
            conversations = response.data;
            renderConversations();
        } catch (error) {
            showToast('Erro ao carregar as suas conversas.', 'error');
        }
    };

    const setActiveConversation = async (conversationId) => {
        activeConversation = conversations.find(c => c.id === conversationId);
        if (activeConversation) {
            chatHeader.textContent = activeConversation.name;
            chatAvatar.src = activeConversation.avatar_url || 'assets/images/placeholders/avatar.png';
            renderConversations(); // Re-render to show active state
            try {
                const response = await getMessagesWithUser(conversationId);
                renderMessages(response.data);
            } catch (error) {
                showToast('Erro ao carregar as mensagens.', 'error');
            }
        }
    };

    sendMessageBtn.addEventListener('click', async () => {
        const message = messageInput.value;
        if (message && activeConversation) {
            try {
                await createMessage({
                    receiver_id: activeConversation.id,
                    message: message
                });
                messageInput.value = '';
                setActiveConversation(activeConversation.id); // Reload messages
            } catch (error) {
                showToast('Erro ao enviar a sua mensagem.', 'error');
            }
        }
    });

    conversationsList.addEventListener('click', (e) => {
        const conversationItem = e.target.closest('.conversation-item');
        if (conversationItem) {
            const conversationId = conversationItem.dataset.conversationId;
            setActiveConversation(conversationId);
        }
    });

    loadConversations();
});
