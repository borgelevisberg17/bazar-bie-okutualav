document.addEventListener('DOMContentLoaded', async () => {
  const userList = document.getElementById('user-list');
  const sellerApplicationsList = document.getElementById('seller-applications-list');
  const pendingProductsList = document.getElementById('pending-products-list');
  let token = null;
  let usersCache = [];

  const fetchSellerApplications = async () => {
    try {
      const response = await fetch('/api/seller-applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
      const { data: applications } = await response.json();
      renderSellerApplications(applications);
    } catch (error) {
      handleError(error, 'fetchSellerApplications');
    }
  };

  pendingProductsList.addEventListener('click', async (e) => {
    const productId = e.target.dataset.id;
    if (e.target.classList.contains('approve-product-btn')) {
      updateProductStatus(productId, 'active');
    } else if (e.target.classList.contains('reject-product-btn')) {
      updateProductStatus(productId, 'rejected');
    }
  });

  const updateProductStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Falha ao atualizar o status do produto.');
      await fetchPendingProducts();
    } catch (error) {
      handleError(error, 'updateProductStatus');
    }
  };

  const renderSellerApplications = (applications) => {
    if (applications.length === 0) {
      sellerApplicationsList.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma aplicação pendente.</td></tr>';
      return;
    }

    const rows = applications.map(app => `
      <tr id="application-row-${app.id}">
        <td>${app.user_id}</td>
        <td>${app.user_email}</td>
        <td>${new Date(app.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-success approve-btn" data-id="${app.id}">Aprovar</button>
          <button class="btn btn-sm btn-danger reject-btn" data-id="${app.id}">Rejeitar</button>
        </td>
      </tr>
    `).join('');
    sellerApplicationsList.innerHTML = rows;
  };

  const fetchPendingProducts = async () => {
    try {
      const response = await fetch('/api/products?status=pending_approval', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
      const { data: products } = await response.json();
      renderPendingProducts(products);
    } catch (error) {
      handleError(error, 'fetchPendingProducts');
    }
  };

  const renderPendingProducts = (products) => {
    if (products.length === 0) {
      pendingProductsList.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum produto pendente.</td></tr>';
      return;
    }

    const rows = products.map(prod => `
      <tr id="product-row-${prod.id}">
        <td>${prod.id}</td>
        <td>${prod.name}</td>
        <td>${prod.seller_name}</td>
        <td>${new Date(prod.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-success approve-product-btn" data-id="${prod.id}">Aprovar</button>
          <button class="btn btn-sm btn-danger reject-product-btn" data-id="${prod.id}">Rejeitar</button>
        </td>
      </tr>
    `).join('');
    pendingProductsList.innerHTML = rows;
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 403) {
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger"><h4>Acesso Negado</h4><p>Você não tem permissão para visualizar esta página.</p></div></div>';
        return;
      }
      if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);

      const { data: users } = await response.json();
      usersCache = users;
      renderUsers(users);
    } catch (error) {
      handleError(error);
    }
  };

  const renderUsers = (users) => {
    if (users.length === 0) {
      userList.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum usuário encontrado.</td></tr>';
      return;
    }

    const rows = users.map(u => `
      <tr id="user-row-${u.id}">
        <td>${u.id}</td>
        <td>${u.email}</td>
        <td>${u.name || 'N/A'}</td>
        <td><span class="badge badge-primary">${u.role}</span></td>
        <td><span class="badge badge-success">${u.status || 'ativo'}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-info edit-btn" data-id="${u.id}">Editar</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${u.id}">Deletar</button>
        </td>
      </tr>
    `).join('');
    userList.innerHTML = rows;
  };

  const showAlert = (message, type = 'danger', container = 'alert-container') => {
    const alertContainer = document.getElementById(container);
    if (!alertContainer) return;

    const alert = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `;
    alertContainer.innerHTML = alert;
  };

  const handleError = (error, context) => {
    console.error(`Erro em ${context}:`, error);
    showAlert(`Ocorreu um erro. ${error.message}`, 'danger');
  };

  // Lógica de Autenticação e Inicialização
  (async () => {
    try {
      const user = await new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(user => {
          if (user) resolve(user);
          else {
            window.location.href = '/auth/login.html';
            reject('Usuário não autenticado');
          }
        });
      });
      token = await user.getIdToken();
      await fetchUsers();
      await fetchSellerApplications();
      await fetchPendingProducts();
    } catch (error) {
      handleError(error, 'inicialização');
    }
  })();

  // Event Listeners para Ações
  userList.addEventListener('click', (e) => {
    const userId = e.target.dataset.id;
    if (e.target.classList.contains('edit-btn')) {
      const userToEdit = usersCache.find(u => u.id === userId);
      if (userToEdit) {
        document.getElementById('editUserId').value = userToEdit.id;
        document.getElementById('editUserRole').value = userToEdit.role;
        document.getElementById('editUserStatus').value = userToEdit.status || 'active';
        $('#editUserModal').modal('show');
      }
    } else if (e.target.classList.contains('delete-btn')) {
      if (confirm(`Tem certeza que deseja deletar o usuário ${userId}?`)) {
        deleteUser(userId);
      }
    }
  });

  sellerApplicationsList.addEventListener('click', async (e) => {
    const applicationId = e.target.dataset.id;
    if (e.target.classList.contains('approve-btn')) {
      updateSellerApplication(applicationId, 'approved');
    } else if (e.target.classList.contains('reject-btn')) {
      updateSellerApplication(applicationId, 'rejected');
    }
  });

  const updateSellerApplication = async (id, status) => {
    try {
      const response = await fetch(`/api/seller-applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Falha ao atualizar a aplicação.');
      await fetchSellerApplications();
    } catch (error) {
      handleError(error, 'updateSellerApplication');
    }
  };

  // Salvar alterações do Modal
  document.getElementById('saveUserChanges').addEventListener('click', async () => {
    const id = document.getElementById('editUserId').value;
    const role = document.getElementById('editUserRole').value;
    const status = document.getElementById('editUserStatus').value;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, status })
      });
      if (!response.ok) throw new Error('Falha ao atualizar usuário.');

      await fetchUsers(); // Re-renderiza a lista
      $('#editUserModal').modal('hide');
    } catch (error) {
      handleError(error, 'salvar alterações');
      showAlert('Não foi possível salvar as alterações. Tente novamente.', 'danger', 'modal-alert-container');
    }
  });

  const deleteUser = async (id) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar usuário.');

      showAlert('Usuário deletado com sucesso.', 'success');
      await fetchUsers(); // Re-carrega a lista para garantir consistência

    } catch (error) {
      handleError(error, 'deletar usuário');
      showAlert('Não foi possível deletar o usuário. Tente novamente.', 'danger');
    }
  };
});