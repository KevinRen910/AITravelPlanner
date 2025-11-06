import React from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { RcFile } from 'antd/es/upload';

const UserProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  // 模拟用户数据
  const initialValues = {
    name: '旅行爱好者',
    email: 'travel@example.com',
    phone: '13800138000',
    preferences: '喜欢自然风光和美食体验'
  };

  const onFinish = () => {
    setLoading(true);
    // 模拟保存用户信息
    setTimeout(() => {
      message.success('个人资料已更新！');
      setLoading(false);
    }, 1000);
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

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>个人资料</h1>
      
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={initialValues}>
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