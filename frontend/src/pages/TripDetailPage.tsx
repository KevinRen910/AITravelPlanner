import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, message, Tag, Descriptions } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { tripAPI } from '../services/apiService';

interface Trip {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  theme: string;
  special_requests: string;
  plan_content: any;
  plan_text?: string;
  estimated_budget: number;
  preferences: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    theme: string;
    specialRequests: string;
  };
  created_at: string;
  updated_at: string;
}

const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchTripDetails(id);
    }
  }, [id]);

  const fetchTripDetails = async (tripId: string) => {
    try {
      setLoading(true);
      const response = await tripAPI.getTripById(tripId);
      console.log('获取到的行程数据:', response.data);
      
      // 检查是否是模拟数据
      const tripData = response.data;
      if (tripData.id && tripData.id.startsWith('mock-')) {
        message.warning('当前显示的是模拟数据，请检查数据库连接');
      }
      
      setTrip(tripData);
    } catch (error: any) {
      console.error('获取行程详情失败:', error);
      setError(error.response?.data?.error || '获取行程详情失败');
      message.error('获取行程详情失败');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/trips');
  };
  
  // 查看地图视图
  const viewTripMap = () => {
    navigate(`/trips/${id}/map`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>正在加载行程详情...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Card>
          <h3>加载失败</h3>
          <p>{error}</p>
          <Button type="primary" onClick={goBack}>
            返回行程列表
          </Button>
        </Card>
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Card>
          <h3>行程不存在</h3>
          <p>找不到对应的行程信息</p>
            <Button type="primary" onClick={goBack}>
            返回行程列表
          </Button>
        </Card>
      </div>
    );
  }

  // 检查是否是模拟数据
  const isMockData = trip.id && trip.id.startsWith('mock-');

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={goBack}
          style={{ marginBottom: '16px' }}
        >
          返回行程规划
        </Button>

        <Card 
          title={`行程详情 - ${trip.preferences.destination}`} 
          bordered={false}
          extra={
            <Button 
              type="primary" 
              icon={<EnvironmentOutlined />}
              onClick={viewTripMap}
            >
              地图视图
            </Button>
          }
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item label="目的地">{trip.destination}</Descriptions.Item>
            <Descriptions.Item label="旅行日期">
              {trip.start_date} 至 {trip.end_date}
            </Descriptions.Item>
            <Descriptions.Item label="旅行人数">{trip.travelers} 人</Descriptions.Item>
            <Descriptions.Item label="旅行主题">
              <Tag color="blue">{trip.theme}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="特殊需求" span={2}>
              {trip.special_requests || '无'}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: '24px' }}>
            <h3>行程安排</h3>
            {trip.plan_content ? (
              (() => {
                const pc = trip.plan_content || {};
                const structured = pc.structured || null;
                const text = trip.plan_text || pc.text || '';

                if (structured && Array.isArray(structured.dailyItinerary)) {
                  return (
                    <div>
                      {structured.dailyItinerary.map((day: any, idx: number) => (
                        <Card key={idx} style={{ marginBottom: '12px' }}>
                          <h4 style={{ margin: '6px 0' }}>{day.date || `第${idx + 1}天`}</h4>
                          {day.morning && <p><strong>上午：</strong>{day.morning}</p>}
                          {day.afternoon && <p><strong>下午：</strong>{day.afternoon}</p>}
                          {day.evening && <p><strong>傍晚/晚上：</strong>{day.evening}</p>}
                          {Array.isArray(day.attractions) && day.attractions.length > 0 && (
                            <p><strong>景点：</strong>{day.attractions.join('、')}</p>
                          )}
                          {Array.isArray(day.restaurants) && day.restaurants.length > 0 && (
                            <p><strong>餐厅推荐：</strong>{day.restaurants.join('、')}</p>
                          )}
                          {day.accommodation && <p><strong>住宿建议：</strong>{day.accommodation}</p>}
                          {day.transportation && <p><strong>交通建议：</strong>{day.transportation}</p>}
                        </Card>
                      ))}

                      {structured.recommendations && (
                        <Card title="推荐信息" style={{ marginTop: 12 }}>
                          {structured.recommendations.attractions && <p><strong>推荐景点：</strong>{structured.recommendations.attractions.join('、')}</p>}
                          {structured.recommendations.restaurants && <p><strong>推荐餐厅：</strong>{structured.recommendations.restaurants.join('、')}</p>}
                          {structured.recommendations.tips && <p><strong>旅行贴士：</strong>{structured.recommendations.tips.join('；')}</p>}
                        </Card>
                      )}

                      {structured.budgetEstimation && (
                        <Card title="预算估算" style={{ marginTop: 12 }}>
                          <p><strong>总计：</strong>{structured.budgetEstimation.total} 元</p>
                          {structured.budgetEstimation.categories && (
                            <div>
                              {Object.entries(structured.budgetEstimation.categories).map(([k, v]) => (
                                <div key={k}><strong>{k}：</strong>{String(v)} 元</div>
                              ))}
                            </div>
                          )}
                        </Card>
                      )}
                    </div>
                  );
                }

                // fallback: 显示纯文本或结构化 JSON
                return (
                  <Card>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {text || JSON.stringify(pc, null, 2)}
                    </pre>
                  </Card>
                );
              })()
            ) : (
              <p>暂无行程安排</p>
            )}
          </div>

          <div style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
            创建时间: {new Date(trip.created_at).toLocaleString('zh-CN')}
            {isMockData && <Tag color="orange" style={{ marginLeft: '8px' }}>模拟数据</Tag>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TripDetailPage;