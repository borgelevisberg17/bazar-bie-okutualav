const { Router } = require('express');
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management routes
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Check the status of the transactions route.
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: The transactions route is working.
 */
router.get('/', (req,res) => res.json({ok:true, route:'/transactions'}));

module.exports = router;
