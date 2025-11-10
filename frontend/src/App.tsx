import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import store from './store';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TripPlanningPage from './pages/TripPlanningPage';
import TripDetailPage from './pages/TripDetailPage';
import TripMapPage from './pages/TripMapPage';
import BudgetManagementPage from './pages/BudgetManagementPage';
import UserProfilePage from './pages/UserProfilePage';
import LoginPage from './pages/LoginPage';
import ApiKeySettingsPage from './pages/ApiKeySettingsPage';
import { setUser } from './store/features/userSlice';
import 'antd/dist/reset.css';
import './App.css';

// 用户状态初始化组件
const UserInitializer: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // 从localStorage恢复用户状态
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch(setUser(user));
        console.log('用户状态已从localStorage恢复');
      } catch (error) {
        console.error('恢复用户状态失败:', error);
        // 清除无效的localStorage数据
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [dispatch]);

  return null;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <UserInitializer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/trips" element={<Layout><TripPlanningPage /></Layout>} />
        <Route path="/trips/:id" element={<Layout><TripDetailPage /></Layout>} />
        <Route path="/trips/:id/map" element={<Layout><TripMapPage /></Layout>} />
        <Route path="/budget" element={<Layout><BudgetManagementPage /></Layout>} />
        <Route path="/profile" element={<Layout><UserProfilePage /></Layout>} />
        <Route path="/api-keys" element={<Layout><ApiKeySettingsPage /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <AppContent />
      </ConfigProvider>
    </Provider>
  );
};

export default App;