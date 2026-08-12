"use client";

import { useEffect, useState } from "react";
import type { Dashboard } from "@/types/dashboard";
import type {
  ExpenseInput,
  IncomeInput,
  Expense,
  Income,
} from "@/types/finance";

export function useFinance() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  async function loadData() {
    const [dashboardRes, incomeRes, expenseRes] = await Promise.all([
      fetch("/api/dashboard"),
      fetch("/api/income"),
      fetch("/api/expenses"),
    ]);

    const [dashboardData, incomeData, expenseData] = await Promise.all([
      dashboardRes.json(),
      incomeRes.json(),
      expenseRes.json(),
    ]);


    setDashboard(dashboardData);
    setIncomes(incomeData);
    setExpenses(expenseData);
  }

  useEffect(() => {
    async function fetchInitialData() {
      const [dashboardRes, incomeRes, expenseRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/income"),
        fetch("/api/expenses"),
      ]);

      const [dashboardData, incomeData, expenseData] = await Promise.all([
        dashboardRes.json(),
        incomeRes.json(),
        expenseRes.json(),
      ]);

      setDashboard(dashboardData);
      setIncomes(incomeData);
      setExpenses(expenseData);
    }

    fetchInitialData();
  }, []);

  async function addIncome(data: IncomeInput) {
    await fetch("/api/income", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    await loadData();
  }

  async function addExpense(data: ExpenseInput) {
    await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    await loadData();
  }

  async function deleteIncome(id: number) {
    await fetch(`/api/income/${id}`, {
      method: "DELETE",
    });

    await loadData();
  }

  async function deleteExpense(id: number) {
    await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
    });

    await loadData();
  }

  return {
    dashboard,
    incomes,
    expenses,
    addIncome,
    addExpense,
    deleteIncome,
    deleteExpense,
  };
}