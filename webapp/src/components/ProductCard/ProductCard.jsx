import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ProductCard.module.css';

const ProductCard = ({ product }) => {
  // Garante que o preço seja exibido com duas casas decimais
  const formattedPrice = new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
  }).format(product.price);

  return (
    <div className={styles.card}>
      <Link to={`/product/${product.id}`}>
        <img
          src={product.images && product.images.length > 0 ? product.images[0].image_url : '/placeholder.png'}
          alt={product.name}
          className={styles.image}
        />
      </Link>
      <div className={styles.content}>
        <h3 className={styles.name}>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className={styles.price}>{formattedPrice}</p>
        <button className={styles.button}>Adicionar ao Carrinho</button>
      </div>
    </div>
  );
};

export default ProductCard;
