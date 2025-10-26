/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {'success' | 'error'} [type='success'] - The type of toast.
 */
function showToast(message, type = 'success') {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    backgroundColor: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
  }).showToast();
}
