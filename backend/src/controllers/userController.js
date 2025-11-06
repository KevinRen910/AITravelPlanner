const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserController {
  // 用户注册
  async register(req, res) {
    try {
      const { username, email, password, phone, preferences } = req.body;
      
      // 检查用户是否已存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        return res.status(400).json({ error: '用户已存在' });
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 创建用户
      const { data, error } = await supabase
        .from('users')
        .insert({
          username,
          email,
          password: hashedPassword,
          phone,
          preferences: preferences || {},
          created_at: new Date(),
          updated_at: new Date()
        })
        .select();
      
      if (error) throw error;
      
      // 生成JWT令牌
      const token = jwt.sign({ id: data[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
      res.status(201).json({
        user: {
          id: data[0].id,
          username: data[0].username,
          email: data[0].email,
          phone: data[0].phone,
          preferences: data[0].preferences
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 用户登录
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // 查找用户
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !user) {
        return res.status(401).json({ error: '邮箱或密码不正确' });
      }
      
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: '邮箱或密码不正确' });
      }
      
      // 生成JWT令牌
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          preferences: user.preferences
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取用户信息
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, phone, preferences, created_at')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 更新用户信息
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, phone, preferences } = req.body;
      
      const { data, error } = await supabase
        .from('users')
        .update({
          username,
          email,
          phone,
          preferences,
          updated_at: new Date()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      res.status(200).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();