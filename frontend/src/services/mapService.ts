// 地图服务，用于显示地图和获取位置信息
class MapService {
  private mapInstance: any = null;
  private isLoaded: boolean = false;

  // 加载地图API
  public loadMapScript(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isLoaded) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Geocoder,AMap.PlaceSearch,AMap.AutoComplete`;
      script.onerror = () => reject(new Error('地图API加载失败'));
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      document.head.appendChild(script);
    });
  }

  // 初始化地图
  public initMap(containerId: string, center: [number, number] = [116.397428, 39.90923]): any {
    if (!this.isLoaded) {
      throw new Error('地图API未加载');
    }

    this.mapInstance = new (window as any).AMap.Map(containerId, {
      zoom: 10,
      center: center,
    });

    return this.mapInstance;
  }

  // 添加标记
  public addMarker(position: [number, number], title: string = ''): any {
    if (!this.mapInstance) {
      throw new Error('地图未初始化');
    }

    const marker = new (window as any).AMap.Marker({
      position: position,
      title: title,
    });

    this.mapInstance.add(marker);
    return marker;
  }

  // 地理编码（地址转坐标）
  public async geocode(address: string): Promise<[number, number]> {
    if (!this.isLoaded) {
      throw new Error('地图API未加载');
    }

    return new Promise((resolve, reject) => {
      const geocoder = new (window as any).AMap.Geocoder();
      geocoder.getLocation(address, (status: string, result: any) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const location = result.geocodes[0].location;
          resolve([location.lng, location.lat]);
        } else {
          reject(new Error('地理编码失败'));
        }
      });
    });
  }

  // 逆地理编码（坐标转地址）
  public async reverseGeocode(position: [number, number]): Promise<string> {
    if (!this.isLoaded) {
      throw new Error('地图API未加载');
    }

    return new Promise((resolve, reject) => {
      const geocoder = new (window as any).AMap.Geocoder();
      geocoder.getAddress(position, (status: string, result: any) => {
        if (status === 'complete' && result.regeocode) {
          resolve(result.regeocode.formattedAddress);
        } else {
          reject(new Error('逆地理编码失败'));
        }
      });
    });
  }

  // 搜索地点
  public async searchPlace(keyword: string, city: string = ''): Promise<any[]> {
    if (!this.isLoaded) {
      throw new Error('地图API未加载');
    }

    return new Promise((resolve, reject) => {
      const placeSearch = new (window as any).AMap.PlaceSearch({
        city: city,
        pageSize: 10,
      });

      placeSearch.search(keyword, (status: string, result: any) => {
        if (status === 'complete' && result.poiList) {
          resolve(result.poiList.pois);
        } else {
          reject(new Error('地点搜索失败'));
        }
      });
    });
  }

  // 获取当前位置
  public async getCurrentPosition(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          reject(new Error(`获取位置失败: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }
}

export default new MapService();