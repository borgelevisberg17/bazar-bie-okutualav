import { showToast } from './notifications.js';
import { getConversations, getMessages, sendMessage } from './services/api.js';
import { getUserSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const conversationsList = document.getElementById('conversations-list');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const chatHeader = document.querySelector('.chat-area .chat-header h3');
    const chatAvatar = document.querySelector('.chat-area .chat-header .avatar');

    let currentConversationId = null;
    const currentUser = getUserSession()?.user;

    const renderConversations = (conversations) => {
        conversationsList.innerHTML = '';
        if (conversations.length === 0) {
            conversationsList.innerHTML = '<p class="empty-list">Nenhuma conversa encontrada.</p>';
            return;
        }
        conversations.forEach(convo => {
            const otherUser = convo.participants.find(p => p.id !== currentUser.id);
            if (!otherUser) return;

            const convoItem = document.createElement('div');
            convoItem.className = 'conversation-item';
            convoItem.dataset.conversationId = convo.id;
            convoItem.innerHTML = `
                <img src="${otherUser.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${otherUser.name}" class="avatar">
                <div class="conversation-details">
                    <div class="conversation-header">
                        <span class="user-name">${otherUser.name}</span>
                        <span class="message-time">${new Date(convo.last_message.created_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p class="last-message">${convo.last_message.content}</p>
                </div>
            `;
            convoItem.addEventListener('click', () => loadConversation(convo.id, otherUser));
            conversationsList.appendChild(convoItem);
        });
    };

    const loadConversation = async (conversationId, otherUser) => {
        currentConversationId = conversationId;

        // Highlight active conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.conversationId === conversationId) {
                item.classList.add('active');
            }
        });

        // Update chat header
        chatHeader.textContent = otherUser.name;
        chatAvatar.src = otherUser.avatar_url || 'assets/images/placeholders/avatar.png';

        try {
            const response = await getMessages(conversationId);
            renderMessages(response.data);
        } catch (error) {
            showToast('Erro ao carregar mensagens.', 'error');
        }
    };

    const renderMessages = (messages) => {
        chatMessages.innerHTML = '';
        messages.forEach(message => {
            appendMessage(message);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    };

    const appendMessage = (message) => {
        const messageBubble = document.createElement('div');
        const isOutgoing = message.sender_id === currentUser.id;
        messageBubble.className = `message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`;
        messageBubble.innerHTML = `
            <p>${message.content}</p>
            <span class="message-timestamp">${new Date(message.created_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        chatMessages.appendChild(messageBubble);
    };

    const handleSendMessage = async () => {
        const content = messageInput.value.trim();
        if (!content || !currentConversationId) return;

        try {
            const response = await sendMessage(currentConversationId, content);
            appendMessage(response.data);
            messageInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            showToast('Erro ao enviar mensagem.', 'error');
        }
    };

    const init = async () => {
        if (!currentUser) {
            window.location.href = '/auth/login.html';
            return;
        }

        try {
            const response = await getConversations();
            renderConversations(response.data);

            // Automatically load the first conversation if it exists
            if (response.data.length > 0) {
                 const firstConvo = response.data[0];
                 const otherUser = firstConvo.participants.find(p => p.id !== currentUser.id);
                 if(otherUser) {
                    loadConversation(firstConvo.id, otherUser);
                 }
            } else {
                 document.querySelector('.chat-area').innerHTML = '<div class="empty-chat"><i class="fas fa-comments"></i><p>Selecione uma conversa para começar a falar.</p></div>';
            }
        } catch (error) {
            showToast('Erro ao carregar conversas.', 'error');
            conversationsList.innerHTML = '<p class="empty-list error">Não foi possível carregar as suas conversas.</p>';
        }
    };

    sendMessageBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });

    init();
});
