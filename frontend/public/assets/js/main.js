const productsGrid = document.getElementById('products-grid');
async function fetchProducts(){
  try{
    const res = await fetch('/api/products?limit=24');
    const json = await res.json();
    return json.data || [];
  }catch(e){
    console.error(e);
    return [];
  }
}
function renderProducts(products){
  productsGrid.innerHTML = '';
  const tpl = document.getElementById('product-card-template');
  products.forEach(product => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.product-name').textContent = product.name;
    node.querySelector('.product-price').textContent = `Kz ${Number(product.price).toLocaleString('pt-AO')}`;
    node.querySelector('.product-desc').textContent = product.description || '';
    node.querySelector('.product-image img').src = product.image_url || './assets/images/placeholders/product.png';
    node.querySelector('.seller-name').textContent = product.seller_name || 'Loja';
    lucide.createIcons();
    productsGrid.appendChild(node);
  });
}
(async ()=>{ const prods = await fetchProducts(); renderProducts(prods); })();
