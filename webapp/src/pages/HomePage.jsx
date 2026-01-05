import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard/ProductCard';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data.data); // A API encapsula os dados em `data`
      } catch (err) {
        setError('Não foi possível carregar os produtos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>A carregar produtos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1 className={styles.title}>Produtos Recentes</h1>
      <div className={styles.grid}>
        {products.length > 0 ? (
          products.map(product => <ProductCard key={product.id} product={product} />)
        ) : (
          <p>Nenhum produto encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
