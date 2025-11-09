const mapService = require('../services/mapService');

class MapController {
  /**
   * 地理编码
   */
  async geocode(req, res) {
    try {
      const { address, city } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: '地址不能为空' });
      }

      const result = await mapService.geocode(address, city);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 逆地理编码
   */
  async reverseGeocode(req, res) {
    try {
      const { longitude, latitude } = req.body;
      
      if (!longitude || !latitude) {
        return res.status(400).json({ error: '经纬度不能为空' });
      }

      const result = await mapService.reverseGeocode(longitude, latitude);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 搜索地点
   */
  async searchPlaces(req, res) {
    try {
      const { keyword, city, types, page, size } = req.body;
      
      if (!keyword) {
        return res.status(400).json({ error: '搜索关键词不能为空' });
      }

      const result = await mapService.searchPlaces(
        keyword, 
        city, 
        types, 
        parseInt(page) || 1, 
        parseInt(size) || 20
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 路径规划
   */
  async drivingRoute(req, res) {
    try {
      const { origin, destination, city } = req.body;
      
      if (!origin || !destination) {
        return res.status(400).json({ error: '起点和终点不能为空' });
      }

      const result = await mapService.drivingRoute(origin, destination, city);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 获取天气
   */
  async getWeather(req, res) {
    try {
      const { city } = req.body;
      
      if (!city) {
        return res.status(400).json({ error: '城市不能为空' });
      }

      const result = await mapService.getWeather(city);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * IP定位
   */
  async ipLocation(req, res) {
    try {
      const { ip } = req.body;
      const result = await mapService.ipLocation(ip);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 检查地图服务状态
   */
  async checkStatus(req, res) {
    try {
      const result = await mapService.checkStatus();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MapController();