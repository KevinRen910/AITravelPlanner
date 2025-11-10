import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import store, { RootState } from './store';
import { setUser } from './store/features/userSlice';
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

// 保护路由组件 - 添加实际的认证检查
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// 用户状态初始化组件
const UserInitializer: React.FC = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // 从localStorage恢复用户状态
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        dispatch(setUser(userData));
        console.log('用户状态已从localStorage恢复:', userData);
      } catch (error) {
        console.error('恢复用户状态失败:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, [dispatch]);
  
  return null;
};

// 行程状态初始化组件
const TripInitializer: React.FC = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // 从localStorage恢复行程状态
    const savedTrips = localStorage.getItem('userTrips');
    
    if (savedTrips) {
      try {
        const tripsData = JSON.parse(savedTrips);
        // 如果有行程数据，更新Redux状态
        tripsData.forEach((trip: any) => {
          dispatch(addTrip(trip));
        });
        console.log('行程状态已从localStorage恢复:', tripsData.length, '条记录');
      } catch (error) {
        console.error('恢复行程状态失败:', error);
        localStorage.removeItem('userTrips');
      }
    }
  }, [dispatch]);
  
  return null;
};

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <Router>
          <UserInitializer />
          <TripInitializer />
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