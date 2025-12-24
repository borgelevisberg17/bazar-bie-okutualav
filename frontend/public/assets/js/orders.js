document.addEventListener("DOMContentLoaded", async () => {
  const ordersListContainer = document.getElementById("orders-list");

  /**
   * Loads and displays the user's orders.
   * @returns {Promise<void>}
   */
  async function loadOrders() {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/orders/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const orders = await response.json();

      if (response.ok) {
        if (orders.length === 0) {
          ordersListContainer.innerHTML =
            "<p>Você ainda não fez nenhum pedido.</p>";
          return;
        }
        ordersListContainer.innerHTML = orders
          .map(
            (order) => `
                    <div class="order-item">
                        <div class="order-info">
                            <h3>Pedido #${order.id.slice(0, 8)}</h3>
                            <p>Data: ${new Date(order.created_at).toLocaleDateString()}</p>
                            <p>Status: ${order.status}</p>
                            <p>Total: AOA ${order.total_amount}</p>
                        </div>
                    </div>
                `,
          )
          .join("");
      } else {
        ordersListContainer.innerHTML = `<p>Erro ao carregar pedidos: ${orders.error}</p>`;
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      ordersListContainer.innerHTML =
        "<p>Ocorreu um erro ao carregar seus pedidos.</p>";
    }
  }

  loadOrders();
});
