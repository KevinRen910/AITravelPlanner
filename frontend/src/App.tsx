import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/index';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TripPlanningPage from './pages/TripPlanningPage';
import BudgetManagementPage from './pages/BudgetManagementPage';
import UserProfilePage from './pages/UserProfilePage';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/trip-planning" element={<TripPlanningPage />} />
              <Route path="/budget-management" element={<BudgetManagementPage />} />
              <Route path="/user-profile" element={<UserProfilePage />} />
            </Routes>
          </Layout>
        </Router>
      </ConfigProvider>
    </Provider>
  );
}

export default App;