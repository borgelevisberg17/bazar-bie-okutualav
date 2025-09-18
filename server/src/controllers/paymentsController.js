// server/src/controllers/paymentController.js
const mailer = require('../config/mailer');
const { db, mode } = require('../config/db');
const cloudinary = require('cloudinary').v2;

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================
// Criar pagamento
// =======================
exports.createPayment = async (req, res, next) => {
  const client = mode === "pg" ? await db.client() : null; // para transação PG
  try {
    const { orderId, amount, userEmail, method, receiptFileBase64, receiptFileType } = req.body;

    if (!orderId || !amount || !userEmail || !method) {
      return res.status(400).json({ error: 'orderId, amount, userEmail e method são obrigatórios.' });
    }

    // Validação de comprovante (PDF ou imagem)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (receiptFileBase64 && !allowedTypes.includes(receiptFileType)) {
      return res.status(400).json({ error: 'Comprovante inválido. Aceito apenas PDF ou imagens (jpg/png).' });
    }

    if (mode === "pg") await client.query('BEGIN');

    // 1️⃣ Atualiza status do pedido para "pending_payment" ou "processing"
    const initialStatus = method === 'card' ? 'processing' : 'pending_payment';
    if (mode === "pg") {
      await client.query('UPDATE orders SET status=$1, payment_status=$2 WHERE id=$3', [initialStatus, 'pending', orderId]);
    } else {
      const { error } = await db.update('orders', { status: initialStatus, payment_status: 'pending' }, { id: orderId });
      if (error) throw error;
    }

    // 2️⃣ Salvar comprovante no Cloudinary
    let receipt_url = null;
    if (receiptFileBase64) {
      const uploadResult = await cloudinary.uploader.upload(`data:${receiptFileType};base64,${receiptFileBase64}`, {
        folder: 'receipts',
        public_id: `order-${orderId}-${Date.now()}`,
        resource_type: "raw",
      });
      receipt_url = uploadResult.secure_url;
    }

    // 3️⃣ Registrar pagamento no DB
    const paymentStatus = receipt_url ? 'pending' : 'confirmed';
    let paymentId;
    if (mode === "pg") {
      const result = await client.query(
        'INSERT INTO payments(order_id, amount, method, receipt_url, status, created_at) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING id',
        [orderId, amount, method, receipt_url, paymentStatus]
      );
      paymentId = result[0].id;
    } else {
      const { data, error } = await db.insert('payments', [{
        order_id: orderId,
        amount,
        method,
        receipt_url,
        status: paymentStatus,
        created_at: new Date().toISOString()
      }]);
      if (error) throw error;
      paymentId = data[0].id;
    }

    // 4️⃣ Atualizar status do pedido se soma dos pagamentos >= total do pedido
    if (mode === "pg") {
      const { total_amount } = await client.query('SELECT total_amount FROM orders WHERE id=$1', [orderId]);
      const { sum } = await client.query('SELECT SUM(amount) as sum FROM payments WHERE order_id=$1 AND status IN ($2, $3)', [orderId, 'confirmed', 'pending']);
      if (sum >= total_amount) {
        await client.query('UPDATE orders SET status=$1, payment_status=$2 WHERE id=$3', ['paid', 'confirmed', orderId]);
      }
    } else {
      const { data: order } = await db.select('orders').eq('id', orderId).single();
      const { data: payments } = await db.select('payments').eq('order_id', orderId).in('status', ['confirmed', 'pending']);
      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
      if (totalPaid >= order.total_amount) {
        await db.update('orders', { status: 'paid', payment_status: 'confirmed', updated_at: new Date().toISOString() }, { id: orderId });
      }
    }

    // 5️⃣ Notificação usuário
    const userMail = {
      from: process.env.SMTP_FROM,
      to: userEmail,
      subject: `Confirmação do pagamento do Pedido #${orderId}`,
      html: `<h1>Recebemos seu pagamento!</h1>
             <p>Pedido ID: ${orderId}</p>
             <p>Valor: ${amount} Kz</p>
             <p>Método: ${method}</p>
             <p>Status do pagamento: ${paymentStatus === 'pending' ? 'Aguardando aprovação do admin' : 'Confirmado'}</p>`
    };
    await mailer.sendMail(userMail);

    // 6️⃣ Notificação admin
    const adminMail = {
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `Novo pagamento - Pedido #${orderId}`,
      html: `<h1>Novo pagamento recebido</h1>
             <p>Pedido ID: ${orderId}</p>
             <p>Cliente: ${userEmail}</p>
             <p>Valor: ${amount} Kz</p>
             <p>Método: ${method}</p>
             <p>Comprovante: ${receipt_url || 'Não enviado'}</p>`
    };
    await mailer.sendMail(adminMail);

    if (mode === "pg") await client.query('COMMIT');

    res.status(200).json({ message: 'Pagamento registrado. Usuário e admin notificados.', receipt_url });
  } catch (error) {
    if (mode === "pg") await client.query('ROLLBACK');
    console.error('Erro no processamento do pagamento:', error);
    next(error);
  } finally {
    if (client) client.release();
  }
};

