import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import store from './store';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TripPlanningPage from './pages/TripPlanningPage';
import TripDetailPage from './pages/TripDetailPage';
import BudgetManagementPage from './pages/BudgetManagementPage';
import UserProfilePage from './pages/UserProfilePage';
import LoginPage from './pages/LoginPage';
import ApiKeySettingsPage from './pages/ApiKeySettingsPage';
import 'antd/dist/reset.css';
import './App.css';

// 保护路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 这里可以添加认证逻辑
  return <>{children}</>;
};

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/trips" element={
              <ProtectedRoute>
                <Layout>
                  <TripPlanningPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/trips/:id" element={
              <ProtectedRoute>
                <Layout>
                  <TripDetailPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/budget" element={
              <ProtectedRoute>
                <Layout>
                  <BudgetManagementPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <UserProfilePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/api-keys" element={
              <ProtectedRoute>
                <Layout>
                  <ApiKeySettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ConfigProvider>
    </Provider>
  );
}

export default App;