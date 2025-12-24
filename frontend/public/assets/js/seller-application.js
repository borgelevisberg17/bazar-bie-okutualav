document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("seller-application-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const nif = document.getElementById("nif").value;
    const storeName = document.getElementById("storeName").value;
    const storeDescription = document.getElementById("storeDescription").value;
    const cardNumber = document.getElementById("cardNumber").value;
    const expiryDate = document.getElementById("expiryDate").value;
    const cvv = document.getElementById("cvv").value;
    const terms = document.getElementById("terms").checked;

    if (!terms) {
      showToast("Você deve concordar com os termos e condições.", "warning");
      return;
    }

    if (!cardNumber || !expiryDate || !cvv) {
      showToast("Por favor, preencha os detalhes do pagamento.", "warning");
      return;
    }

    const session = JSON.parse(localStorage.getItem("user_session"));
    const token = session ? session.token : null;

    if (!token) {
      showToast("Faça login para se candidatar.", "error");
      return;
    }

    try {
      const response = await fetch("/api/seller-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          nif,
          storeName,
          storeDescription,
        }),
      });

      if (response.ok) {
        showToast(
          "Aplicação enviada com sucesso! Aguarde a aprovação do administrador.",
          "success",
        );
        window.location.href = "profile.html";
      } else {
        const error = await response.json();
        showToast(`Erro ao enviar aplicação: ${error.message}`, "error");
      }
    } catch (error) {
      console.error("Erro:", error);
      showToast(
        "Ocorreu um erro ao enviar sua aplicação. Tente novamente mais tarde.",
        "error",
      );
    }
  });
});
