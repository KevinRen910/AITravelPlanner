import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { userAPI } from '../services/apiService';
import { setUser } from '../store/features/userSlice';

const { TabPane } = Tabs;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 登录处理
  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await userAPI.login(values);
      const { user, token } = response.data;
      
      // 保存token和用户信息到localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // 更新Redux状态
      dispatch(setUser(user));
      
      message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 注册处理
  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const response = await userAPI.register(values);
      const { user, token } = response.data;
      
      // 保存token和用户信息到localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // 更新Redux状态
      dispatch(setUser(user));
      
      message.success('注册成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f0f2f5'
    }}>
      <Card title="AI旅行规划师" style={{ width: 400 }}>
        <Tabs defaultActiveKey="login">
          <TabPane tab="登录" key="login">
            <Form
              name="login"
              onFinish={handleLogin}
              autoComplete="off"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="邮箱" 
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ width: '100%' }}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab="注册" key="register">
            <Form
              name="register"
              onFinish={handleRegister}
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名" 
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="邮箱" 
                />
              </Form.Item>

              <Form.Item
                name="phone"
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="手机号（可选）" 
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="确认密码" 
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ width: '100%' }}
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;