import React, { useRef, useState, useEffect } from 'react';
import { Card, Spin, message, Button, Row, Col, Tag } from 'antd';
import { EnvironmentOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import mapService from '../services/mapService';

interface Location {
  longitude: number;
  latitude: number;
  name?: string;
  address?: string;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  location: Location;
  startTime: string;
  endTime: string;
  category: string;
  cost?: number;
}

interface TripMapProps {
  activities: Activity[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  showControls?: boolean;
  onMarkerClick?: (activity: Activity) => void;
}

const MapComponent: React.FC<TripMapProps> = ({
  activities,
  center = [116.397428, 39.90923], // 北京中心
  zoom = 10,
  height = 400,
  showControls = true,
  onMarkerClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapBroken, setMapBroken] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // 初始化地图
  useEffect(() => {
    const initMap = async () => {
      try {
        setLoading(true);
        setMapBroken(false);
        setMapInstance(null);
        setMarkers([]);
        
        // 检查是否已加载地图API
        if (!(window as any).AMap) {
          await mapService.loadMapScript(); // 使用环境变量中的API密钥
        }

        if (mapRef.current && (window as any).AMap && typeof (window as any).AMap.Map === 'function') {
          // 确保容器ID唯一且有效
          const containerId = mapRef.current.id || `map-container-${Date.now()}`;
          if (!mapRef.current.id) {
            mapRef.current.id = containerId;
          }
          
          try {
            const map = mapService.initMap(containerId, center);
            if (map && typeof map.setZoom === 'function') {
              map.setZoom(zoom);
              setMapInstance(map);
            } else {
              console.error('地图实例创建失败，返回值无效');
              throw new Error('地图实例创建失败');
            }
          } catch (error) {
            console.error('地图初始化过程出错:', error);
            message.error('地图初始化出错，请刷新页面重试');
            setMapBroken(true);
          }
        } else {
          console.error('AMap SDK 未正确加载或地图容器无效');
          message.error('地图API加载不完整，请检查网络连接');
          setMapBroken(true);
        }
      } catch (error) {
        console.error('地图初始化失败:', error);
        message.error('地图加载失败，请检查API密钥配置');
        setMapBroken(true);
      } finally {
        setLoading(false);
      }
    };

    // 确保组件挂载后再初始化地图
    if (mapRef.current) {
      initMap();
    }
  }, [center, zoom]);

  // 添加标记点
  useEffect(() => {
    if (!mapInstance || !activities.length || mapBroken) return;

    // 清除旧标记
    if (markers.length > 0 && typeof mapInstance.remove === 'function') {
      markers.forEach(marker => {
        try {
          if (marker) mapInstance.remove(marker);
        } catch (e) {
          console.warn('移除标记失败，忽略:', e);
        }
      });
    }

    const newMarkers: any[] = [];

    activities.forEach((activity) => {
      try {
        const lng = Number(activity.location?.longitude);
        const lat = Number(activity.location?.latitude);

        // 验证坐标有效性
        if (!isFinite(lng) || !isFinite(lat)) {
          console.warn('跳过无效的活动坐标：', activity);
          return;
        }

        const marker = mapService.addMarker([lng, lat], activity.name);

        // 添加点击事件
        if (marker && typeof marker.on === 'function') {
          marker.on('click', () => {
            setSelectedActivity(activity);
            onMarkerClick?.(activity);
            
            // 显示信息窗口
            try {
              if ((window as any).AMap && typeof (window as any).AMap.InfoWindow === 'function') {
                const infoWindow = new (window as any).AMap.InfoWindow({
                  content: `
                    <div style="padding: 8px; max-width: 200px;">
                      <h4 style="margin: 0 0 8px 0; color: #1890ff;">${activity.name}</h4>
                      <p style="margin: 4px 0; font-size: 12px; color: #666;">${activity.description}</p>
                      <p style="margin: 4px 0; font-size: 12px; color: #999;">${activity.startTime} - ${activity.endTime}</p>
                      ${activity.cost ? `<p style="margin: 4px 0; font-size: 12px; color: #52c41a;">费用: ¥${activity.cost}</p>` : ''}
                    </div>
                  `,
                  offset: new (window as any).AMap.Pixel(0, -30)
                });
                
                if (infoWindow && typeof infoWindow.open === 'function' && typeof marker.getPosition === 'function') {
                  const position = marker.getPosition();
                  if (position) {
                    infoWindow.open(mapInstance, position);
                  }
                }
              }
            } catch (e) {
              console.warn('创建或打开信息窗口失败:', e);
            }
          });
        }

        newMarkers.push(marker);
      } catch (e) {
        console.warn('添加标记点失败，跳过该活动:', activity.name, e);
      }
    });

    setMarkers(newMarkers);

    // 调整地图视野包含所有标记
    if (newMarkers.length > 0) {
      try {
        if (typeof mapInstance.setFitView === 'function') {
          // 过滤有效标记
          const validMarkers = newMarkers.filter(m => m && typeof m.getPosition === 'function' && m.getPosition());
          if (validMarkers.length > 0) {
            mapInstance.setFitView(validMarkers);
          } else if (typeof mapInstance.setCenter === 'function') {
            // 兜底方案：使用默认中心
            mapInstance.setCenter(center);
          }
        } else if (typeof mapInstance.setBounds === 'function') {
          // 备选方案：手动计算边界
          const bounds = new (window as any).AMap.Bounds();
          newMarkers.forEach(marker => {
            try {
              if (marker && typeof marker.getPosition === 'function') {
                const pos = marker.getPosition();
                if (pos) bounds.extend(pos);
              }
            } catch (e) {
              console.warn('扩展边界失败:', e);
            }
          });
          mapInstance.setBounds(bounds);
        }
      } catch (e) {
        console.error('设置地图视野失败:', e);
        // 标记为损坏，停止未来的视野调整与路线绘制以避免重复报错
        setMapBroken(true);
      }
    }
  }, [mapInstance, activities, onMarkerClick, center]);

  // 绘制路线
  useEffect(() => {
    if (!mapInstance || activities.length < 2 || mapBroken) return;

    // 清除旧路线
    try {
      if (typeof mapInstance.getAllOverlays === 'function') {
        const polylines = mapInstance.getAllOverlays('polyline') || [];
        polylines.forEach((polyline: any) => {
          try {
            if (typeof mapInstance.remove === 'function') {
              mapInstance.remove(polyline);
            }
          } catch (e) {
            console.warn('移除 polyline 失败，忽略：', e);
          }
        });
      }
    } catch (e) {
      console.warn('尝试清除旧路线时发生错误，忽略：', e);
      // 不再立即标记为损坏，仅当关键操作失败时才标记
    }

    // 按时间顺序排序活动
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // 绘制连接线
    if ((window as any).AMap && typeof (window as any).AMap.Polyline === 'function' && typeof mapInstance.add === 'function') {
      for (let i = 0; i < sortedActivities.length - 1; i++) {
        try {
          const current = sortedActivities[i];
          const next = sortedActivities[i + 1];

          const lng1 = Number(current.location?.longitude);
          const lat1 = Number(current.location?.latitude);
          const lng2 = Number(next.location?.longitude);
          const lat2 = Number(next.location?.latitude);

          if (!isFinite(lng1) || !isFinite(lat1) || !isFinite(lng2) || !isFinite(lat2)) {
            console.warn('跳过无效坐标的连线:', current, next);
            continue;
          }

          const polyline = new (window as any).AMap.Polyline({
            path: [
              [lng1, lat1],
              [lng2, lat2]
            ],
            strokeColor: "#1890ff",
            strokeOpacity: 0.6,
            strokeWeight: 4,
            strokeStyle: "solid"
          });

          mapInstance.add(polyline);
        } catch (e) {
          console.warn('添加 polyline 失败，忽略：', e);
          // 不再立即标记为损坏，允许继续尝试添加其他路线
        }
      }
    } else {
      console.debug('AMap.Polyline 或 mapInstance.add 不可用，跳过绘制路线');
    }
  }, [mapInstance, activities]);

  // 查看全部按钮的处理函数
  const handleViewAll = () => {
    if (!mapInstance || activities.length === 0 || mapBroken) return;
    
    try {
      if (typeof mapInstance.setFitView === 'function' && markers.length > 0) {
        const validMarkers = markers.filter(m => m && typeof m.getPosition === 'function' && m.getPosition());
        if (validMarkers.length > 0) {
          mapInstance.setFitView(validMarkers);
        }
      } else if (typeof mapInstance.setBounds === 'function' && markers.length > 0) {
        const bounds = new (window as any).AMap.Bounds();
        markers.forEach(marker => {
          try {
            if (marker && typeof marker.getPosition === 'function') {
              const pos = marker.getPosition();
              if (pos) bounds.extend(pos);
            }
          } catch (e) {
            console.warn('扩展边界失败:', e);
          }
        });
        mapInstance.setBounds(bounds);
      }
    } catch (e) {
      console.error('查看全部功能失败:', e);
      message.error('无法调整地图视野，请手动缩放');
    }
  };

  if (loading) {
    return (
      <div style={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="地图加载中..." />
      </div>
    );
  }

  if (mapBroken) {
    return (
      <div style={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: '80%', textAlign: 'center' }}>
          <p style={{ color: '#ff4d4f' }}>地图加载失败</p>
          <Button type="primary" onClick={() => window.location.reload()}>刷新页面重试</Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div 
        ref={mapRef}
        id="trip-map"
        style={{
          height,
          borderRadius: '8px',
          border: '1px solid #d9d9d9',
          position: 'relative'
        }}
      />
      
      {/* 活动详情面板 */}
      {selectedActivity && (
        <Card 
          style={{ marginTop: 16 }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined style={{ color: '#1890ff' }} />
              <span>{selectedActivity.name}</span>
            </div>
          }
          extra={
            <Button 
              type="link" 
              size="small" 
              onClick={() => setSelectedActivity(null)}
            >
              关闭
            </Button>
          }
        >
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <p style={{ margin: 0, color: '#666' }}>{selectedActivity.description}</p>
            </Col>
            <Col span={12}>
              <Tag icon={<CalendarOutlined />} color="blue">
                {selectedActivity.startTime}
              </Tag>
            </Col>
            <Col span={12}>
              <Tag icon={<CalendarOutlined />} color="green">
                {selectedActivity.endTime}
              </Tag>
            </Col>
            {selectedActivity.cost && (
              <Col span={24}>
                <Tag icon={<UserOutlined />} color="orange">
                  费用: ¥{selectedActivity.cost}
                </Tag>
              </Col>
            )}
            <Col span={24}>
              <Tag color="purple">{selectedActivity.category}</Tag>
            </Col>
          </Row>
        </Card>
      )}

      {/* 地图控制面板 */}
      {showControls && activities.length > 0 && (
        <Card size="small" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              共 {activities.length} 个地点
            </span>
            <Button 
              type="link" 
              size="small"
              onClick={handleViewAll}
            >
              查看全部
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MapComponent;