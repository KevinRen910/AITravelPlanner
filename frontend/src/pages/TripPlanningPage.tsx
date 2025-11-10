import React, { useState, useEffect } from 'react';
import { Card, Button, Input, DatePicker, Select, Form, message, Spin, Modal, Tag, List, Empty } from 'antd';
import { CompassOutlined, AudioOutlined, StopOutlined, EyeOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { tripAPI } from '../services/apiService';
import speechService from '../services/speechService';
import { addTrip } from '../store/features/tripSlice';

const { Option } = Select;
const { TextArea } = Input;

const TripPlanningPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  // 检查用户是否已登录
  if (!user.isAuthenticated || !user.user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Card>
          <h3>请先登录</h3>
          <p>您需要登录后才能创建旅行计划</p>
          <Button type="primary" onClick={() => navigate('/login')}>
            前往登录
          </Button>
        </Card>
      </div>
    );
  }

  // 获取用户行程列表
  const fetchUserTrips = async () => {
    if (!user.user?.id) return;
    
    setTripsLoading(true);
    try {
      const response = await tripAPI.getUserTrips(user.user.id);
      setUserTrips(response.data || []);
    } catch (error: any) {
      console.error('获取用户行程失败:', error);
      message.error('获取行程列表失败');
    } finally {
      setTripsLoading(false);
    }
  };

  // 组件加载时获取用户行程
  useEffect(() => {
    fetchUserTrips();
  }, [user.user?.id]);

  // 开始录音
  const startRecording = async () => {
    if (!speechService.isBrowserSupported()) {
      message.error('您的浏览器不支持语音识别功能');
      return;
    }

    setRecording(true);
    try {
      const transcript = await speechService.startRecognition();
      // 将语音识别结果填充到特殊需求字段
      form.setFieldsValue({ specialRequests: transcript });
      message.success('语音识别完成');
    } catch (error: any) {
      message.error(error.message || '语音识别失败');
    } finally {
      setRecording(false);
    }
  };

  // 停止录音
  const stopRecording = () => {
    speechService.stopRecognition();
    setRecording(false);
  };

  // 提交表单，生成行程计划
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 构建用户输入字符串
      const userInput = `目的地：${values.destination}，日期：${values.dates[0].format('YYYY-MM-DD')}至${values.dates[1].format('YYYY-MM-DD')}，人数：${values.travelers}，主题：${values.theme || '无特定主题'}，特殊需求：${values.specialRequests || '无'}`;
      
      // 确保用户ID存在
      const userId = user.user?.id;
      if (!userId) {
        message.error('用户信息不完整，请重新登录');
        navigate('/login');
        return;
      }
      
      // 调用API生成行程计划 - 修复数据结构
      const response = await tripAPI.createTrip({
        destination: values.destination,
        start_date: values.dates[0].format('YYYY-MM-DD'),
        end_date: values.dates[1].format('YYYY-MM-DD'),
        travelers: values.travelers,
        theme: values.theme,
        special_requests: values.specialRequests,
        preferences: {
          destination: values.destination,
          startDate: values.dates[0].format('YYYY-MM-DD'),
          endDate: values.dates[1].format('YYYY-MM-DD'),
          travelers: values.travelers,
          theme: values.theme,
          specialRequests: values.specialRequests
        }
      });
      
      const tripData = response.data;
      
      // 验证返回的数据结构
      if (!tripData.id || !tripData.destination) {
        throw new Error('返回的行程数据不完整');
      }
      
      // 更新Redux状态
      dispatch(addTrip(tripData));
      
      // 保存行程数据到localStorage
      try {
        const savedTrips = localStorage.getItem('userTrips');
        let trips = savedTrips ? JSON.parse(savedTrips) : [];
        // 避免重复添加
        const existingIndex = trips.findIndex((t: any) => t.id === tripData.id);
        if (existingIndex === -1) {
          trips.push(tripData);
          localStorage.setItem('userTrips', JSON.stringify(trips));
          console.log('行程数据已保存到localStorage，ID:', tripData.id);
        }
      } catch (storageError) {
        console.error('保存行程到localStorage失败:', storageError);
      }
      
      // 显示生成的计划
      setGeneratedPlan(tripData);
      setPlanModalVisible(true);
      
      // 重新获取用户行程列表
      await fetchUserTrips();
      
      message.success('行程规划已生成！');
    } catch (error: any) {
      console.error('生成行程计划失败:', error);
      message.error(error.response?.data?.error || error.message || '生成行程计划失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看行程详情
  const viewTripDetails = () => {
    if (!generatedPlan?.id) {
      message.error('行程ID不存在，无法查看详情');
      return;
    }
    setPlanModalVisible(false);
    // 添加延迟确保模态框完全关闭
    setTimeout(() => {
      navigate(`/trips/${generatedPlan.id}`);
    }, 100);
  };

  // 查看已有行程详情
  const viewExistingTripDetails = (tripId: string) => {
    navigate(`/trips/${tripId}`);
  };

  // 关闭模态框并重置表单
  const handleModalClose = () => {
    setPlanModalVisible(false);
    // 重置表单以便创建新的行程
    form.resetFields();
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>智能行程规划</h1>
      
      <Card title="创建新的旅行计划" style={{ marginBottom: '24px' }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="目的地" name="destination" rules={[{ required: true, message: '请输入目的地' }]}>
            <Input placeholder="请输入您想去的地方" />
          </Form.Item>
          
          <Form.Item label="旅行日期" name="dates" rules={[{ required: true, message: '请选择旅行日期' }]}>
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
            <TextArea 
              rows={4} 
              placeholder="请输入您的特殊要求或偏好，或使用语音输入" 
              suffix={
                <Button
                  type="text"
                  icon={recording ? <StopOutlined /> : <AudioOutlined />}
                  onClick={recording ? stopRecording : startRecording}
                  style={{ color: recording ? '#ff4d4f' : '#1890ff' }}
                >
                  {recording ? '停止录音' : '语音输入'}
                </Button>
              }
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              icon={<CompassOutlined />}
            >
              生成旅行计划
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <Card title="我的旅行计划">
        {tripsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p>正在加载行程列表...</p>
          </div>
        ) : userTrips.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="您还没有创建任何旅行计划"
          >
            <p>请在上方创建您的第一个旅行计划</p>
          </Empty>
        ) : (
          <List
            dataSource={userTrips}
            renderItem={(trip) => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    icon={<EyeOutlined />}
                    onClick={() => viewExistingTripDetails(trip.id)}
                  >
                    查看详情
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={trip.destination}
                  description={
                    <div>
                      <Tag color="blue" icon={<CalendarOutlined />}>
                        {formatDate(trip.start_date)} 至 {formatDate(trip.end_date)}
                      </Tag>
                      <Tag color="green" icon={<UserOutlined />}>
                        {trip.travelers || 1} 人
                      </Tag>
                      {trip.theme && (
                        <Tag color="purple">{trip.theme}</Tag>
                      )}
                      <div style={{ marginTop: '8px', color: '#666' }}>
                        创建时间: {formatDate(trip.created_at)}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
      
      {/* 生成的行程计划模态框 */}
      <Modal
        title="生成的行程计划"
        open={planModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            关闭
          </Button>,
          <Button key="details" type="primary" onClick={viewTripDetails}>
            查看详情
          </Button>
        ]}
        width={800}
      >
        {generatedPlan && (
          <div>
            <h3>{generatedPlan.preferences.destination}</h3>
            <p>
              <Tag color="blue">
                {generatedPlan.preferences.startDate} 至 {generatedPlan.preferences.endDate}
              </Tag>
              <Tag color="green">
                {generatedPlan.preferences.travelers} 人
              </Tag>
              {generatedPlan.preferences.theme && (
                <Tag color="purple">
                  {generatedPlan.preferences.theme}
                </Tag>
              )}
            </p>
            <div style={{ marginTop: '16px' }}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {typeof generatedPlan.plan_content === 'string' 
                  ? generatedPlan.plan_content 
                  : JSON.stringify(generatedPlan.plan_content, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TripPlanningPage;