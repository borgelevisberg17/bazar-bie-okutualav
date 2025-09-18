// server/src/controllers/orderController.js
const { db, mode } = require('../config/db');

// =======================
// Validar produtos (existe + estoque)
// =======================
async function validateProducts(products) {
  // Aqui você pode adaptar dependendo de como armazena produtos
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Produtos inválidos ou vazios');
  }

  for (const item of products) {
    if (!item.id || !item.quantity || item.quantity <= 0) {
      throw new Error(`Produto inválido: ${JSON.stringify(item)}`);
    }

    if (mode === 'pg') {
      const exists = await db.oneOrNone('SELECT stock FROM products WHERE id=$1', [item.id]);
      if (!exists) throw new Error(`Produto não encontrado: ${item.id}`);
      if (exists.stock < item.quantity) throw new Error(`Estoque insuficiente para o produto: ${item.id}`);
    } else {
      const { data, error } = await db.select('products').eq('id', item.id).single();
      if (error) throw error;
      if (!data) throw new Error(`Produto não encontrado: ${item.id}`);
      if (data.stock < item.quantity) throw new Error(`Estoque insuficiente para o produto: ${item.id}`);
    }
  }
}

// =======================
// Criar pedido + suporte a pagamentos múltiplos
// =======================
exports.createOrder = async (req, res, next) => {
  const { products, total, shipping_address, payments = [] } = req.body;
  const userId = req.user.uid;

  try {
    if (!products || products.length === 0 || !total) {
      return res.status(400).json({ error: "Produtos e total são obrigatórios" });
    }

    // ✅ Validar produtos
    await validateProducts(products);

    let order;
    if (mode === 'pg') {
      await db.tx(async t => {
        // Criar pedido
        order = await t.one(
          `INSERT INTO orders(user_id, products, total, payment_status, status, shipping_address)
           VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
          [userId, JSON.stringify(products), total, 'pending', 'pending_payment', shipping_address]
        );

        // Criar pagamentos, se existirem
        for (const p of payments) {
          await t.none(
            'INSERT INTO payments(order_id, amount, method, status) VALUES($1,$2,$3,$4)',
            [order.id, p.amount, p.method, p.amount >= total ? 'confirmed' : 'pending']
          );
        }
      });
    } else {
      // Supabase / NoSQL
      order = (await db.insert('orders', [{
        user_id: userId,
        products,
        total,
        payment_status: 'pending',
        status: 'pending_payment',
        shipping_address,
        created_at: new Date().toISOString()
      }]))?.data[0];

      // Criar pagamentos
      for (const p of payments) {
        await db.insert('payments', [{
          order_id: order.id,
          amount: p.amount,
          method: p.method,
          status: p.amount >= total ? 'confirmed' : 'pending',
          created_at: new Date().toISOString()
        }]);
      }
    }

    res.status(201).json({ message: 'Pedido criado com sucesso', order });
  } catch (error) {
    next(error);
  }
};

// =======================
// Listar pedidos de um usuário + histórico de pagamentos
// =======================
exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    let orders;

    if (mode === 'pg') {
      orders = await db.any('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
      for (const o of orders) {
        o.payments = await db.any('SELECT * FROM payments WHERE order_id=$1 ORDER BY created_at ASC', [o.id]);
      }
    } else {
      const { data, error } = await db.select('orders').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      orders = data;
      for (const o of orders) {
        const { data: payments, error: pErr } = await db.select('payments').eq('order_id', o.id).order('created_at', { ascending: true });
        if (pErr) throw pErr;
        o.payments = payments;
      }
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// =======================
// Buscar pedido por ID + histórico de pagamentos
// =======================
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let order;

    if (mode === 'pg') {
      order = await db.oneOrNone('SELECT * FROM orders WHERE id=$1', [id]);
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
      order.payments = await db.any('SELECT * FROM payments WHERE order_id=$1 ORDER BY created_at ASC', [order.id]);
    } else {
      const { data, error } = await db.select('orders').eq('id', id);
      if (error) throw error;
      order = data[0];
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

      const { data: payments, error: pErr } = await db.select('payments').eq('order_id', id).order('created_at', { ascending: true });
      if (pErr) throw pErr;
      order.payments = payments;
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};