// =======================
// Atualizar status do pagamento
// =======================
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentId, status } = req.body;
    if (!paymentId || !status) return res.status(400).json({ error: 'paymentId e status são obrigatórios' });

    if (mode === "pg") {
      await db.none('UPDATE payments SET status=$1, updated_at=NOW() WHERE id=$2', [status, paymentId]);
      if (status === 'confirmed') {
        await db.none(
          'UPDATE orders SET status=$1, payment_status=$2 WHERE id=(SELECT order_id FROM payments WHERE id=$3)',
          ['paid', 'confirmed', paymentId]
        );
      }
    } else {
      const { error } = await db.update('payments', { status, updated_at: new Date().toISOString() }, { id: paymentId });
      if (error) throw error;
      if (status === 'confirmed') {
        const { data: payment } = await db.select('payments').eq('id', paymentId).single();
        if (payment) await db.update('orders', { status: 'paid', payment_status: 'confirmed' }, { id: payment.order_id });
      }
    }

    res.json({ message: 'Status do pagamento atualizado e pedido confirmado se aprovado.' });
  } catch (error) {
    next(error);
  }
};

// =======================
// Listar pagamentos (admin)
// =======================
exports.listPayments = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode acessar.' });

    let payments;
    if (mode === 'pg') {
      payments = await db.any('SELECT * FROM payments ORDER BY created_at DESC');
    } else {
      const { data, error } = await db.select('payments').order('created_at', { ascending: false });
      if (error) throw error;
      payments = data;
    }

    res.json(payments);
  } catch (err) {
    next(err);
  }
};

// =======================
// Listar pagamentos pendentes (admin)
// =======================
exports.listPendingPayments = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode acessar.' });

    let payments;
    if (mode === 'pg') {
      payments = await db.any(
        `SELECT p.id as paymentId, p.order_id as orderId, o.user_email, p.amount, p.method, p.receipt_url, p.status, p.created_at as createdAt
         FROM payments p JOIN orders o ON p.order_id = o.id
         WHERE p.status='pending'
         ORDER BY p.created_at DESC`
      );
    } else {
      const { data, error } = await db.select('payments').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      payments = data;
    }

    res.json(payments);
  } catch (err) {
    next(err);
  }
};

// =======================
// Aprovar pagamento (admin)
// =======================
exports.approvePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'paymentId é obrigatório' });
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode aprovar.' });

    let payment;
    if (mode === 'pg') {
      payment = await db.one('UPDATE payments SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING order_id, amount, method, user_email', ['confirmed', paymentId]);
      await db.none('UPDATE orders SET status=$1, payment_status=$2 WHERE id=$3', ['paid', 'confirmed', payment.order_id]);
    } else {
      const { data, error } = await db.update('payments', { status: 'confirmed', updated_at: new Date().toISOString() }, { id: paymentId });
      if (error) throw error;
      payment = data[0];
      await db.update('orders', { status: 'paid', payment_status: 'confirmed', updated_at: new Date().toISOString() }, { id: payment.order_id });
    }

    // Notificar usuário
    const userMail = {
      from: process.env.SMTP_FROM,
      to: payment.user_email,
      subject: `Pagamento Aprovado - Pedido #${payment.order_id}`,
      html: `<h1>Seu pagamento foi aprovado!</h1>
             <p>Pedido ID: ${payment.order_id}</p>
             <p>Valor: ${payment.amount} Kz</p>
             <p>Método: ${payment.method}</p>
             <p>Status: Confirmado</p>`
    };
    await mailer.sendMail(userMail);

    res.json({ message: 'Pagamento aprovado e pedido atualizado.', receipt_url: payment.receipt_url });
  } catch (err) {
    next(err);
  }
};

// =======================
// Rejeitar pagamento (admin)
// =======================
exports.rejectPayment = async (req, res, next) => {
  try {
    const { paymentId, reason } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'paymentId é obrigatório' });
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas admin pode rejeitar.' });

    let payment;
    if (mode === 'pg') {
      payment = await db.one(
        'UPDATE payments SET status=$1, rejection_reason=$2, updated_at=NOW() WHERE id=$3 RETURNING order_id, user_email',
        ['rejected', reason || null, paymentId]
      );

      await db.none(
        'UPDATE orders SET payment_status=$1, status=$2, updated_at=NOW() WHERE id=$3',
        ['rejected', 'payment_failed', payment.order_id]
      );
    } else {
      const { data: paymentData, error: paymentErr } = await db.update(
        'payments',
        { status: 'rejected', rejection_reason: reason || null, updated_at: new Date().toISOString() },
        { id: paymentId }
      );
      if (paymentErr) throw paymentErr;

      const orderId = paymentData[0]?.order_id;
      const { error: orderErr } = await db.update(
        'orders',
        { status: 'payment_failed', payment_status: 'rejected', updated_at: new Date().toISOString() },
        { id: orderId }
      );
      if (orderErr) throw orderErr;

      payment = { order_id: orderId, user_email: paymentData[0]?.user_email };
    }

    // Notificar usuário que pagamento foi rejeitado
    const userMail = {
      from: process.env.SMTP_FROM,
      to: payment.user_email,
      subject: `Pagamento Rejeitado - Pedido #${payment.order_id}`,
      html: `<h1>Seu pagamento foi rejeitado</h1>
             <p>Pedido ID: ${payment.order_id}</p>
             <p>Motivo: ${reason || 'Não informado'}</p>
             <p>Status: Rejeitado</p>`
    };
    await mailer.sendMail(userMail);

    res.json({ message: 'Pagamento rejeitado, pedido atualizado e usuário notificado.' });
  } catch (err) {
    next(err);
  }
};