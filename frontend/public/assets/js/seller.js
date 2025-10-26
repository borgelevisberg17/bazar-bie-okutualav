document.addEventListener('DOMContentLoaded', async () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'seller') {
        window.location.href = 'index.html';
    }

    const productList = document.getElementById('product-list');
    const orderList = document.getElementById('order-list');
    const storeSettingsForm = document.getElementById('store-settings-form');
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    const sections = document.querySelectorAll('.dashboard-section');

    /**
     * Fetches and displays the seller's store data, including products and store settings.
     * @returns {Promise<void>}
     */
    async function getStoreData() {
        const accessToken = localStorage.getItem('accessToken');
        try {
            const myStoreRes = await fetch(`${API_URL}/stores/me`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (myStoreRes.status === 404) {
                // Handle case where user does not have a store yet
                console.log("User does not have a store yet.");
                return;
            }
            const myStore = await myStoreRes.json();

            if (myStoreRes.ok) {
                const storeSlug = myStore.slug;
                const [productsRes, storeRes] = await Promise.all([
                    fetch(`${API_URL}/stores/${storeSlug}/products`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                    fetch(`${API_URL}/stores/${storeSlug}`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
                ]);

                const products = await productsRes.json();
                const store = await storeRes.json();

                if (productsRes.ok) {
                    renderProducts(products);
                }
                if (storeRes.ok) {
                    document.getElementById('store-name').value = store.name;
                    document.getElementById('store-description').value = store.description;
                }
            }
        } catch (error) {
            console.error('Error fetching store data:', error);
        }
    }

    /**
     * Renders the list of products for the seller.
     * @param {Array<Object>} products - The array of product objects to render.
     */
    function renderProducts(products) {
        if (products.length === 0) {
            productList.innerHTML = '<p>Você ainda não adicionou nenhum produto.</p>';
            return;
        }
        productList.innerHTML = products.map(p => `
            <div class="product-item">
                <span>${p.name}</span>
                <span>AOA ${p.price}</span>
            </div>
        `).join('');
    }

    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sidebarBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.section).classList.add('active');
        });
    });

    const addProductBtn = document.getElementById('add-product-btn');
    const addProductModal = document.getElementById('add-product-modal');
    const addProductForm = document.getElementById('add-product-form');
    const modalClose = document.querySelector('.modal-close');

    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            addProductModal.style.display = 'block';
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            addProductModal.style.display = 'none';
        });
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('name', document.getElementById('product-name').value);
            formData.append('description', document.getElementById('product-description').value);
            formData.append('price', document.getElementById('product-price').value);
            formData.append('stock', document.getElementById('product-stock').value);
            formData.append('status', 'pending_approval');

            const images = document.getElementById('product-images').files;
            for (let i = 0; i < images.length; i++) {
                formData.append('images', images[i]);
            }

            try {
                const accessToken = localStorage.getItem('accessToken');
                const response = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    addProductModal.style.display = 'none';
                    getStoreData(); // Refresh the product list
                    // You can add a success toast here
                } else {
                    alert(`Error: ${result.error}`);
                }
            } catch (error) {
                console.error('Error adding product:', error);
                alert('An error occurred while adding the product.');
            }
        });
    }

    getStoreData();
});
