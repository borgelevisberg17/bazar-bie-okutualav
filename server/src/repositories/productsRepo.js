const { db, mode } = require("../config/db");
const { paginate } = require("../utils/pagination");

/**
 * Adds an `image_url` property to a product object from its `images` JSON field.
 * @param {Object} product - The product object.
 * @returns {Object} The product object with the `image_url` property added.
 */
const addImageUrl = product => {
    if (product && product.images) {
        try {
            const images = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
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
exports.list = async ({ page = 1, limit = 10, ...filters }) => {
    const { limit: pageLimit, offset } = paginate(page, limit);

    if (mode === "pg") {
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

        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }

        query += ` ORDER BY p.created_at DESC LIMIT $${
            params.length + 1
        } OFFSET $${params.length + 2}`;
        params.push(pageLimit, offset);

        return db.any(query, params);
    } else {
        let supabaseQuery = db
            .from("products")
            .select(`
                *,
                users!products_seller_id_fkey (
                    name,
                    avatar_url
                )
            `)
            .range(offset, offset + pageLimit - 1)
            .order("created_at", { ascending: false });

        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined) {
                const dbKey = key === 'sellerId' ? 'seller_id' : key;
                supabaseQuery = supabaseQuery.eq(dbKey, value);
            }
        }

        const { data, error } = await supabaseQuery;
        if (error) throw error;

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
                COALESCE(json_agg(DISTINCT pc.*) FILTER (WHERE pc.id IS NOT NULL), '[]') AS categories,
                COALESCE(json_agg(DISTINCT pv.*) FILTER (WHERE pv.id IS NOT NULL), '[]') AS variants,
                COALESCE(json_agg(DISTINCT pi.image_url) FILTER (WHERE pi.id IS NOT NULL), '[]') AS all_images
            FROM products p
            JOIN users u ON u.id = p.seller_id
            LEFT JOIN product_categories pc_map ON pc_map.product_id = p.id
            LEFT JOIN categories pc ON pc.id = pc_map.category_id
            LEFT JOIN product_variants pv ON pv.product_id = p.id
            LEFT JOIN product_images pi ON pi.product_id = p.id
            WHERE p.id = $1
            GROUP BY p.id, u.id;
        `;
        return db.oneOrNone(query, [id]);
    } else {
        const { data, error } = await db
            .from('products')
            .select(`
                *,
                users!products_seller_id_fkey (name, avatar_url, email),
                product_categories (categories (*)),
                product_variants (*),
                product_images (image_url)
            `)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (!data) return null;

        const { users, product_categories, product_variants, product_images, ...productData } = data;
        return {
            ...productData,
            seller_name: users?.name,
            seller_avatar_url: users?.avatar_url,
            seller_email: users?.email,
            categories: product_categories?.map(pc => pc.categories) || [],
            variants: product_variants || [],
            all_images: product_images?.map(img => img.image_url) || []
        };
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
        const { data, error } = await db
            .from("products")
            .select(`
                *,
                users!products_seller_id_fkey (name, avatar_url, email)
            `)
            .eq("id", id)
            .single();
            
        if (error && error.code !== 'PGRST116') throw error;
        if (!data) return null;

        const { users, ...productData } = data;
        const product = addImageUrl(productData);
        return {
            ...product,
            seller_name: users?.name,
            seller_avatar_url: users?.avatar_url,
            seller_email: users?.email
        };
    }
};

/**
 * Creates a new product in the database.
 * @param {string} sellerId - The internal ID of the seller.
 * @param {Object} p - The product data.
 * @returns {Promise<Object>} A promise that resolves to the newly created product object.
 */
exports.create = async (sellerId, p) => {
    if (mode === "pg") {
        return db.one(
            `
      INSERT INTO products
        (seller_id, name, description, price, currency, images, stock, tag, status)
      VALUES ($1, $2, $3, $4, COALESCE($5,'AOA'), $6, COALESCE($7,0), $8, $9)
      RETURNING *
      `,
            [
                sellerId,
                p.name,
                p.description,
                p.price,
                p.currency,
                p.images,
                p.stock,
                p.tag,
                p.status || 'active'
            ]
        );
    } else {
        const { data, error } = await db.from("products").insert([
            {
                seller_id: sellerId,
                name: p.name,
                description: p.description,
                price: p.price,
                currency: p.currency || "AOA",
                images: p.images,
                stock: p.stock || 0,
                tag: p.tag,
                status: p.status || 'active'
            }
        ]).select().single();
        
        if (error) throw error;
        return data;
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
                p.images,
                p.stock,
                p.tag,
                p.status
            ]
        );
    } else {
        const { data, error } = await db.from("products")
            .update({
                name: p.name,
                description: p.description,
                price: p.price,
                currency: p.currency,
                images: p.images,
                stock: p.stock,
                tag: p.tag,
                status: p.status,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
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
        const { error } = await db.from("products").delete().eq("id", id);
        if (error) throw error;
    }
};

/**
 * Likes a product.
 */
exports.like = async (productId, userId) => {
    if (mode === "pg") {
        return db.tx(async t => {
            await t.none(
                "INSERT INTO product_likes (product_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [productId, userId]
            );
            return t.one(
                "UPDATE products SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count",
                [productId]
            );
        });
    } else {
        await db.from("product_likes").insert([{ product_id: productId, user_id: userId }]);
        const { data, error } = await db.rpc('increment_likes', { row_id: productId });
        if (error) throw error;
        return data;
    }
};

/**
 * Adds a comment to a product.
 */
exports.addComment = async (productId, userId, comment) => {
    if (mode === "pg") {
        return db.tx(async t => {
            const newComment = await t.one(
                "INSERT INTO product_comments (product_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *",
                [productId, userId, comment]
            );
            await t.none(
                "UPDATE products SET comments_count = comments_count + 1 WHERE id = $1",
                [productId]
            );
            return newComment;
        });
    } else {
        const { data: newComment, error } = await db.from("product_comments").insert([{ product_id: productId, user_id: userId, comment: comment }]).select().single();
        if (error) throw error;
        await db.rpc('increment_comments', { row_id: productId });
        return newComment;
    }
};

/**
 * Unlikes a product.
 */
exports.unlike = async (productId, userId) => {
    if (mode === "pg") {
        return db.tx(async t => {
            await t.none("DELETE FROM product_likes WHERE product_id = $1 AND user_id = $2", [
                productId,
                userId
            ]);
            return t.one(
                "UPDATE products SET likes_count = likes_count - 1 WHERE id = $1 RETURNING likes_count",
                [productId]
            );
        });
    } else {
        await db.from("product_likes").delete().match({ product_id: productId, user_id: userId });
        const { data, error } = await db.rpc('decrement_likes', { row_id: productId });
        if (error) throw error;
        return data;
    }
};
