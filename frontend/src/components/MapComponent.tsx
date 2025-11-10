import React, { useEffect, useRef, useState } from 'react';
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
        
        // 检查是否已加载地图API
        if (!(window as any).AMap) {
          await mapService.loadMapScript(); // 使用环境变量中的API密钥
        }

        if (mapRef.current) {
          const map = mapService.initMap(mapRef.current.id, center);
          map.setZoom(zoom);
          setMapInstance(map);
        }
      } catch (error) {
        console.error('地图初始化失败:', error);
        message.error('地图加载失败，请检查API密钥配置');
      } finally {
        setLoading(false);
      }
    };

    initMap();
  }, [center, zoom]);

  // 添加标记点
  useEffect(() => {
    if (!mapInstance || !activities.length) return;

    // 清除旧标记
    markers.forEach(marker => {
      mapInstance.remove(marker);
    });

  const newMarkers: any[] = [];

  activities.forEach((activity) => {
      const lng = Number(activity.location?.longitude);
      const lat = Number(activity.location?.latitude);

      // 验证坐标有效性，若无效则跳过该活动的标记（避免传入 undefined/NaN 导致 AMap 崩溃）
      if (!isFinite(lng) || !isFinite(lat)) {
        console.warn('跳过无效的活动坐标：', activity);
        return;
      }

      const marker = mapService.addMarker([lng, lat], activity.name);

      // 添加点击事件
      marker.on('click', () => {
        setSelectedActivity(activity);
        onMarkerClick?.(activity);
        
        // 显示信息窗口
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
        
        infoWindow.open(mapInstance, marker.getPosition());
      });

      newMarkers.push(marker);
      const pos = marker.getPosition && marker.getPosition();
      if (!pos) {
        console.warn('marker.getPosition 返回空，忽略该点', marker);
      }
    });

    setMarkers(newMarkers);

    // 调整地图视野包含所有标记：优先使用 setFitView（传入 overlays），更稳健
    if (mapBroken) return; // 若检测到地图 SDK 已损坏或不稳定，停止后续操作以避免重复错误

    if (newMarkers.length > 0) {
      try {
        // setFitView 接受 overlays 数组并自动计算视野
        mapInstance.setFitView(newMarkers);
      } catch (e) {
        console.error('设置地图视野失败 (setFitView)：', e);
        // 兜底：若 setFitView 失败，尝试使用第一个有效标记的中心
        const first = newMarkers.find(m => m && typeof m.getPosition === 'function');
        if (first) {
          const p = first.getPosition();
          // AMap LngLat 可能有 lng/lat 属性或 getLng/getLat 方法
          const lng = p?.lng ?? (typeof p?.getLng === 'function' ? p.getLng() : undefined);
          const lat = p?.lat ?? (typeof p?.getLat === 'function' ? p.getLat() : undefined);
          if (isFinite(lng) && isFinite(lat)) {
            try { mapInstance.setCenter([lng, lat]); } catch (e2) { console.error('fallback setCenter 失败:', e2); }
          }
        }
        // 标记为损坏，停止未来的视野调整与路线绘制以避免重复报错
        setMapBroken(true);
      }
    }
  }, [mapInstance, activities, onMarkerClick]);

  // 绘制路线
  useEffect(() => {
    if (!mapInstance || activities.length < 2) return;

    // 清除旧路线：仅在 mapInstance 提供 getAllOverlays / remove 方法时执行
    try {
      if (typeof mapInstance.getAllOverlays === 'function') {
        const polylines = mapInstance.getAllOverlays('polyline') || [];
        polylines.forEach((polyline: any) => {
          try {
            if (typeof mapInstance.remove === 'function') mapInstance.remove(polyline);
          } catch (e) {
            console.warn('移除 polyline 失败，忽略：', e);
            // 如果移除操作触发 SDK 内部错误，标记为损坏以停止进一步调用
            setMapBroken(true);
          }
        });
      }
    } catch (e) {
      console.warn('尝试清除旧路线时发生错误，忽略：', e);
      setMapBroken(true);
    }

    // 按时间顺序排序活动
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // 绘制连接线：仅在 AMap.Polyline 可用且 mapInstance.add 可用时
    if ((window as any).AMap && typeof (window as any).AMap.Polyline === 'function' && typeof mapInstance.add === 'function') {
      for (let i = 0; i < sortedActivities.length - 1; i++) {
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

        try {
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
          // 如果 polyline 添加失败（通常为 SDK 内部错误），标记为损坏以停止未来的尝试
          setMapBroken(true);
        }
      }
    } else {
      // 如果 AMap.Polyline 不可用，跳过绘制路线
      console.debug('AMap.Polyline 或 mapInstance.add 不可用，跳过绘制路线');
    }
  }, [mapInstance, activities]);

  if (loading) {
    return (
      <div style={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="地图加载中..." />
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
              onClick={() => {
                if (mapInstance && activities.length > 1) {
                  const bounds = new (window as any).AMap.Bounds();
                  markers.forEach(marker => bounds.extend(marker.getPosition()));
                  mapInstance.setBounds(bounds);
                }
              }}
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