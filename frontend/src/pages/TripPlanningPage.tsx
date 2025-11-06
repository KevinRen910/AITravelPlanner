import React, { useState, useRef } from 'react';
import { Card, Button, Input, DatePicker, Select, Form, message, Spin, Modal, Tag } from 'antd';
import { CompassOutlined, AudioOutlined, StopOutlined } from '@ant-design/icons';
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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

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
      
      // 调用API生成行程计划
      const response = await tripAPI.createTrip({
        userId: user.id,
        userInput,
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
      
      // 更新Redux状态
      dispatch(addTrip(tripData));
      
      // 显示生成的计划
      setGeneratedPlan(tripData);
      setPlanModalVisible(true);
      
      message.success('行程规划已生成！');
    } catch (error: any) {
      message.error(error.response?.data?.error || '生成行程计划失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看行程详情
  const viewTripDetails = () => {
    setPlanModalVisible(false);
    navigate(`/trips/${generatedPlan.id}`);
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
        <p>请先创建新的旅行计划。</p>
      </Card>
      
      {/* 生成的行程计划模态框 */}
      <Modal
        title="生成的行程计划"
        open={planModalVisible}
        onCancel={() => setPlanModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPlanModalVisible(false)}>
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