const { db, mode } = require("../config/db");
const { paginate } = require("../utils/pagination");

// 📜 Listar produtos com paginação
exports.list = async ({ page, limit }) => {
    const { limit: pageLimit, offset } = paginate(page, limit);

    if (mode === "pg") {
        return db.any(
            `
      SELECT p.*,
             u.name as seller_name,
             u.avatar_url as seller_avatar
      FROM products p
      JOIN users u ON u.id = p.seller_id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
      `,
            [pageLimit, offset]
        );
    } else {
        // Supabase query with join and pagination
        const { data, error } = await db
            .from("products")
            .select(
                `
        *,
        users (
          name,
          avatar
        )
      `
            )
            .range(offset, offset + pageLimit - 1)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase error fetching products:", error);
            throw error;
        }

        // Flatten the response to match frontend expectations
        return data.map(p => {
            const { users, ...productData } = p;
            return {
                ...productData,
                seller_name: users ? users.name : "Vendedor Anônimo",
                seller_avatar: users ? users.avatar : null
            };
        });
    }
};

// 📜 Buscar produto por ID
exports.get = async id => {
    if (mode === "pg") {
        return db.oneOrNone(
            `
      SELECT p.*, u.name as seller_name, u.email as seller_email
      FROM products p
      JOIN users u ON u.id = p.seller_id
      WHERE p.id=$1
      `,
            [id]
        );
    } else {
        const { data, error } = await db.select("products");
        if (error) throw error;
        return data.find(p => p.id === id);
    }
};

// ➕ Criar produto
exports.create = async (sellerUid, p) => {
    if (mode === "pg") {
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
                p.tag
            ]
        );
    } else {
        // Supabase: pega usuário e insere
        const { data: users, error: userErr } = await db.select("users");
        if (userErr) throw userErr;
        const user = users.find(u => u.firebase_uid === sellerUid);
        if (!user) throw new Error("Usuário não encontrado");

        const { data, error } = await db.insert("products", [
            {
                seller_id: user.id,
                name: p.name,
                description: p.description,
                price: p.price,
                currency: p.currency || "AOA",
                images: p.images,
                stock: p.stock || 0,
                tag: p.tag
            }
        ]);
        if (error) throw error;
        return data[0];
    }
};

// ✏️ Atualizar produto
exports.update = async (id, p) => {
    if (mode === "pg") {
        return db.one(
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
                p.tag
            ]
        );
    } else {
        const { data, error } = await db.update(
            "products",
            {
                name: p.name,
                description: p.description,
                price: p.price,
                currency: p.currency,
                image_url: p.image_url,
                stock: p.stock,
                tag: p.tag
            },
            { id }
        );
        if (error) throw error;
        return data[0];
    }
};

// ❌ Remover produto
exports.remove = async id => {
    if (mode === "pg") {
        return db.none("DELETE FROM products WHERE id=$1", [id]);
    } else {
        const { error } = await db.delete("products", { id });
        if (error) throw error;
    }
};
