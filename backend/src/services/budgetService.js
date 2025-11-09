const SupabaseService = require('./supabaseService');
const aiService = require('./aiService');

class BudgetService {
  // 创建预算
  static async createBudget(userId, tripId, budgetData) {
    try {
      // 调用AI分析预算
      const budgetAnalysis = await aiService.analyzeBudget(budgetData);
      
      const budget = await SupabaseService.insert('budgets', {
        user_id: userId,
        trip_id: tripId,
        total_amount: budgetData.totalAmount,
        categories: budgetData.categories || {},
        ...budgetAnalysis
      });
      
      return budget;
    } catch (error) {
      throw error;
    }
  }

  // 添加支出
  static async addExpense(budgetId, expenseData) {
    try {
      const expense = await SupabaseService.insert('expenses', {
        budget_id: budgetId,
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date
      });
      
      // 更新预算的已花费金额
      await this.updateBudgetSpentAmount(budgetId);
      
      return expense;
    } catch (error) {
      throw error;
    }
  }

  // 更新预算花费金额
  static async updateBudgetSpentAmount(budgetId) {
    try {
      const expenses = await SupabaseService.query('expenses', {
        where: { budget_id: budgetId },
        select: 'amount'
      });
      
      const totalSpent = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      await SupabaseService.update('budgets', budgetId, {
        spent_amount: totalSpent
      });
      
      return totalSpent;
    } catch (error) {
      throw error;
    }
  }

  // 获取预算统计
  static async getBudgetStats(userId) {
    try {
      const budgets = await SupabaseService.query('budgets', {
        where: { user_id: userId }
      });
      
      const totalBudgets = budgets.length;
      const totalAmount = budgets.reduce((sum, budget) => sum + parseFloat(budget.total_amount), 0);
      const totalSpent = budgets.reduce((sum, budget) => sum + parseFloat(budget.spent_amount), 0);
      
      return {
        totalBudgets,
        totalAmount,
        totalSpent,
        remaining: totalAmount - totalSpent
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BudgetService;
