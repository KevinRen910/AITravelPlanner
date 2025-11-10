const express = require('express');
const tripController = require('../controllers/tripController');
const auth = require('../middleware/auth'); // 导入认证中间件

const router = express.Router();

// 所有行程路由都需要认证
router.use(auth);

router.post('/', tripController.createTrip);
router.get('/user/:userId', tripController.getUserTrips);
router.get('/:id', tripController.getTripById);
router.put('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;