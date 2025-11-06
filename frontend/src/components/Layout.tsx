import React, { ReactNode } from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { HomeOutlined, CalendarOutlined, WalletOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Sider } = AntLayout;

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/trip-planning',
      icon: <CalendarOutlined />,
      label: '行程规划',
    },
    {
      key: '/budget-management',
      icon: <WalletOutlined />,
      label: '预算管理',
    },
    {
      key: '/user-profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header className="header" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="logo" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          AI旅行规划助手
        </div>
      </Header>
      <AntLayout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            selectedKeys={[currentPath]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={(e) => navigate(e.key)}
          />
        </Sider>
        <AntLayout style={{ padding: '24px' }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            {children}
          </Content>
        </AntLayout>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;