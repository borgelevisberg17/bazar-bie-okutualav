document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('seller-application-form');

  /**
   * Handles the submission of the seller application form.
   * @param {Event} e - The form submission event.
   */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById('card-number').value;
    const expiryDate = document.getElementById('expiry-date').value;
    const cvv = document.getElementById('cvv').value;
    const terms = document.getElementById('terms').checked;

    if (!terms) {
      alert('Você deve concordar com os termos e condições.');
      return;
    }

    try {
      const response = await fetch('/api/seller-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          paymentInfo: {
            cardNumber,
            expiryDate,
            cvv
          }
        })
      });

      if (response.ok) {
        alert('Aplicação enviada com sucesso! Aguarde a aprovação do administrador.');
        window.location.href = 'profile.html';
      } else {
        const error = await response.json();
        alert(`Erro ao enviar aplicação: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Ocorreu um erro ao enviar sua aplicação. Tente novamente mais tarde.');
    }
  });
});
