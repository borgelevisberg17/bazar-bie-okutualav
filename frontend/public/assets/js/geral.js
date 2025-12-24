document.addEventListener("DOMContentLoaded", () => {
  const loadComponent = async (url, elementId) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      const text = await response.text();
      const element = document.getElementById(elementId);
      if (element) element.innerHTML = text;
    } catch (error) {
      console.error(`Error loading component:`, error);
    }
  };

  const updateNav = () => {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    const authRequiredLinks = document.querySelectorAll(".auth-required");
    const authSidebarLinks = document.getElementById("auth-sidebar-links");
    const guestSidebarLinks = document.getElementById("guest-sidebar-links");
    const authUserView = document.getElementById("auth-user-view");
    const guestUserView = document.getElementById("guest-user-view");
    const profileAvatar = document.getElementById("profile-avatar");

    if (userSession) {
      // Show authenticated user elements
      if (authUserView) authUserView.style.display = "flex";
      if (guestUserView) guestUserView.style.display = "none";
      if (authSidebarLinks) authSidebarLinks.style.display = "block";
      if (guestSidebarLinks) guestSidebarLinks.style.display = "none";

      authRequiredLinks.forEach((link) => {
        link.style.display = "inline-flex"; // Ensure they are visible
      });

      // Update avatar
      if (profileAvatar) {
        profileAvatar.src =
          userSession.user.avatar_url ||
          "/assets/images/placeholders/avatar.png";
      }
    } else {
      // Show guest user elements
      if (authUserView) authUserView.style.display = "none";
      if (guestUserView) guestUserView.style.display = "block";
      if (authSidebarLinks) authSidebarLinks.style.display = "none";
      if (guestSidebarLinks) guestSidebarLinks.style.display = "flex";

      // Add click listener to auth-required links for guests
      authRequiredLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault(); // Prevent navigation
          window.location.href = "/auth/login.html"; // Redirect to login
        });
      });
    }

    // Add logout functionality
    const logout = () => {
      localStorage.removeItem("user_session");
      window.location.href = "/auth/login.html";
    };

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const logoutBtnMobile = document.getElementById("logout-btn-mobile");
    if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", logout);
  };

  const setActiveNavIcon = () => {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");

    navItems.forEach((item) => {
      item.classList.remove("active");
      const itemPath = item.getAttribute("href");

      if (currentPath === itemPath) {
        item.classList.add("active");
      }
    });

    // Fallback for root path
    if (currentPath === "/") {
      const homeItem = document.getElementById("nav-home");
      if (homeItem) homeItem.classList.add("active");
    }
  };

  const setupFAQToggle = () => {
    const faqItems = document.querySelectorAll(".faq-item");
    if (!faqItems.length) return;

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      question.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        // Close all other items before toggling
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.classList.remove("active");
          }
        });

        // Toggle the clicked item
        item.classList.toggle("active");
      });
    });
  };

  const init = async () => {
    const headerPlaceholder = document.getElementById("header-placeholder");
    const footerPlaceholder = document.getElementById("footer-placeholder");

    if (headerPlaceholder) {
      await loadComponent("/common/header.html", "header-placeholder");
      updateNav(); // Handles auth state for header and sidebar
    }

    if (footerPlaceholder) {
      await loadComponent("/common/footer.html", "footer-placeholder");
    }

    // The bottom nav is part of the header component, so it's already loaded.
    // We just need to ensure the auth state and active icons are updated.
    setActiveNavIcon();

    setupFAQToggle();
    setupMobileMenu();
  };

  const setupMobileMenu = () => {
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const mobileSidebar = document.getElementById("mobile-sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const body = document.body;

    if (hamburgerBtn && mobileSidebar && sidebarOverlay) {
      hamburgerBtn.addEventListener("click", () => {
        mobileSidebar.classList.toggle("open");
        sidebarOverlay.classList.toggle("open");
        body.style.overflow = mobileSidebar.classList.contains("open")
          ? "hidden"
          : "";
      });

      sidebarOverlay.addEventListener("click", () => {
        mobileSidebar.classList.remove("open");
        sidebarOverlay.classList.remove("open");
        body.style.overflow = "";
      });
    }
  };

  init();
});
