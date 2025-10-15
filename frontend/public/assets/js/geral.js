document.addEventListener("DOMContentLoaded", async () => {
const menuToggle = document.getElementById("menu-toggle");
    const sideMenu = document.getElementById("side-menu");
    const overlay = document.getElementById("mobile-overlay");

    if(menuToggle && sideMenu && overlay) {
        function openMenu() {
            menuToggle.classList.add("is-active");
            sideMenu.classList.add("is-active");
            overlay.classList.add("is-active");
            document.body.classList.add("menu-open");
        }

        function closeMenu() {
            menuToggle.classList.remove("is-active");
            sideMenu.classList.remove("is-active");
            overlay.classList.remove("is-active");
            document.body.classList.remove("menu-open");
            document.querySelectorAll(".has-submenu.is-open").forEach(submenu => {
                submenu.classList.remove("is-open");
                submenu.querySelector(".submenu").style.maxHeight = null;
            });
        }

        menuToggle.addEventListener("click", () => {
            if (sideMenu.classList.contains("is-active")) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        overlay.addEventListener("click", closeMenu);
    }

    document.querySelectorAll(".has-submenu > a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const parentLi = link.parentElement;
            const submenu = parentLi.querySelector(".submenu");

            if (parentLi.classList.contains("is-open")) {
                parentLi.classList.remove("is-open");
                submenu.style.maxHeight = null;
            } else {
                // Close other open submenus
                document.querySelectorAll(".has-submenu.is-open").forEach(openSubmenu => {
                    if(openSubmenu !== parentLi) {
                        openSubmenu.classList.remove("is-open");
                        openSubmenu.querySelector(".submenu").style.maxHeight = null;
                    }
                });
                parentLi.classList.add("is-open");
                submenu.style.maxHeight = submenu.scrollHeight + "px";
            }
        });
    });
});