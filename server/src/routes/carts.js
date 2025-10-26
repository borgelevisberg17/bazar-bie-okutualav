const { Router } = require('express');
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Carts
 *   description: Cart management routes
 */

/**
 * @swagger
 * /carts:
 *   get:
 *     summary: Check the status of the carts route.
 *     tags: [Carts]
 *     responses:
 *       200:
 *         description: The carts route is working.
 */
router.get('/', (req,res) => res.json({ok:true, route:'/carts'}));

module.exports = router;
