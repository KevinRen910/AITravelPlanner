const axios = require('axios');
const config = require('../config/config');

class MapService {
  constructor() {
    this.apiKey = config.map.apiKey;
    this.baseUrl = 'https://restapi.amap.com/v3';
  }

  /**
   * 地理编码 - 地址转坐标
   */
  async geocode(address, city = '') {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/geo`, {
        params: {
          key: this.apiKey,
          address: address,
          city: city
        }
      });

      if (response.data.status === '1' && response.data.geocodes.length > 0) {
        const location = response.data.geocodes[0].location;
        const [lng, lat] = location.split(',').map(Number);
        return {
          longitude: lng,
          latitude: lat,
          formattedAddress: response.data.geocodes[0].formatted_address,
          address: response.data.geocodes[0].formatted_address
        };
      } else {
        throw new Error(`地理编码失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('地理编码错误:', error);
      throw new Error(`地理编码服务不可用: ${error.message}`);
    }
  }

  /**
   * 逆地理编码 - 坐标转地址
   */
  async reverseGeocode(longitude, latitude) {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/regeo`, {
        params: {
          key: this.apiKey,
          location: `${longitude},${latitude}`,
          radius: 1000,
          extensions: 'base'
        }
      });

      if (response.data.status === '1' && response.data.regeocode) {
        return {
          address: response.data.regeocode.formatted_address,
          addressComponent: response.data.regeocode.addressComponent
        };
      } else {
        throw new Error(`逆地理编码失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('逆地理编码错误:', error);
      throw new Error(`逆地理编码服务不可用: ${error.message}`);
    }
  }

  /**
   * 地点搜索
   */
  async searchPlaces(keyword, city = '', types = '', page = 1, size = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/text`, {
        params: {
          key: this.apiKey,
          keywords: keyword,
          city: city,
          types: types,
          page: page,
          offset: size
        }
      });

      if (response.data.status === '1') {
        return {
          count: parseInt(response.data.count),
          pois: response.data.pois.map(poi => ({
            id: poi.id,
            name: poi.name,
            type: poi.type,
            address: poi.address,
            location: {
              longitude: parseFloat(poi.location.split(',')[0]),
              latitude: parseFloat(poi.location.split(',')[1])
            },
            distance: poi.distance ? parseFloat(poi.distance) : null,
            tel: poi.tel || '',
            rating: poi.business_area || ''
          }))
        };
      } else {
        throw new Error(`地点搜索失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('地点搜索错误:', error);
      throw new Error(`地点搜索服务不可用: ${error.message}`);
    }
  }

  /**
   * 路径规划 - 驾车
   */
  async drivingRoute(origin, destination, city = '') {
    try {
      const response = await axios.get(`${this.baseUrl}/direction/driving`, {
        params: {
          key: this.apiKey,
          origin: `${origin.longitude},${origin.latitude}`,
          destination: `${destination.longitude},${destination.latitude}`,
          city: city,
          strategy: 0 // 速度优先
        }
      });

      if (response.data.status === '1' && response.data.route) {
        const route = response.data.route;
        return {
          distance: route.paths[0].distance,
          duration: route.paths[0].duration,
          tolls: route.paths[0].tolls,
          steps: route.paths[0].steps.map(step => ({
            instruction: step.instruction,
            distance: step.distance,
            duration: step.duration,
            path: step.path
          }))
        };
      } else {
        throw new Error(`路径规划失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('路径规划错误:', error);
      throw new Error(`路径规划服务不可用: ${error.message}`);
    }
  }

  /**
   * 获取天气信息
   */
  async getWeather(city) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather/weatherInfo`, {
        params: {
          key: this.apiKey,
          city: city,
          extensions: 'base' // base: 实时天气, all: 预报天气
        }
      });

      if (response.data.status === '1' && response.data.lives.length > 0) {
        const weather = response.data.lives[0];
        return {
          city: weather.city,
          weather: weather.weather,
          temperature: weather.temperature,
          windDirection: weather.winddirection,
          windPower: weather.windpower,
          humidity: weather.humidity,
          reportTime: weather.reporttime
        };
      } else {
        throw new Error(`天气查询失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('天气查询错误:', error);
      throw new Error(`天气查询服务不可用: ${error.message}`);
    }
  }

  /**
   * IP定位
   */
  async ipLocation(ip = '') {
    try {
      const response = await axios.get(`${this.baseUrl}/ip`, {
        params: {
          key: this.apiKey,
          ip: ip
        }
      });

      if (response.data.status === '1') {
        return {
          ip: response.data.ip,
          province: response.data.province,
          city: response.data.city,
          adcode: response.data.adcode,
          rectangle: response.data.rectangle
        };
      } else {
        throw new Error(`IP定位失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('IP定位错误:', error);
      throw new Error(`IP定位服务不可用: ${error.message}`);
    }
  }

  /**
   * 检查地图服务状态
   */
  async checkStatus() {
    try {
      // 简单的API调用测试
      const response = await axios.get(`${this.baseUrl}/ip`, {
        params: {
          key: this.apiKey,
          ip: '114.114.114.114'
        },
        timeout: 5000
      });

      return {
        connected: response.data.status === '1',
        message: response.data.info || '地图服务正常'
      };
    } catch (error) {
      return {
        connected: false,
        message: `地图服务异常: ${error.message}`
      };
    }
  }
}

module.exports = new MapService();