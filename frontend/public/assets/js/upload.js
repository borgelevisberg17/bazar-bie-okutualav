import { showToast } from './notifications.js';
import { uploadProduct, getCategories } from './services/api.js';

import { getSubscriptionStatus } from './services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const subscriptionGate = document.getElementById('subscription-gate');
    const uploadContainer = document.getElementById('upload-container');
    const form = document.getElementById('upload-product-form');
    const imageInput = document.getElementById('product-images');
    const previewContainer = document.getElementById('image-preview-container');
    const categorySelect = document.getElementById('product-category');
    let imageFiles = [];

    // Fetch and populate categories
    const populateCategories = async () => {
        try {
            const response = await getCategories();
            const categories = response.data;
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            showToast('Erro ao carregar categorias.', 'error');
        }
    };

    // Handle image previews
    const handleImageFiles = () => {
        previewContainer.innerHTML = '';
        imageFiles = Array.from(imageInput.files).slice(0, 5); // Limit to 5 images

        imageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'image-preview-wrapper';
                previewWrapper.innerHTML = `
                    <img src="${e.target.result}" alt="Preview da Imagem ${index + 1}" class="image-preview">
                    <button class="remove-image-btn" data-index="${index}">&times;</button>
                `;
                previewContainer.appendChild(previewWrapper);
            };
            reader.readAsDataURL(file);
        });
    };

    // Remove an image from the preview and file list
    const removeImage = (index) => {
        imageFiles.splice(index, 1);
        // Create a new FileList and assign it to the input
        const newFileList = new DataTransfer();
        imageFiles.forEach(file => newFileList.items.add(file));
        imageInput.files = newFileList.files;
        handleImageFiles(); // Re-render previews
    };

    imageInput.addEventListener('change', handleImageFiles);

    previewContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-image-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            removeImage(index);
        }
    });

    // Check subscription status
    try {
        const response = await getSubscriptionStatus();
        if (response.data.has_subscription) {
            subscriptionGate.style.display = 'none';
            uploadContainer.style.display = 'block';
            populateCategories();
        } else {
            subscriptionGate.style.display = 'block';
            uploadContainer.style.display = 'none';
        }
    } catch (error) {
        subscriptionGate.style.display = 'block';
        uploadContainer.style.display = 'none';
        showToast('Erro ao verificar a sua subscrição.', 'error');
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value);
        formData.append('description', document.getElementById('product-description').value);
        formData.append('price', document.getElementById('product-price').value);
        formData.append('category_id', categorySelect.value);
        formData.append('location', document.getElementById('product-location').value);

        imageFiles.forEach(file => {
            formData.append('images', file);
        });

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'A Publicar...';

        try {
            await uploadProduct(formData);
            showToast('Produto publicado com sucesso!', 'success');
            form.reset();
            previewContainer.innerHTML = '';
            imageFiles = [];
            // Redirect to the user's profile or product page after a short delay
            setTimeout(() => {
                window.location.href = '/profile.html';
            }, 2000);
        } catch (error) {
            showToast(error.message || 'Erro ao publicar o produto. Tente novamente.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Publicar Produto';
        }
    });

    populateCategories();
});
