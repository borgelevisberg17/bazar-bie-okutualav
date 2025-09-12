const { Router } = require('express');
const router = Router();
router.get('/', (req,res) => res.json({ok:true, route:'/categories'}));
module.exports = router;
