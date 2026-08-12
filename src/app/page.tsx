"use client";

import Dashboard from "@/components/Dashboard";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import IncomeForm from "@/components/IncomeForm";
import IncomeList from "@/components/IncomeList";
import WeeklySummary from "@/components/WeeklySummary";
import { useFinance } from "@/hooks/useFinance";

export default function Home() {
  const {
    dashboard,
    incomes,
    expenses,
    addIncome,
    addExpense,
    deleteIncome,
    deleteExpense,
  } = useFinance();

  if (!dashboard) {
    return <main className="p-8">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-[#87b85c] p-4 font-mono text-[#2f2418] sm:p-8">
      <div className="mx-auto max-w-5xl space-y-8">

        <header className="border-4 border-[#3b2a1a] bg-[#f4e7c5] p-6 shadow-[8px_8px_0_#3b2a1a]">
          <p className="text-sm font-bold text-[#4d7c32]">
            🌱 FARM LEDGER
          </p>

          <h1 className="mt-2 text-3xl font-black">
            EXPENSE TRACKER
          </h1>

          <p className="mt-2 text-sm">
            Keep track of your coins. 🪙
          </p>
        </header>

        <Dashboard dashboard={dashboard} />

        <section className="grid gap-6 md:grid-cols-2">
          <IncomeForm onSubmit={addIncome} />
          <ExpenseForm onSubmit={addExpense} />
        </section>

        <WeeklySummary expenses={dashboard.weeklyExpense} />

        <IncomeList
          incomes={incomes}
          onDelete={deleteIncome}
        />

        <ExpenseList
          expenses={expenses}
          onDelete={deleteExpense}
        />

        <footer className="pb-6 text-center text-sm font-bold">
          🧱 Your coins, your world.
        </footer>

      </div>
    </main>
  );
}