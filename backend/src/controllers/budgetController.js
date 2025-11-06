const supabase = require('../config/supabase');
const aiService = require('../services/aiService');

class BudgetController {
  // 获取用户的所有预算
  async getUserBudgets(req, res) {
    try {
      const { userId } = req.params;
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取单个预算详情
  async getBudgetById(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 创建新预算
  async createBudget(req, res) {
    try {
      const { userId, tripId, totalAmount, categories } = req.body;
      
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          trip_id: tripId,
          total_amount: totalAmount,
          categories: categories || {},
          spent_amount: 0,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select();
      
      if (error) throw error;
      
      res.status(201).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 更新预算
  async updateBudget(req, res) {
    try {
      const { id } = req.params;
      const { totalAmount, categories } = req.body;
      
      const { data, error } = await supabase
        .from('budgets')
        .update({
          total_amount: totalAmount,
          categories: categories,
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

  // 删除预算
  async deleteBudget(req, res) {
    try {
      const { id } = req.params;
      
      // 先删除与该预算相关的所有支出
      await supabase
        .from('expenses')
        .delete()
        .eq('budget_id', id);
      
      // 再删除预算
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 添加支出
  async addExpense(req, res) {
    try {
      const { budgetId } = req.params;
      const { amount, category, description, date } = req.body;
      
      // 添加支出
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          budget_id: budgetId,
          amount,
          category,
          description,
          date: date || new Date().toISOString().split('T')[0],
          created_at: new Date()
        })
        .select();
      
      if (expenseError) throw expenseError;
      
      // 更新预算的已花费金额
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('spent_amount')
        .eq('id', budgetId)
        .single();
      
      if (budgetError) throw budgetError;
      
      const newSpentAmount = budgetData.spent_amount + amount;
      
      const { error: updateError } = await supabase
        .from('budgets')
        .update({
          spent_amount: newSpentAmount,
          updated_at: new Date()
        })
        .eq('id', budgetId);
      
      if (updateError) throw updateError;
      
      res.status(201).json(expenseData[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取预算的所有支出
  async getExpenses(req, res) {
    try {
      const { budgetId } = req.params;
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('budget_id', budgetId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 更新支出
  async updateExpense(req, res) {
    try {
      const { expenseId } = req.params;
      const { amount, category, description, date } = req.body;
      
      // 获取原始支出金额
      const { data: originalExpense, error: fetchError } = await supabase
        .from('expenses')
        .select('amount, budget_id')
        .eq('id', expenseId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // 更新支出
      const { data, error } = await supabase
        .from('expenses')
        .update({
          amount,
          category,
          description,
          date,
          updated_at: new Date()
        })
        .eq('id', expenseId)
        .select();
      
      if (error) throw error;
      
      // 更新预算的已花费金额
      const amountDifference = amount - originalExpense.amount;
      
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('spent_amount')
        .eq('id', originalExpense.budget_id)
        .single();
      
      if (budgetError) throw budgetError;
      
      const newSpentAmount = budgetData.spent_amount + amountDifference;
      
      const { error: updateError } = await supabase
        .from('budgets')
        .update({
          spent_amount: newSpentAmount,
          updated_at: new Date()
        })
        .eq('id', originalExpense.budget_id);
      
      if (updateError) throw updateError;
      
      res.status(200).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 删除支出
  async deleteExpense(req, res) {
    try {
      const { expenseId } = req.params;
      
      // 获取支出金额和预算ID
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('amount, budget_id')
        .eq('id', expenseId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // 删除支出
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
      
      // 更新预算的已花费金额
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('spent_amount')
        .eq('id', expense.budget_id)
        .single();
      
      if (budgetError) throw budgetError;
      
      const newSpentAmount = budgetData.spent_amount - expense.amount;
      
      const { error: updateError } = await supabase
        .from('budgets')
        .update({
          spent_amount: newSpentAmount,
          updated_at: new Date()
        })
        .eq('id', expense.budget_id);
      
      if (updateError) throw updateError;
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BudgetController();