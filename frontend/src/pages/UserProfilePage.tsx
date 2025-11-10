import React, { useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message, Spin } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { RcFile } from 'antd/es/upload';
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
        name: user.name || '',
        email: user.email || '',
        phone: user.preferences?.phone || '',
        preferences: user.preferences?.description || ''
      });
      setInitializing(false);
    } else {
      // 如果没有用户信息，尝试从localStorage获取
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        form.setFieldsValue({
          name: userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
          preferences: userData.preferences?.description || ''
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
      const response = await userAPI.updateUser(user.id, {
        username: values.name,
        email: values.email,
        phone: values.phone,
        preferences: {
          ...user.preferences,
          phone: values.phone,
          description: values.preferences
        }
      });

      // 更新Redux状态
      dispatch(updateUser({
        name: values.name,
        email: values.email,
        preferences: {
          ...user.preferences,
          phone: values.phone,
          description: values.preferences
        }
      }));

      message.success('个人资料已更新！');
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 上传头像配置
  const uploadProps: UploadProps = {
    name: 'avatar',
    headers: {
      authorization: 'authorization-text',
    },
    beforeUpload: (file: RcFile) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('您只能上传JPG/PNG文件！');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小必须小于2MB！');
        return Upload.LIST_IGNORE;
      }
      return false; // 阻止自动上传
    },
    showUploadList: false,
    customRequest: ({ onSuccess }) => {
      setTimeout(() => {
        onSuccess?.("ok");
        message.success('头像上传成功！');
      }, 0);
    },
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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ marginRight: '16px' }} />
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>更换头像</Button>
            </Upload>
          </div>
          
          <Form.Item label="用户名" name="name" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
          
          <Form.Item label="手机号码" name="phone">
            <Input placeholder="请输入手机号码" />
          </Form.Item>
          
          <Form.Item label="旅行偏好" name="preferences">
            <Input.TextArea rows={4} placeholder="请描述您的旅行偏好" />
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