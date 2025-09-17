const db = require("../config/db");
const { paginate } = require("../utils/pagination");

// 📜 Listar produtos com paginação
exports.list = async ({ page, limit }) => {
  const { limit: pageLimit, offset } = paginate(page, limit);
  return db.any(
    `
    SELECT p.*, u.name as seller_name, u.email as seller_email
    FROM products p
    JOIN users u ON u.id = p.seller_id
    ORDER BY p.created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [pageLimit, offset]
  );
};

// 📜 Buscar produto por ID
exports.get = (id) =>
  db.oneOrNone(
    `
    SELECT p.*, u.name as seller_name, u.email as seller_email
    FROM products p
    JOIN users u ON u.id = p.seller_id
    WHERE p.id=$1
    `,
    [id]
  );

// ➕ Criar produto
exports.create = async (sellerUid, p) => {
  return db.one(
    `
    INSERT INTO products
      (seller_id, name, description, price, currency, images, stock, tag)
    SELECT id, $2, $3, $4, COALESCE($5,'AOA'), $6, COALESCE($7,0), $8
    FROM users WHERE firebase_uid=$1
    RETURNING *
    `,
    [
      sellerUid,
      p.name,
      p.description,
      p.price,
      p.currency,
      p.images,
      p.stock,
      p.tag,
    ]
  );
};

// ✏️ Atualizar produto
exports.update = (id, p) =>
  db.one(
    `
    UPDATE products
    SET name=$2,
        description=$3,
        price=$4,
        currency=$5,
        image_url=$6,
        stock=$7,
        tag=$8,
        updated_at=NOW()
    WHERE id=$1
    RETURNING *
    `,
    [
      id,
      p.name,
      p.description,
      p.price,
      p.currency,
      p.image_url,
      p.stock,
      p.tag,
    ]
  );

// ❌ Remover produto
exports.remove = (id) =>
  db.none("DELETE FROM products WHERE id=$1", [id]);