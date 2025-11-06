import React from 'react';
import { Card, Button, Row, Col } from 'antd';
import { CalendarOutlined, WalletOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>欢迎使用AI旅行规划助手</h1>
      
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card 
            title="行程规划"
            bordered={false}
            extra={<CalendarOutlined />}
            actions={[
              <Button type="primary" onClick={() => navigate('/trip-planning')}>
                开始规划
              </Button>
            ]}
          >
            <p>利用AI智能生成个性化旅行方案，包含景点推荐、路线规划和时间安排。</p>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card 
            title="预算管理"
            bordered={false}
            extra={<WalletOutlined />}
            actions={[
              <Button type="primary" onClick={() => navigate('/budget-management')}>
                管理预算
              </Button>
            ]}
          >
            <p>记录和分析旅行支出，设置预算目标，确保旅行花费合理可控。</p>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card 
            title="个人资料"
            bordered={false}
            extra={<UserOutlined />}
            actions={[
              <Button type="primary" onClick={() => navigate('/user-profile')}>
                查看资料
              </Button>
            ]}
          >
            <p>管理您的个人信息和旅行偏好，让AI更好地了解您的需求。</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;