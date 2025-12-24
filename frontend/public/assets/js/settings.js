import { showToast } from "./notifications.js";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "./services/api.js";
import { getUserSession, updateUserSession } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".settings-nav .nav-item");
  const panels = document.querySelectorAll(".settings-panel");
  const profileForm = document.getElementById("profile-settings-form");
  const securityForm = document.getElementById("security-settings-form");
  // Add other forms as needed (notifications, privacy)

  const currentUser = getUserSession()?.user;

  // Handle tab navigation
  const handleNavClick = (e) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute("href").substring(1);

    navLinks.forEach((link) => link.classList.remove("active"));
    e.currentTarget.classList.add("active");

    panels.forEach((panel) => {
      panel.classList.remove("active");
      if (panel.id === targetId) {
        panel.classList.add("active");
      }
    });
  };

  navLinks.forEach((link) => link.addEventListener("click", handleNavClick));

  // Pre-fill forms with user data
  const populateForms = async () => {
    if (!currentUser) return;

    try {
      const response = await getUserProfile(currentUser.id);
      const user = response.data;

      document.getElementById("full-name").value = user.name || "";
      document.getElementById("username").value = user.username || "";
      document.getElementById("bio").value = user.bio || "";
      document.getElementById("avatar-preview").src =
        user.avatar_url || "assets/images/placeholders/avatar.png";
    } catch (error) {
      showToast("Erro ao carregar dados do perfil.", "error");
    }
  };

  // Handle profile form submission
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitButton = profileForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "A Salvar...";

    const formData = new FormData();
    formData.append("name", document.getElementById("full-name").value);
    formData.append("username", document.getElementById("username").value);
    formData.append("bio", document.getElementById("bio").value);

    const avatarFile = document.getElementById("avatar-upload").files[0];
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const response = await updateUserProfile(formData);
      updateUserSession({ user: response.data }); // Update localStorage
      showToast("Perfil atualizado com sucesso!", "success");
      // Optionally, update the header avatar instantly
      document.querySelector(".profile-avatar").src = response.data.avatar_url;
    } catch (error) {
      showToast(error.message || "Erro ao atualizar perfil.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Salvar Alterações";
    }
  });

  // Handle security form submission
  securityForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitButton = securityForm.querySelector('button[type="submit"]');
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword !== confirmPassword) {
      showToast("As novas palavras-passe não coincidem.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "A Alterar...";

    try {
      await changePassword({ currentPassword, newPassword });
      showToast("Palavra-passe alterada com sucesso!", "success");
      securityForm.reset();
    } catch (error) {
      showToast(error.message || "Erro ao alterar a palavra-passe.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Alterar Palavra-passe";
    }
  });

  // Avatar preview logic
  document
    .getElementById("avatar-upload")
    .addEventListener("change", function (event) {
      const [file] = event.target.files;
      if (file) {
        document.getElementById("avatar-preview").src =
          URL.createObjectURL(file);
      }
    });

  // Initial setup
  const init = () => {
    if (!currentUser) {
      window.location.href = "/auth/login.html";
      return;
    }
    populateForms();
    // Set the initial active tab from URL hash or default to profile
    const hash = window.location.hash;
    if (hash) {
      const link = document.querySelector(`.settings-nav a[href="${hash}"]`);
      if (link) link.click();
    }
  };

  init();
});
