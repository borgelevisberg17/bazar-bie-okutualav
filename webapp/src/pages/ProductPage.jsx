import React from 'react';
import { useParams } from 'react-router-dom';

const ProductPage = () => {
  const { id } = useParams();
  return (
    <div>
      <h1>Página do Produto</h1>
      <p>Detalhes para o produto com ID: {id}</p>
    </div>
  );
};

export default ProductPage;
