const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

// 获取用户的所有预算
router.get('/user/:userId', budgetController.getUserBudgets);

// 获取单个预算详情
router.get('/:id', budgetController.getBudgetById);

// 创建新预算
router.post('/', budgetController.createBudget);

// 更新预算
router.put('/:id', budgetController.updateBudget);

// 删除预算
router.delete('/:id', budgetController.deleteBudget);

// 添加支出
router.post('/:budgetId/expenses', budgetController.addExpense);

// 获取预算的所有支出
router.get('/:budgetId/expenses', budgetController.getExpenses);

// 更新支出
router.put('/expenses/:expenseId', budgetController.updateExpense);

// 删除支出
router.delete('/expenses/:expenseId', budgetController.deleteExpense);

module.exports = router;