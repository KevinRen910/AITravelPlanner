import React, { useState, useEffect } from 'react';
import { Card, Button, Input, DatePicker, Select, Form, message, Spin, Modal, Tag, List, Empty, Popconfirm } from 'antd';
import { CompassOutlined, AudioOutlined, StopOutlined, EyeOutlined, CalendarOutlined, UserOutlined, EnvironmentOutlined, DeleteOutlined } from '@ant-design/icons';
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
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  // 语音识别结果将直接回显到 specialRequestsValue
  // 本地受控值，确保 TextArea 能立即回显并与 Form 保持同步
  const [specialRequestsValue, setSpecialRequestsValue] = useState<string>('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  

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

  // 初始化 specialRequests 的本地受控值（如果表单已有初始值）
  useEffect(() => {
    try {
      const init = form.getFieldValue('specialRequests') || '';
      setSpecialRequestsValue(init);
    } catch (e) {
      // ignore
    }
  }, [form]);

  // 开始录音 - 修复版本
  const startRecording = async () => {
    try {
      // 检查语音识别服务可用性
      const status = await speechService.getSpeechStatus();
      
      if (!status.serviceAvailable) {
        message.error('语音识别服务不可用，请检查网络连接或服务配置');
        return;
      }

      setRecording(true);
  // 清空之前的识别结果
      message.info('正在录音...请说话，然后点击停止按钮');
      
      // 开始语音识别（异步，不等待结果）
      speechService.startRecognition()
        .then((transcript) => {
          console.debug('speech recognition result:', transcript);
          if (transcript && transcript.trim()) {
            message.success('语音识别完成！');
            // 识别完成后自动填入表单
            const currentValue = form.getFieldValue('specialRequests') || '';
            const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
            form.setFieldsValue({ specialRequests: newValue });
            // 同步到受控 TextArea
            setSpecialRequestsValue(newValue);
            // 立即读取表单字段以确认回写
            try {
              const after = form.getFieldValue('specialRequests');
              console.debug('specialRequests after setFieldsValue:', after);
            } catch (e) {
              console.error('读取 specialRequests 失败', e);
            }
            } else {
            message.warning('未识别到有效语音内容，请重试');
          }
        })
        .catch((error: any) => {
          console.error('语音识别失败:', error);
          
          // 提供更具体的错误提示
          if (error.message.includes('权限')) {
            message.error('麦克风权限被拒绝，请允许网站访问麦克风');
          } else if (error.message.includes('设备')) {
            message.error('未找到可用的麦克风设备');
          } else if (error.message.includes('超时')) {
            message.error('录音超时，请重试');
          } else {
            message.error(`语音识别失败: ${error.message}`);
          }
        })
        .finally(() => {
          setRecording(false);
        });
      
    } catch (error: any) {
      console.error('启动录音失败:', error);
      message.error('启动录音失败，请重试');
      setRecording(false);
    }
  };

  // 停止录音 - 修复版本
  const stopRecording = () => {
    try {
      // 停止语音识别
      speechService.stopRecognition();
      speechService.stopBackendRecording();
      
      message.info('录音已停止');
    } catch (error) {
      console.error('停止录音失败:', error);
      message.error('停止录音失败');
    } finally {
      setRecording(false);
    }
  };

  // 提交表单，生成行程计划
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 构建用户输入字符串
      const userInput = `目的地：${values.destination}，日期：${values.startDate.format('YYYY-MM-DD')}至${values.endDate.format('YYYY-MM-DD')}，人数：${values.travelers}，主题：${values.theme || '无特定主题'}，特殊需求：${values.specialRequests || '无'}`;
  console.debug('userInput built:', userInput);
      
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
        start_date: values.startDate.format('YYYY-MM-DD'),
        end_date: values.endDate.format('YYYY-MM-DD'),
        travelers: values.travelers,
        theme: values.theme,
        special_requests: values.specialRequests,
        preferences: {
          destination: values.destination,
          startDate: values.startDate.format('YYYY-MM-DD'),
          endDate: values.endDate.format('YYYY-MM-DD'),
          travelers: values.travelers,
          theme: values.theme,
          specialRequests: values.specialRequests
        }
      });
      
  // 后端返回可能的形态：{ message, trip }，或直接返回 trip object
  const tripData = response.data?.trip ?? response.data;
      
      // 验证返回的数据结构
      if (!tripData?.id || !tripData?.destination) {
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
    setPlanModalVisible(false);
    navigate(`/trips/${generatedPlan.id}`);
  };

  // 查看地图视图
  const viewTripMap = () => {
    setPlanModalVisible(false);
    navigate(`/trips/${generatedPlan.id}/map`);
  };

  // 删除行程
  const handleDeleteTrip = async (tripId: string) => {
    setDeletingTripId(tripId);
    try {
      await tripAPI.deleteTrip(tripId);
      
      // 从本地状态中移除已删除的行程
      setUserTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
      
      // 从localStorage中移除
      try {
        const savedTrips = localStorage.getItem('userTrips');
        if (savedTrips) {
          let trips = JSON.parse(savedTrips);
          trips = trips.filter((t: any) => t.id !== tripId);
          localStorage.setItem('userTrips', JSON.stringify(trips));
        }
      } catch (storageError) {
        console.error('从localStorage删除行程失败:', storageError);
      }
      
      message.success('行程已删除');
    } catch (error: any) {
      console.error('删除行程失败:', error);
      message.error(error.response?.data?.error || '删除行程失败');
    } finally {
      setDeletingTripId(null);
    }
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

  // 检查用户是否已登录（放在所有 Hook 之后以保证 Hooks 顺序稳定）
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

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>智能行程规划</h1>
      
      <Card title="创建新的旅行计划" style={{ marginBottom: '24px' }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* 目的地字段 - 确保在最顶部 */}
          <Form.Item 
            label="目的地" 
            name="destination" 
            rules={[{ required: true, message: '请输入目的地' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input 
              placeholder="请输入您想去的地方" 
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          {/* 日期选择器 - 使用网格布局确保并排显示 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Form.Item 
              label="开始日期" 
              name="startDate"
              rules={[{ required: true, message: '请选择开始日期' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                placeholder="选择开始日期"
                size="large"
              />
            </Form.Item>
            
            <Form.Item 
              label="结束日期" 
              name="endDate"
              rules={[{ required: true, message: '请选择结束日期' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                placeholder="选择结束日期"
                size="large"
              />
            </Form.Item>
          </div>
          
          {/* 其他字段 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Form.Item label="旅行人数" name="travelers" initialValue={1}>
              <Input type="number" min={1} size="large" />
            </Form.Item>
            
            <Form.Item label="旅行主题" name="theme">
              <Select placeholder="选择旅行主题" size="large">
                <Option value="relaxation">休闲度假</Option>
                <Option value="adventure">冒险探索</Option>
                <Option value="culture">文化体验</Option>
                <Option value="food">美食之旅</Option>
                <Option value="shopping">购物血拼</Option>
              </Select>
            </Form.Item>
          </div>
          
          <Form.Item label="特殊需求" name="specialRequests" style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <TextArea 
                rows={4} 
                placeholder="请输入您的特殊要求或偏好，或使用右侧语音输入功能" 
                size="large"
                style={{ paddingRight: '60px' }}  // 为语音按钮留出空间
                value={specialRequestsValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setSpecialRequestsValue(v);
                  try { form.setFieldsValue({ specialRequests: v }); } catch (err) { /* ignore */ }
                }}
              />
              <div style={{ 
                position: 'absolute', 
                right: '8px', 
                bottom: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                {recording && (
                  <div style={{ display: 'flex', alignItems: 'center', color: '#ff4d4f' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ff4d4f',
                      marginRight: '4px',
                      animation: 'pulse 1s infinite'
                    }}></div>
                    <span style={{ fontSize: '12px' }}>录音中...</span>
                  </div>
                )}
                <Button
                  type="text"
                  icon={recording ? <StopOutlined /> : <AudioOutlined />}
                  onClick={() => {
                    if (recording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                  }}
                  style={{ 
                    color: recording ? '#ff4d4f' : '#1890ff',
                    border: recording ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    height: '32px'
                  }}
                  title={recording ? '停止录音' : '开始语音输入'}
                >
                  {recording ? '停止' : '语音'}
                </Button>
              </div>
            </div>
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              icon={<CompassOutlined />}
              size="large"
              style={{ width: '200px', height: '40px' }}
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
                  </Button>,
                  <Popconfirm
                    title="确定要删除这个行程吗？"
                    description="删除后将无法恢复，请谨慎操作。"
                    onConfirm={() => handleDeleteTrip(trip.id)}
                    okText="确定"
                    cancelText="取消"
                    okType="danger"
                  >
                    <Button 
                      type="link" 
                      danger 
                      icon={<DeleteOutlined />}
                      loading={deletingTripId === trip.id}
                    >
                      删除
                    </Button>
                  </Popconfirm>
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
          <Button key="map" icon={<EnvironmentOutlined />} onClick={viewTripMap}>
            地图视图
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
              {/* 优先渲染结构化内容（若存在），否则显示 plan_text */}
              {(() => {
                const pc = generatedPlan.plan_content || {};
                const structured = pc.structured || null;
                const text = generatedPlan.plan_text || pc.text || '';

                if (structured && Array.isArray(structured.dailyItinerary)) {
                  return (
                    <div>
                      {structured.dailyItinerary.map((day: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: '12px' }}>
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
                        </div>
                      ))}
                      {/* 预算与推荐信息 */}
                      {structured.recommendations && (
                        <div style={{ marginTop: '8px' }}>
                          <h4>推荐</h4>
                          {structured.recommendations.attractions && <p><strong>推荐景点：</strong>{structured.recommendations.attractions.join('、')}</p>}
                          {structured.recommendations.restaurants && <p><strong>推荐餐厅：</strong>{structured.recommendations.restaurants.join('、')}</p>}
                          {structured.recommendations.tips && <p><strong>旅行贴士：</strong>{structured.recommendations.tips.join('；')}</p>}
                        </div>
                      )}
                      {structured.budgetEstimation && (
                        <div style={{ marginTop: '8px' }}>
                          <h4>预算估算</h4>
                          <p>总计：{structured.budgetEstimation.total} 元</p>
                          {structured.budgetEstimation.categories && (
                            <div>
                              {Object.entries(structured.budgetEstimation.categories).map(([k, v]) => (
                                <div key={k}><strong>{k}：</strong>{String(v)} 元</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                // fallback: 显示纯文本摘要
                return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</pre>;
              })()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TripPlanningPage;