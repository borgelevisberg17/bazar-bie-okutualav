import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>Admin</h2>
        <nav className={styles.nav}>
          <Link to="/admin/dashboard">Dashboard</Link>
          <Link to="/admin/users">Utilizadores</Link>
          <Link to="/admin/products">Produtos</Link>
          <Link to="/admin/settings">Configurações</Link>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
