// frontend/public/assets/js/auth.js

function handleAuthState() {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    const isAuthenticated = userSession && userSession.token;

    // Select all elements that require authentication
    const authRequiredElements = document.querySelectorAll(".auth-required");

    // Select all views for authenticated and guest users
    const authViews = document.querySelectorAll("#auth-user-view, #auth-sidebar-links");
    const guestViews = document.querySelectorAll("#guest-user-view, #guest-sidebar-links");

    if (isAuthenticated) {
        // Show authenticated user views
        authViews.forEach(el => el.style.display = "block");
        guestViews.forEach(el => el.style.display = "none");

        // Show elements that require authentication
        authRequiredElements.forEach(el => {
            el.style.display = "block";
            el.classList.remove("hidden");
        });

    } else {
        // Show guest user views
        guestViews.forEach(el => el.style.display = "block");
        authViews.forEach(el => el.style.display = "none");

        // Hide elements that require authentication
        authRequiredElements.forEach(el => {
            el.style.display = "none";
        });
    }
}

// Run the function on DOMContentLoaded
document.addEventListener("DOMContentLoaded", handleAuthState);
