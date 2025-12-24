import { getSession, logout } from "./auth.js";

function updateUserUI() {
  const session = getSession();
  const isLoggedIn = !!session;

  // Desktop Header
  const authUserView = document.getElementById("auth-user-view");
  const guestUserView = document.getElementById("guest-user-view");
  const profileAvatar = document.getElementById("profile-avatar");
  const logoutBtn = document.getElementById("logout-btn");

  // Mobile Sidebar
  const authSidebarLinks = document.getElementById("auth-sidebar-links");
  const guestSidebarLinks = document.getElementById("guest-sidebar-links");
  const logoutBtnMobile = document.getElementById("logout-btn-mobile");

  // Bottom Nav
  const authRequiredLinks = document.querySelectorAll(".auth-required");

  if (isLoggedIn) {
    if (authUserView) authUserView.style.display = "flex";
    if (guestUserView) guestUserView.style.display = "none";
    if (authSidebarLinks) authSidebarLinks.style.display = "block";
    if (guestSidebarLinks) guestSidebarLinks.style.display = "none";

    if (profileAvatar) {
      profileAvatar.src =
        session.user.avatar_url || "/assets/images/placeholders/avatar.png";
    }

    authRequiredLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        if (!isLoggedIn) {
          e.preventDefault();
          window.location.href = "/auth/login.html";
        }
      });
    });
  } else {
    if (authUserView) authUserView.style.display = "none";
    if (guestUserView) guestUserView.style.display = "flex";
    if (authSidebarLinks) authSidebarLinks.style.display = "none";
    if (guestSidebarLinks) guestSidebarLinks.style.display = "block";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
}

function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDarkMode = document.body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    });
  }

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateUserUI();
  initTheme();
});
