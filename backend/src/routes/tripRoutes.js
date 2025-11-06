const express = require('express');
const tripController = require('../controllers/tripController');

const router = express.Router();

router.post('/', tripController.createTrip);
router.get('/user/:userId', tripController.getUserTrips);
router.get('/:id', tripController.getTripById);
router.put('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;