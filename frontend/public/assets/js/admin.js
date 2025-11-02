import { api } from './services/api.js';
import { showToast } from './notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        dashboard: document.getElementById('dashboard-section'),
        users: document.getElementById('users-section'),
        products: document.getElementById('products-section'),
        sellers: document.getElementById('sellers-section'),
    };

    const navLinks = document.querySelectorAll('.admin-nav a');
    const userList = document.getElementById('user-list');
    const pendingProductsList = document.getElementById('pending-products-list');
    const sellerApplicationsList = document.getElementById('seller-applications-list');
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const userSelect = document.getElementById('user-select');
    const editUserModal = document.getElementById('editUserModal');
    const editUserForm = document.getElementById('editUserForm');
    const editUserId = document.getElementById('editUserId');
    const editUserRole = document.getElementById('editUserRole');
    const closeModal = document.querySelector('.close-btn');

    const setActiveSection = (hash) => {
        const targetId = hash ? hash.substring(1) : 'dashboard-section';
        Object.values(sections).forEach(section => {
            section.style.display = section.id === targetId ? 'block' : 'none';
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${targetId}`);
        });
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const hash = e.currentTarget.getAttribute('href');
            window.location.hash = hash;
            setActiveSection(hash);
        });
    });

    const loadUsers = async () => {
        try {
            const users = await api.get('/users');
            userList.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.email}</td>
                    <td>${user.name}</td>
                    <td>${user.role}</td>
                    <td><button class="btn btn-sm btn-primary">Editar</button></td>
                </tr>
            `).join('');
        } catch (error) {
            showToast('Erro ao carregar utilizadores.', 'error');
        }
    };

    const loadPendingProducts = async () => {
        try {
            const products = await api.get('/products?status=pending');
            pendingProductsList.innerHTML = products.map(product => `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.seller.name}</td>
                    <td>
                        <button class="btn btn-sm btn-success" data-id="${product.id}" data-action="approve-product">Aprovar</button>
                        <button class="btn btn-sm btn-danger" data-id="${product.id}" data-action="reject-product">Rejeitar</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            showToast('Erro ao carregar produtos pendentes.', 'error');
        }
    };

    const loadSellerApplications = async () => {
        try {
            const applications = await api.get('/seller-applications?status=pending');
            sellerApplicationsList.innerHTML = applications.map(app => `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.user.email}</td>
                    <td>
                        <button class="btn btn-sm btn-success" data-id="${app.id}" data-action="approve-seller">Aprovar</button>
                        <button class="btn btn-sm btn-danger" data-id="${app.id}" data-action="reject-seller">Rejeitar</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            showToast('Erro ao carregar candidaturas de vendedores.', 'error');
        }
    };

    const handleAction = async (e) => {
        const target = e.target;
        const id = target.dataset.id;
        const action = target.dataset.action;

        if (!id || !action) return;

        try {
            if (action === 'approve-product') {
                await api.put(`/products/${id}/approve`);
                showToast('Produto aprovado!', 'success');
                loadPendingProducts();
            } else if (action === 'reject-product') {
                await api.delete(`/products/${id}`);
                showToast('Produto rejeitado.', 'info');
                loadPendingProducts();
            } else if (action === 'approve-seller') {
                await api.put(`/seller-applications/${id}/approve`);
                showToast('Vendedor aprovado!', 'success');
                loadSellerApplications();
            } else if (action === 'reject-seller') {
                await api.delete(`/seller-applications/${id}`);
                showToast('Vendedor rejeitado.', 'info');
                loadSellerApplications();
            }
        } catch (error) {
            showToast('Ocorreu um erro.', 'error');
        }
    };

    pendingProductsList.addEventListener('click', handleAction);
    sellerApplicationsList.addEventListener('click', handleAction);

    setActiveSection(window.location.hash);
    const fetchUsersForChat = async () => {
        try {
            const users = await api.get('/users');
            userSelect.innerHTML = users.map(user => `<option value="${user.id}">${user.name}</option>`).join('');
        } catch (error) {
            showToast('Erro ao carregar utilizadores para o chat.', 'error');
        }
    };

    const fetchMessages = async () => {
        try {
            const receiverId = userSelect.value;
            const messages = await api.get(`/messages/${receiverId}`);
            chatBox.innerHTML = messages.map(msg => `
                <div class="chat-message ${msg.sender_id === 'admin' ? 'sender' : 'receiver'}">
                    ${msg.message}
                </div>
            `).join('');
            chatBox.scrollTop = chatBox.scrollHeight;
        } catch (error) {
            showToast('Erro ao carregar mensagens.', 'error');
        }
    };

    const sendMessage = async () => {
        const message = chatInput.value;
        if (message.trim() === '') return;

        try {
            await api.post('/messages', {
                receiver_id: userSelect.value,
                message: message,
            });
            chatInput.value = '';
            fetchMessages();
        } catch (error) {
            showToast('Erro ao enviar mensagem.', 'error');
        }
    };

    sendMessageBtn.addEventListener('click', sendMessage);
    userSelect.addEventListener('change', fetchMessages);

    if (window.location.hash === '#chat-section') {
        fetchUsersForChat();
        fetchMessages();
    }

    const openEditModal = (user) => {
        editUserId.value = user.id;
        editUserRole.value = user.role;
        editUserModal.style.display = 'block';
    };

    const closeEditModal = () => {
        editUserModal.style.display = 'none';
    };

    userList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-primary')) {
            const userId = e.target.closest('tr').querySelector('td').textContent;
            try {
                const user = await api.get(`/users/${userId}`);
                openEditModal(user);
            } catch (error) {
                showToast('Erro ao carregar dados do utilizador.', 'error');
            }
        }
    });

    closeModal.addEventListener('click', closeEditModal);

    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editUserId.value;
        const role = editUserRole.value;
        try {
            await api.put(`/users/${id}`, { role });
            showToast('Utilizador atualizado com sucesso!', 'success');
            closeEditModal();
            loadUsers();
        } catch (error) {
            showToast('Erro ao atualizar utilizador.', 'error');
        }
    });

    loadUsers();
    loadPendingProducts();
    loadSellerApplications();
});
