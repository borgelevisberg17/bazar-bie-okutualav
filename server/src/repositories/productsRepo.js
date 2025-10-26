const { db, mode } = require("../config/db");
const { paginate } = require("../utils/pagination");

// Helper para adicionar image_url a partir do JSON de imagens
const addImageUrl = product => {
    if (product && product.images && typeof product.images === "string") {
        try {
            const images = JSON.parse(product.images);
            if (Array.isArray(images) && images.length > 0) {
                product.image_url = images[0].url;
            }
        } catch (e) {
            console.error("Erro ao parsear JSON de imagens:", e);
            product.image_url = null;
        }
    }
    return product;
};

// 📜 Listar produtos com paginação
exports.list = async ({ page, limit, status }) => {
    const { limit: pageLimit, offset } = paginate(page, limit);

    if (mode === "pg") {
        let query = `
      SELECT p.*,
             (p.images->0->>'url') as image_url,
             u.name as seller_name,
             u.avatar_url as seller_avatar_url
      FROM products p
      JOIN users u ON u.id = p.seller_id
    `;
        const params = [];
        if (status) {
            query += " WHERE p.status = $1";
            params.push(status);
        }
        query += " ORDER BY p.created_at DESC LIMIT $2 OFFSET $3";
        params.push(pageLimit, offset);

        return db.any(query, params);
    } else {
        // Supabase query com join e paginação
        const { data, error } = await db
            .from("products")
            .select(
                `
        *,
        users (
          name,
          avatar_url
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
            const image_url =
                p.images && p.images.length > 0 ? p.images[0].url : null;
            return {
                ...productData,
                image_url,
                seller_name: users ? users.name : "Vendedor Anônimo",
                seller_avatar_url: users ? users.avatar_url : null
            };
        });
    }
};

// 📜 Buscar produto por ID
exports.get = async id => {
    if (mode === "pg") {
        return db.oneOrNone(
            `
      SELECT p.*,
             (p.images->0->>'url') as image_url,
             u.name as seller_name,
             u.avatar_url as seller_avatar_url,
             u.email as seller_email
      FROM products p
      JOIN users u ON u.id = p.seller_id
      WHERE p.id=$1
      `,
            [id]
        );
    } else {
        const { data, error } = await db.select("products"); // Simplificado
        if (error) throw error;
        const product = data.find(p => p.id === id);
        return addImageUrl(product); // Adiciona image_url
    }
};

// ➕ Criar produto
exports.create = async (sellerUid, p) => {
    if (mode === "pg") {
        return db.one(
            `
      INSERT INTO products
        (seller_id, name, description, price, currency, images, stock, tag, status)
      SELECT id, $2, $3, $4, COALESCE($5,'AOA'), $6, COALESCE($7,0), $8, $9
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
                p.status
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
                images: p.images, // Deve ser um JSON
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
      SET name=COALESCE($2, name),
          description=COALESCE($3, description),
          price=COALESCE($4, price),
          currency=COALESCE($5, currency),
          images=COALESCE($6, images),
          stock=COALESCE($7, stock),
          tag=COALESCE($8, tag),
          status=COALESCE($9, status),
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
                p.images, // Corrigido para images
                p.stock,
                p.tag,
                p.status
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
                images: p.images, // Corrigido para images
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
