const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

// 地理编码
router.post('/geocode', mapController.geocode);

// 逆地理编码
router.post('/reverse-geocode', mapController.reverseGeocode);

// 搜索地点
router.post('/search-places', mapController.searchPlaces);

// 路径规划
router.post('/driving-route', mapController.drivingRoute);

// 获取天气
router.post('/weather', mapController.getWeather);

// IP定位
router.post('/ip-location', mapController.ipLocation);

// 检查服务状态
router.get('/status', mapController.checkStatus);

module.exports = router;