const SupabaseService = require('./supabaseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
  // 用户注册
  static async register(userData) {
    try {
      // 检查邮箱是否已存在
      const existingUser = await SupabaseService.query('users', {
        where: { email: userData.email },
        select: 'id'
      });
      
      if (existingUser.length > 0) {
        throw new Error('用户已存在');
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // 创建用户
      const user = await SupabaseService.insert('users', {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        preferences: userData.preferences || {}
      });
      
      // 生成JWT令牌
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { 
        expiresIn: '7d' 
      });
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          preferences: user.preferences
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // 用户登录
  static async login(email, password) {
    try {
      const users = await SupabaseService.query('users', {
        where: { email },
        select: '*'
      });
      
      if (users.length === 0) {
        throw new Error('邮箱或密码不正确');
      }
      
      const user = users[0];
      
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('邮箱或密码不正确');
      }
      
      // 生成JWT令牌
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { 
        expiresIn: '7d' 
      });
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          preferences: user.preferences
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取用户信息
  static async getUserById(id) {
    try {
      const users = await SupabaseService.query('users', {
        where: { id },
        select: 'id, username, email, phone, preferences, created_at'
      });
      
      if (users.length === 0) {
        throw new Error('用户不存在');
      }
      
      return users[0];
    } catch (error) {
      throw error;
    }
  }

  // 更新用户信息
  static async updateUser(id, userData) {
    try {
      const updatedUser = await SupabaseService.update('users', id, {
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        preferences: userData.preferences
      });
      
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // 获取用户行程
  static async getUserTrips(userId) {
    try {
      const trips = await SupabaseService.query('trips', {
        where: { user_id: userId },
        orderBy: { column: 'created_at', ascending: false }
      });
      
      return trips;
    } catch (error) {
      throw error;
    }
  }

  // 获取用户预算
  static async getUserBudgets(userId) {
    try {
      const budgets = await SupabaseService.query('budgets', {
        where: { user_id: userId },
        orderBy: { column: 'created_at', ascending: false }
      });
      
      return budgets;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserService;
