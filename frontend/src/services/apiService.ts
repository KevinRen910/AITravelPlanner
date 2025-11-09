import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器，自动添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器，处理错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 未授权，清除token并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 用户相关API
export const userAPI = {
  // 用户注册
  register: (userData: any) => api.post('/users/register', userData),
  
  // 用户登录
  login: (credentials: any) => api.post('/users/login', credentials),
  
  // 获取用户信息
  getUserById: (id: string) => api.get(`/users/${id}`),
  
  // 更新用户信息
  updateUser: (id: string, userData: any) => api.put(`/users/${id}`, userData),
};

// 行程相关API
export const tripAPI = {
  // 创建行程
  createTrip: (tripData: any) => api.post('/trips', tripData),
  
  // 获取用户的所有行程
  getUserTrips: (userId: string) => api.get(`/trips/user/${userId}`),
  
  // 获取单个行程详情
  getTripById: (id: string) => api.get(`/trips/${id}`),
  
  // 更新行程
  updateTrip: (id: string, tripData: any) => api.put(`/trips/${id}`, tripData),
  
  // 删除行程
  deleteTrip: (id: string) => api.delete(`/trips/${id}`),
};

// 预算相关API
export const budgetAPI = {
  // 获取用户的所有预算
  getUserBudgets: (userId: string) => api.get(`/budgets/user/${userId}`),
  
  // 获取单个预算详情
  getBudgetById: (id: string) => api.get(`/budgets/${id}`),
  
  // 创建新预算
  createBudget: (budgetData: any) => api.post('/budgets', budgetData),
  
  // 更新预算
  updateBudget: (id: string, budgetData: any) => api.put(`/budgets/${id}`, budgetData),
  
  // 删除预算
  deleteBudget: (id: string) => api.delete(`/budgets/${id}`),
  
  // 添加支出
  addExpense: (budgetId: string, expenseData: any) => api.post(`/budgets/${budgetId}/expenses`, expenseData),
  
  // 获取预算的所有支出
  getExpenses: (budgetId: string) => api.get(`/budgets/${budgetId}/expenses`),
  
  // 更新支出
  updateExpense: (expenseId: string, expenseData: any) => api.put(`/budgets/expenses/${expenseId}`, expenseData),
  
  // 删除支出
  deleteExpense: (expenseId: string) => api.delete(`/budgets/expenses/${expenseId}`),
};

// API密钥相关API
export const apiKeyAPI = {
  // 获取用户的API密钥
  getUserApiKeys: (userId: string) => api.get(`/apikeys/user/${userId}`),
  
  // 更新API密钥
  updateApiKeys: (userId: string, apiKeys: any) => api.put(`/apikeys/user/${userId}`, { apiKeys }),
};

// 地图相关API
export const mapAPI = {
  // 地理编码
  geocode: (addressData: any) => api.post('/map/geocode', addressData),
  
  // 逆地理编码
  reverseGeocode: (coordsData: any) => api.post('/map/reverse-geocode', coordsData),
  
  // 搜索地点
  searchPlaces: (searchData: any) => api.post('/map/search-places', searchData),
  
  // 路径规划
  drivingRoute: (routeData: any) => api.post('/map/driving-route', routeData),
  
  // 获取天气
  getWeather: (weatherData: any) => api.post('/map/weather', weatherData),
  
  // 检查服务状态
  checkStatus: () => api.get('/map/status'),
};

export default api;