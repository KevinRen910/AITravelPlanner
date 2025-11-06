import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Expense {
  id: string;
  tripId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  currency: string;
  receipt?: string;
}

interface Budget {
  id: string;
  tripId: string;
  totalBudget: number;
  spent: number;
  currency: string;
  expenses: Expense[];
}

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
}

const initialState: BudgetState = {
  budgets: [],
  loading: false,
  error: null,
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    setBudgets: (state, action: PayloadAction<Budget[]>) => {
      state.budgets = action.payload;
    },
    addBudget: (state, action: PayloadAction<Budget>) => {
      state.budgets.push(action.payload);
    },
    updateBudget: (state, action: PayloadAction<Budget>) => {
      const index = state.budgets.findIndex(budget => budget.id === action.payload.id);
      if (index !== -1) {
        state.budgets[index] = action.payload;
      }
    },
    deleteBudget: (state, action: PayloadAction<string>) => {
      state.budgets = state.budgets.filter(budget => budget.id !== action.payload);
    },
    addExpense: (state, action: PayloadAction<{ budgetId: string; expense: Expense }>) => {
      const budget = state.budgets.find(b => b.id === action.payload.budgetId);
      if (budget) {
        budget.expenses.push(action.payload.expense);
        budget.spent += action.payload.expense.amount;
      }
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      state.budgets.forEach(budget => {
        const expenseIndex = budget.expenses.findIndex(e => e.id === action.payload.id);
        if (expenseIndex !== -1) {
          const oldAmount = budget.expenses[expenseIndex].amount;
          budget.expenses[expenseIndex] = action.payload;
          budget.spent = budget.spent - oldAmount + action.payload.amount;
        }
      });
    },
    deleteExpense: (state, action: PayloadAction<{ budgetId: string; expenseId: string }>) => {
      const budget = state.budgets.find(b => b.id === action.payload.budgetId);
      if (budget) {
        const expenseIndex = budget.expenses.findIndex(e => e.id === action.payload.expenseId);
        if (expenseIndex !== -1) {
          budget.spent -= budget.expenses[expenseIndex].amount;
          budget.expenses.splice(expenseIndex, 1);
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setBudgets, addBudget, updateBudget, deleteBudget, addExpense, updateExpense, deleteExpense, setLoading, setError } = budgetSlice.actions;

export default budgetSlice.reducer;