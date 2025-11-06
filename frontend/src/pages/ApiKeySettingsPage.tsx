import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Tabs, Divider } from 'antd';
import { KeyOutlined, SaveOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiKeyAPI } from '../services/apiService';

const { TabPane } = Tabs;
const { TextArea } = Input;

const ApiKeySettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    // 加载用户现有的API密钥
    const loadApiKeys = async () => {
      if (user.id) {
        try {
          const response = await apiKeyAPI.getUserApiKeys(user.id);
          // 这里只加载名称，不加载实际密钥
          // 实际密钥不会从后端返回，只显示是否已配置
          form.setFieldsValue({
            aiConfigured: response.data.some((key: any) => key.service === 'ai' && key.is_active),
            speechConfigured: response.data.some((key: any) => key.service === 'speech' && key.is_active),
            mapConfigured: response.data.some((key: any) => key.service === 'map' && key.is_active),
          });
        } catch (error) {
          console.error('加载API密钥失败:', error);
        }
      }
    };

    loadApiKeys();
  }, [user.id, form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const apiKeys = [];
      
      if (values.aiKey) {
        apiKeys.push({ service: 'ai', key: values.aiKey });
      }
      
      if (values.speechKey) {
        apiKeys.push({ service: 'speech', key: values.speechKey });
      }
      
      if (values.mapKey) {
        apiKeys.push({ service: 'map', key: values.mapKey });
      }
      
      if (apiKeys.length > 0) {
        await apiKeyAPI.updateApiKeys(user.id, apiKeys);
        message.success('API密钥保存成功');
      } else {
        message.warning('请至少配置一个API密钥');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>API密钥设置</h1>
      
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <p>为了使用AI旅行规划师的所有功能，您需要配置以下API密钥：</p>
          <p>1. <strong>AI模型API密钥</strong>：用于生成旅行计划和预算分析</p>
          <p>2. <strong>语音识别API密钥</strong>：用于语音输入功能</p>
          <p>3. <strong>地图服务API密钥</strong>：用于地图显示和导航功能</p>
          <Divider />
          <p style={{ color: '#ff4d4f' }}>
            <strong>注意：</strong>您的API密钥将被安全存储，不会与任何人共享。
            请勿使用他人的API密钥，以免产生额外费用。
          </p>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Tabs defaultActiveKey="ai">
            <TabPane tab={<span><KeyOutlined />AI模型</span>} key="ai">
              <Form.Item
                label="AI模型API密钥"
                name="aiKey"
                help="支持OpenAI、阿里云百炼等大语言模型API"
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入AI模型API密钥" 
                />
              </Form.Item>
            </TabPane>
            
            <TabPane tab={<span><KeyOutlined />语音识别</span>} key="speech">
              <Form.Item
                label="语音识别API密钥"
                name="speechKey"
                help="支持科大讯飞等语音识别API"
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入语音识别API密钥" 
                />
              </Form.Item>
            </TabPane>
            
            <TabPane tab={<span><KeyOutlined />地图服务</span>} key="map">
              <Form.Item
                label="地图服务API密钥"
                name="mapKey"
                help="支持高德地图、百度地图等地图API"
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入地图服务API密钥" 
                />
              </Form.Item>
            </TabPane>
          </Tabs>
          
          <Form.Item style={{ marginTop: '24px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
            >
              保存API密钥
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ApiKeySettingsPage;