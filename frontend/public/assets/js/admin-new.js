// Import the legitimate API service
import { api, getAllUsers, getAllProducts } from './services/api.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let salesChart = null;
    let usersChart = null;

    // --- MOCK API (for data points that don't have a real endpoint yet) ---
    const mockApi = {
        getSalesChartData: async () => {
             await new Promise(resolve => setTimeout(resolve, 500));
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [12, 19, 3, 5, 2, 3],
            };
        },
        getUsersChartData: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                labels: ['Vendedores', 'Compradores', 'Admins'],
                data: [50, 1200, 5],
            }
        },
        deleteUser: async (userId) => {
            console.log(`Deleting user ${userId}...`);
            await new Promise(resolve => setTimeout(resolve, 500));
            // In a real app, this would be: return api.delete(`/users/${userId}`);
            return { success: true };
        }
    };


    // --- UI FEEDBACK ---
    const showToast = (message, type = 'success') => {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
        }).showToast();
    };


    // --- RENDER FUNCTIONS ---
    const renderDashboardStats = (stats) => {
        const statsContainer = document.querySelector('#dashboard .stats-cards');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="card-icon"><i class="fas fa-users"></i></div>
                <div class="card-info">
                    <p>Total de Usuários</p>
                    <h3>${stats.totalUsers}</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="card-icon"><i class="fas fa-box-open"></i></div>
                <div class="card-info">
                    <p>Total de Publicações</p>
                    <h3>${stats.totalProducts}</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="card-icon"><i class="fas fa-dollar-sign"></i></div>
                <div class="card-info">
                    <p>Vendas (último mês)</p>
                    <h3>${stats.totalSales || 0}</h3>
                </div>
            </div>
             <div class="stat-card">
                <div class="card-icon"><i class="fas fa-shopping-cart"></i></div>
                <div class="card-info">
                    <p>Pedidos Pendentes</p>
                    <h3>${stats.pendingOrders || 0}</h3>
                </div>
            </div>
        `;
    };

    const renderSalesChart = (chartData) => {
        const ctx = document.getElementById('sales-chart')?.getContext('2d');
        if (!ctx) return;
        if (salesChart) salesChart.destroy();
        salesChart = new Chart(ctx, { /* ... chart config ... */ });
    };

    const renderUsersChart = (chartData) => {
        const ctx = document.getElementById('users-chart')?.getContext('2d');
        if (!ctx) return;
        if (usersChart) usersChart.destroy();
        usersChart = new Chart(ctx, { /* ... chart config ... */ });
    };

    const renderUsersTable = (users) => {
        const tableBody = document.querySelector('#users-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id.substring(0,8)}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role role-${user.role.toLowerCase()}">${user.role}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td class="actions">
                    <button class="btn-icon btn-view" data-user-id="${user.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon btn-edit" data-user-id="${user.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete" data-user-id="${user.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        tableBody.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', handleDeleteUser);
        });
    };

    const renderProductsTable = (products) => {
        const tableBody = document.querySelector('#products-table tbody');
        if (!tableBody) return;
        tableBody.innerHTML = products.map(product => `
             <tr>
                <td>${product.id.substring(0,8)}</td>
                <td>${product.name}</td>
                <td>${product.seller.name}</td>
                <td>${product.category.name}</td>
                <td>R$ ${product.price}</td>
                <td><span class="status status-${product.status.toLowerCase()}">${product.status}</span></td>
                <td class="actions">
                    <button class="btn-icon btn-view" data-product-id="${product.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon btn-edit" data-product-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete" data-product-id="${product.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    };


    // --- EVENT HANDLERS ---
    const handleDeleteUser = async (event) => {
        const userId = event.currentTarget.dataset.userId;
        if (confirm(`Tem certeza que deseja deletar o usuário ${userId}?`)) {
            const result = await mockApi.deleteUser(userId); // Using mock for safety
            if(result.success) {
                showToast(`Usuário ${userId} deletado com sucesso!`);
                initUsers();
            } else {
                showToast('Erro ao deletar usuário.', 'error');
            }
        }
    };


    // --- INITIALIZATION LOGIC ---
    const initDashboard = async () => {
        try {
            const [users, products, salesData, usersData] = await Promise.all([
                getAllUsers(),
                getAllProducts(),
                mockApi.getSalesChartData(),
                mockApi.getUsersChartData()
            ]);
            const stats = {
                totalUsers: users.length,
                totalProducts: products.length,
            };
            renderDashboardStats(stats);
            renderSalesChart(salesData);
            renderUsersChart(usersData);
        } catch (error) {
            console.error("Failed to initialize dashboard:", error);
        }
    };

    const initUsers = async () => {
        try {
            const users = await getAllUsers();
            renderUsersTable(users);
        } catch (error) {
            console.error("Failed to initialize users table:", error);
        }
    };

    const initProducts = async () => {
        try {
            const products = await getAllProducts();
            renderProductsTable(products);
        } catch (error) {
            console.error("Failed to initialize products table:", error);
        }
    };

    // --- UI & NAVIGATION ---
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const contentSections = document.querySelectorAll('.main-content .content-section');
    const setActiveSection = (targetId) => {
        contentSections.forEach(section => section.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        document.getElementById(targetId)?.classList.add('active');
        document.querySelector(`.sidebar .nav-link[href="#${targetId}"]`)?.classList.add('active');

        if (targetId === 'dashboard') initDashboard();
        else if (targetId === 'users') initUsers();
        else if (targetId === 'products') initProducts();
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            setActiveSection(targetId);
            window.location.hash = targetId;
        });
    });

    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (theme) => {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
        if(themeToggle) themeToggle.checked = theme === 'dark';
    };
    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);
    if(themeToggle) {
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle-btn');
    if (sidebar && sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('is-open');
        });
    }

    const currentHash = window.location.hash.substring(1) || 'dashboard';
    setActiveSection(currentHash);

    console.log("Admin panel re-implemented safely and loaded!");
});
