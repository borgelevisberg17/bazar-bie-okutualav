import { login } from "./services/api.js";
import { showToast } from "./notifications.js";
import { setSession } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      const response = await login(email, password);
      setSession(response.data);
      showToast("Login bem-sucedido!", "success");
      window.location.href = "/";
    } catch (error) {
      showToast("Email ou senha inválidos.", "error");
    }
  });
});
