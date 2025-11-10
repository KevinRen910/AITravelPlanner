import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Card, 
  Tag, 
  Spin, 
  message, 
  Tabs, 
  Row, 
  Col 
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  StarOutlined,
  CarOutlined
} from '@ant-design/icons';
// removed unused imports
import { tripAPI } from '../services/apiService';
import MapComponent from '../components/MapComponent';

// Tabs items used directly; no TabPane required

interface TripDetail {
  id: string;
  userId: string;
  userInput: string;
  preferences: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    theme?: string;
    specialRequests?: string;
  };
  plan_content: any;
  budget_estimation?: any;
  created_at: string;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  location: {
    longitude: number;
    latitude: number;
    address?: string;
  };
  startTime: string;
  endTime: string;
  category: string;
  cost?: number;
  images?: string[];
}

const TripMapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map'); // 默认显示地图视图

  // 解析行程内容为活动数据
  const parseActivities = (planContent: any): Activity[] => {
    // 不再兼容旧的字符串 plan_content：假定 planContent 为 { structured, text, ai_raw }
    if (!planContent) return [];

    try {
      const pc = planContent as { structured?: any; text?: string };

      // 优先使用结构化数据
      const content = pc.structured || null;
      if (!content) {
        // 如果没有结构化数据，则尝试把 text 转为单条活动（简化处理，不做复杂文本解析）
        if (pc.text) {
          return [
            {
              id: 'activity-1',
              name: '行程概要',
              description: pc.text,
              location: { longitude: 116.397428, latitude: 39.90923 },
              startTime: (trip?.preferences?.startDate || '') + ' 09:00',
              endTime: (trip?.preferences?.startDate || '') + ' 17:00',
              category: '概览'
            }
          ];
        }
        return [];
      }

      // 现在 content 是结构化对象，优先寻找 dailyItinerary 或 itinerary
      const itineraries = content.dailyItinerary || content.itinerary || content.days || null;
      if (!itineraries || !Array.isArray(itineraries)) return [];

      const activities: Activity[] = [];
      itineraries.forEach((day: any, dayIndex: number) => {
        const dayLabel = day.date || day.day || `第${dayIndex + 1}天`;

        // 若 day.activities 存在并为数组，则直接映射
        if (Array.isArray(day.activities) && day.activities.length > 0) {
          day.activities.forEach((activity: any, activityIndex: number) => {
            activities.push({
              id: `d${dayIndex + 1}-a${activityIndex + 1}`,
              name: activity.name || activity.title || `${dayLabel} 活动${activityIndex + 1}`,
              description: activity.description || activity.detail || '',
              location: {
                longitude: activity.location?.longitude || activity.lng || 116.397428 + Math.random() * 0.05,
                latitude: activity.location?.latitude || activity.lat || 39.90923 + Math.random() * 0.05,
                address: activity.location?.address || activity.address
              },
              startTime: activity.startTime || activity.time || `${dayLabel} 09:00`,
              endTime: activity.endTime || `${dayLabel} 17:00`,
              category: activity.category || activity.type || '观光',
              cost: activity.cost,
              images: activity.images || activity.photos
            });
          });
          return;
        }

        // 否则，如果有 attractions，则用景点生成活动
        if (Array.isArray(day.attractions) && day.attractions.length > 0) {
          day.attractions.forEach((attraction: any, ai: number) => {
            activities.push({
              id: `d${dayIndex + 1}-at${ai + 1}`,
              name: typeof attraction === 'string' ? attraction : (attraction.name || `景点${ai + 1}`),
              description: typeof attraction === 'string' ? '' : (attraction.description || ''),
              location: {
                longitude: attraction.location?.longitude || 116.397428 + Math.random() * 0.05,
                latitude: attraction.location?.latitude || 39.90923 + Math.random() * 0.05,
                address: attraction.location?.address || attraction.address
              },
              startTime: `${dayLabel} 10:00`,
              endTime: `${dayLabel} 17:00`,
              category: '景点'
            });
          });
          return;
        }
      });

      return activities;
    } catch (error) {
      console.error('解析结构化行程失败:', error, planContent);
      return [];
    }
  };

  useEffect(() => {
    const fetchTripDetail = async () => {
      if (!id) {
        message.error('行程ID不存在');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await tripAPI.getTripById(id);
        const tripData = response.data;
        setTrip(tripData);
        
        // 解析行程内容为活动数据
        const parsedActivities = parseActivities(tripData.plan_content);
        setActivities(parsedActivities);
        
        message.success('行程详情加载成功');
      } catch (error: any) {
        console.error('Error fetching trip details:', error);
        message.error(error.response?.data?.error || '获取行程详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetail();
  }, [id]);

  const goBack = () => {
    navigate('/trips');
  };

  const handleMarkerClick = (activity: Activity) => {
    setActiveTab('details');
    // 记录以便调试和排查解析失败时的上下文
    console.debug('marker clicked, activity:', activity);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="正在加载行程详情..." />
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>行程详情不存在或加载失败</h2>
        <p style={{ color: '#999', marginBottom: '20px' }}>
          无法获取行程ID为 "{id}" 的详细信息
        </p>
        <Button type="primary" onClick={goBack}>
          返回行程规划
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 头部导航 */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={goBack}
          style={{ marginBottom: '16px' }}
        >
          返回行程列表
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
              {trip.preferences.destination}
            </h1>
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Tag color="blue" icon={<CalendarOutlined />}>
                {trip.preferences.startDate} 至 {trip.preferences.endDate}
              </Tag>
              <Tag color="green" icon={<UserOutlined />}>
                {trip.preferences.travelers} 人
              </Tag>
              {trip.preferences.theme && (
                <Tag color="purple" icon={<StarOutlined />}>
                  {trip.preferences.theme}
                </Tag>
              )}
            </div>
          </div>
          
          <div style={{ textAlign: 'right', color: '#999' }}>
            <div>创建时间: {new Date(trip.created_at).toLocaleString('zh-CN')}</div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'map',
            label: (
              <span>
                <EnvironmentOutlined />
                地图视图
              </span>
            ),
            children: (
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <Card title="行程地图" bordered={false}>
                    <MapComponent
                      activities={activities}
                      height={500}
                      showControls={true}
                      onMarkerClick={handleMarkerClick}
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'details',
            label: (
              <span>
                <CarOutlined />
                行程详情
              </span>
            ),
            children: (
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <Card title="行程安排" bordered={false}>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                      {typeof trip.plan_content === 'string' 
                        ? trip.plan_content 
                        : JSON.stringify(trip.plan_content, null, 2)}
                    </div>
                  </Card>
                </Col>
                
                {trip.budget_estimation && (
                  <Col span={24}>
                    <Card title="预算估算" bordered={false}>
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                        {typeof trip.budget_estimation === 'string' 
                          ? trip.budget_estimation 
                          : JSON.stringify(trip.budget_estimation, null, 2)}
                      </div>
                    </Card>
                  </Col>
                )}
              </Row>
            )
          }
        ]}
      />

      {/* 特殊需求 */}
      {trip.preferences.specialRequests && (
        <Card title="特殊需求" style={{ marginTop: '24px' }}>
          <p style={{ lineHeight: '1.6', color: '#666' }}>{trip.preferences.specialRequests}</p>
        </Card>
      )}
    </div>
  );
};

export default TripMapPage;