import { showToast } from './notifications.js';
import { sendContactMessage } from './services/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            const submitButton = contactForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'A Enviar...';

            try {
                await sendContactMessage({ name, email, subject, message });
                showToast('Mensagem enviada com sucesso! Entraremos em contacto em breve.', 'success');
                contactForm.reset();
            } catch (error) {
                showToast(error.message || 'Ocorreu um erro ao enviar a sua mensagem. Tente novamente.', 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Mensagem';
            }
        });
    }
});
