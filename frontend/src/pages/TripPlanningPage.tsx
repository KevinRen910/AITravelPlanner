import React from 'react';
import { Card, Button, Input, DatePicker, Select, Form, message } from 'antd';
import { CompassOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const TripPlanningPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const onFinish = () => {
    setLoading(true);
    // 模拟AI处理行程规划
    setTimeout(() => {
      message.success('行程规划已生成！');
      setLoading(false);
    }, 2000);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>智能行程规划</h1>
      
      <Card title="创建新的旅行计划" style={{ marginBottom: '24px' }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="目的地" name="destination" rules={[{ required: true }]}>
            <Input placeholder="请输入您想去的地方" />
          </Form.Item>
          
          <Form.Item label="旅行日期" name="dates" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item label="旅行人数" name="travelers" initialValue={1}>
            <Input type="number" min={1} />
          </Form.Item>
          
          <Form.Item label="旅行主题" name="theme">
            <Select placeholder="选择旅行主题">
              <Option value="relaxation">休闲度假</Option>
              <Option value="adventure">冒险探索</Option>
              <Option value="culture">文化体验</Option>
              <Option value="food">美食之旅</Option>
              <Option value="shopping">购物血拼</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="特殊需求" name="specialRequests">
            <TextArea rows={4} placeholder="请输入您的特殊要求或偏好" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<CompassOutlined />}>
              生成旅行计划
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <Card title="我的旅行计划">
        <p>暂无保存的旅行计划，请先创建新的计划。</p>
      </Card>
    </div>
  );
};

export default TripPlanningPage;