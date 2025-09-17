const mailer = require('../config/mailer');
const db = require('../config/db');

exports.createPayment = async (req, res, next) => {
    try {
        const { orderId, amount, userEmail } = req.body;

        if (!orderId || !amount || !userEmail) {
            return res.status(400).json({ error: 'orderId, amount, and userEmail are required.' });
        }

        // Simulating a successful payment
        console.log(`Simulating payment for order ${orderId} of amount ${amount}`);

        // Send confirmation email
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: `Confirmação do Pedido #${orderId}`,
            html: `<h1>Obrigado por sua compra!</h1><p>Seu pedido com o ID ${orderId} no valor de ${amount} Kz foi confirmado e está sendo processado.</p>`
        };

        await mailer.sendMail(mailOptions);
        console.log(`Confirmation email sent to ${userEmail}`);

        // Here you would typically update the order and payment status in the database
        // For example:
        // await db.none('UPDATE orders SET status = $1, payment_status = $2 WHERE id = $3', ['paid', 'confirmed', orderId]);

        res.status(200).json({ message: 'Pagamento processado e email de confirmação enviado.' });

    } catch (error) {
        console.error('Error processing payment:', error);
        next(error);
    }
};
