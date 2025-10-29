import { updateUserUI, logout } from "./auth.js";

/**
 * Loads the navbar component into the page.
 * @returns {Promise<void>}
 */
async function loadNavbar() {
    try {
        const response = await fetch("/common/navbar.html");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const navbarHtml = await response.text();
        const mainHeader = document.getElementById("mainHeader");

        // The desktop-nav is now inside the loaded navbar.html, so we don't need to touch it here.
        // The side-menu is now loaded from navbar.html, so we append it to the body.
        document.body.insertAdjacentHTML("beforeend", navbarHtml);
    } catch (error) {
        console.error("Could not load the navbar:", error);
    }
}

/**
 * Initializes the menu functionality after the navbar is loaded.
 */
function initializeMenu() {
    updateUserUI(); // Update UI based on user login status

    const menuToggle = document.getElementById("menu-toggle");
    const sideMenu = document.getElementById("side-menu");
    const overlay = document.getElementById("mobile-overlay");

    if (!menuToggle || !sideMenu || !overlay) {
        console.error("Menu elements not found after loading navbar.");
        return; // Exit if menu elements are not found
    }

    // Add logout button to the menu
    const menuNav = document.querySelector(".menu-nav ul");
    if (menuNav) {
        const logoutButton = document.createElement("li");
        logoutButton.innerHTML = `
            <a href="#" id="logout-button">
                <span class="nav-icon"><i data-lucide="log-out"></i></span>
                Sair
            </a>
        `;
        menuNav.appendChild(logoutButton);

        document
            .getElementById("logout-button")
            .addEventListener("click", event => {
                event.preventDefault();
                logout();
            });
    }

    const openMenu = () => {
        menuToggle.classList.add("is-active");
        sideMenu.classList.add("is-active");
        overlay.classList.add("is-active");
        document.body.classList.add("menu-open");
    };

    const closeMenu = () => {
        menuToggle.classList.remove("is-active");
        sideMenu.classList.remove("is-active");
        overlay.classList.remove("is-active");
        document.body.classList.remove("menu-open");
        document.querySelectorAll(".has-submenu.is-open").forEach(submenu => {
            submenu.classList.remove("is-open");
            submenu.querySelector(".submenu").style.maxHeight = null;
        });
    };

    menuToggle.addEventListener("click", () => {
        sideMenu.classList.contains("is-active") ? closeMenu() : openMenu();
    });

    overlay.addEventListener("click", closeMenu);

    document.querySelectorAll(".has-submenu > a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const parentLi = link.parentElement;
            const submenu = parentLi.querySelector(".submenu");

            if (parentLi.classList.contains("is-open")) {
                parentLi.classList.remove("is-open");
                submenu.style.maxHeight = null;
            } else {
                document
                    .querySelectorAll(".has-submenu.is-open")
                    .forEach(openSubmenu => {
                        if (openSubmenu !== parentLi) {
                            openSubmenu.classList.remove("is-open");
                            openSubmenu.querySelector(
                                ".submenu"
                            ).style.maxHeight = null;
                        }
                    });
                parentLi.classList.add("is-open");
                submenu.style.maxHeight = submenu.scrollHeight + "px";
            }
        });
    });
}

// Load the navbar and then initialize the menu
document.addEventListener("DOMContentLoaded", async () => {
    await loadNavbar();
    initializeMenu();
});
