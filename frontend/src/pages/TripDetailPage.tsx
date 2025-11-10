import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, message, Tag, Descriptions } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { tripAPI } from '../services/apiService';

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  theme: string;
  special_requests: string;
  plan_content: any;
  preferences: any;
  created_at: string;
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
      setTrip(response.data);
    } catch (error: any) {
      console.error('获取行程详情失败:', error);
      setError(error.response?.data?.error || '获取行程详情失败');
      message.error('获取行程详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/trips');
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
          <Button type="primary" onClick={handleBack}>
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
          <Button type="primary" onClick={handleBack}>
            返回行程列表
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginBottom: '16px' }}
        >
          返回行程列表
        </Button>
      </div>

      <Card title={`行程详情 - ${trip.destination}`}>
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
            <Card>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {typeof trip.plan_content === 'string' 
                  ? trip.plan_content 
                  : JSON.stringify(trip.plan_content, null, 2)}
              </pre>
            </Card>
          ) : (
            <p>暂无行程安排</p>
          )}
        </div>

        <div style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
          创建时间: {new Date(trip.created_at).toLocaleString('zh-CN')}
        </div>
      </Card>
    </div>
  );
};

export default TripDetailPage;