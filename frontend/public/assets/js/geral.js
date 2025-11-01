document.addEventListener("DOMContentLoaded", () => {
    // This script can be expanded to handle global functionality
    // like dynamic header/footer loading if needed in the future.
    console.log("Global script initialized.");

    // Simple year updater for the footer
    const currentYearSpan = document.getElementById("currentYear");
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});
