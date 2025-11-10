import React, { useEffect } from 'react';
import { Card, Form, Input, Button, message, Spin } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateUser } from '../store/features/userSlice';
import { userAPI } from '../services/apiService';

const UserProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [initializing, setInitializing] = React.useState(true);
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();

  // 当用户信息变化时，更新表单数据
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        email: user.email || '',
      });
      setInitializing(false);
    } else {
      // 如果没有用户信息，尝试从localStorage获取
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        form.setFieldsValue({
          email: userData.email || '',
        });
      }
      setInitializing(false);
    }
  }, [user, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (!user) {
        message.error('用户未登录');
        return;
      }

      // 更新用户信息
      const updateData = {
        email: values.email,
      };

      // 调用API更新用户信息
      await userAPI.updateUser(user.id, updateData);

      // 更新Redux状态
      dispatch(updateUser({
        email: values.email,
      }));

      message.success('个人资料已更新！');
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>个人资料</h1>
      
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>保存更改</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UserProfilePage;