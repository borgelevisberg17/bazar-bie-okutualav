const { db, mode } = require("../config/db");
const { paginate } = require("../utils/pagination");

/**
 * Adds an `image_url` property to a product object from its `images` JSON field.
 * @param {Object} product - The product object.
 * @returns {Object} The product object with the `image_url` property added.
 */
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

/**
 * Lists products with pagination.
 * @param {Object} options - The options for listing products.
 * @param {number} [options.page=1] - The page number.
 * @param {number} [options.limit=10] - The number of items per page.
 * @param {string} [options.status] - The product status to filter by.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of product objects.
 */
exports.list = async ({ page = 1, limit = 10, mode = "pg", ...filters }) => {
    const { limit: pageLimit, offset } = paginate(page, limit);

    if (mode === "pg") {
        // 🔹 Montagem dinâmica de filtros
        const filterKeys = Object.keys(filters).filter(
            key => filters[key] !== undefined
        );
        const whereClauses = filterKeys.map((key, index) => {
            const dbKey = key === 'sellerId' ? 'seller_id' : key;
            return `p.${dbKey} = $${index + 1}`;
        });
        const params = filterKeys.map(key => filters[key]);

        let query = `
      SELECT p.*,
             (p.images->0->>'url') AS image_url,
             u.name AS seller_name,
             u.avatar_url AS seller_avatar_url
      FROM products p
      JOIN users u ON u.id = p.seller_id
    `;

        // 🔹 Adiciona dinamicamente WHERE se houver filtros
        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }

        // 🔹 Adiciona paginação
        query += ` ORDER BY p.created_at DESC LIMIT $${
            params.length + 1
        } OFFSET $${params.length + 2}`;
        params.push(pageLimit, offset);

        return db.any(query, params);
    } else {
        // 🔹 Supabase (filtros dinâmicos)
        let supabaseQuery = db
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

        // Aplica dinamicamente filtros (status, category, etc)
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined)
                supabaseQuery = supabaseQuery.eq(key, value);
        }

        const { data, error } = await supabaseQuery;

        if (error) {
            console.error("Supabase error fetching products:", error);
            throw error;
        }

        // 🔹 Formata resultado
        return data.map(p => {
            const { users, ...productData } = p;
            const image_url = p.images?.[0]?.url ?? null;
            return {
                ...productData,
                image_url,
                seller_name: users?.name ?? "Vendedor Anônimo",
                seller_avatar_url: users?.avatar_url ?? null
            };
        });
    }
};

/**
 * Retrieves detailed information for a single product by its ID.
 * This includes seller, categories, variants, and all images.
 * @param {string} id - The ID of the product to retrieve.
 * @returns {Promise<Object|null>} A promise that resolves to the detailed product object, or null if not found.
 */
exports.getDetails = async (id) => {
    if (mode === "pg") {
        const query = `
            SELECT
                p.*,
                u.name AS seller_name,
                u.avatar_url AS seller_avatar_url,
                u.email AS seller_email,
                json_agg(DISTINCT pc.*) AS categories,
                json_agg(DISTINCT pv.*) AS variants,
                json_agg(DISTINCT pi.image_url) AS all_images
            FROM products p
            JOIN users u ON u.id = p.seller_id
            LEFT JOIN product_categories pc ON pc.product_id = p.id
            LEFT JOIN product_variants pv ON pv.product_id = p.id
            LEFT JOIN product_images pi ON pi.product_id = p.id
            WHERE p.id = $1
            GROUP BY p.id, u.id;
        `;
        return db.oneOrNone(query, [id]);
    } else {
        // Supabase implementation for getDetails
        const { data, error } = await db
            .from('products')
            .select(`
                *,
                users (name, avatar_url, email),
                product_categories (*),
                product_variants (*),
                product_images (image_url)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error("Supabase error fetching product details:", error);
            throw error;
        }

        if (data) {
            const { users, product_categories, product_variants, product_images, ...productData } = data;
            return {
                ...productData,
                seller_name: users?.name,
                seller_avatar_url: users?.avatar_url,
                seller_email: users?.email,
                categories: product_categories,
                variants: product_variants,
                all_images: product_images.map(img => img.image_url)
            };
        }
        return null;
    }
};

/**
 * Retrieves a single product by its ID.
 * @param {string} id - The ID of the product to retrieve.
 * @returns {Promise<Object|null>} A promise that resolves to the product object, or null if not found.
 */
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

/**
 * Creates a new product in the database.
 * @param {string} sellerUid - The Firebase UID of the seller.
 * @param {Object} p - The product data.
 * @returns {Promise<Object>} A promise that resolves to the newly created product object.
 */
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

/**
 * Updates an existing product in the database.
 * @param {string} id - The ID of the product to update.
 * @param {Object} p - The updated product data.
 * @returns {Promise<Object>} A promise that resolves to the updated product object.
 */
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

/**
 * Removes a product from the database.
 * @param {string} id - The ID of the product to remove.
 * @returns {Promise<void>}
 */
exports.remove = async id => {
    if (mode === "pg") {
        return db.none("DELETE FROM products WHERE id=$1", [id]);
    } else {
        const { error } = await db.delete("products", { id });
        if (error) throw error;
    }
};

/**
 * Likes a product.
 * @param {string} productId - The ID of the product to like.
 * @param {string} userId - The ID of the user liking the product.
 * @returns {Promise<Object>} A promise that resolves to the updated like count.
 */
exports.like = async (productId, userId) => {
    if (mode === "pg") {
        return db.tx(async t => {
            await t.none(
                "INSERT INTO product_likes (product_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [productId, userId]
            );
            const result = await t.one(
                "UPDATE products SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count",
                [productId]
            );
            return result;
        });
    } else {
        // Supabase implementation
        await db.from("product_likes").insert([{ product_id: productId, user_id: userId }]);
        const { data: product } = await db.from("products").select("likes_count").eq("id", productId).single();
        const { data: updatedProduct } = await db.from("products").update({ likes_count: product.likes_count + 1 }).eq("id", productId);
        return updatedProduct;
    }
};

/**
 * Unlikes a product.
 * @param {string} productId - The ID of the product to unlike.
 * @param {string} userId - The ID of the user unliking the product.
 * @returns {Promise<Object>} A promise that resolves to the updated like count.
 */
exports.unlike = async (productId, userId) => {
    if (mode === "pg") {
        return db.tx(async t => {
            await t.none("DELETE FROM product_likes WHERE product_id = $1 AND user_id = $2", [
                productId,
                userId
            ]);
            const result = await t.one(
                "UPDATE products SET likes_count = likes_count - 1 WHERE id = $1 RETURNING likes_count",
                [productId]
            );
            return result;
        });
    } else {
        // Supabase implementation
        await db.from("product_likes").delete().match({ product_id: productId, user_id: userId });
        const { data: product } = await db.from("products").select("likes_count").eq("id", productId).single();
        const { data: updatedProduct } = await db.from("products").update({ likes_count: product.likes_count - 1 }).eq("id", productId);
        return updatedProduct;
    }
};
