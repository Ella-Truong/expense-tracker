import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWeeklySummaryRange } from "@/lib/date";

export async function GET() {
  try {
    const range = getWeeklySummaryRange();

    const [incomeResult, expenseResult, weeklyExpenses] =
      await Promise.all([
        prisma.income.aggregate({
          _sum: {
            amount: true,
          },
        }),

        prisma.expense.aggregate({
          _sum: {
            amount: true, 
          },
        }),

        range
          ? prisma.expense.findMany({
              where: {
                date: {
                  gte: range.startOfWeek,
                  lte: range.endOfWeek,
                },
              },
              orderBy: {
                date: "asc",
              },
              select: {
                amount: true,
                category: true,
                date: true,
              },
            })
          : Promise.resolve([]),
      ]);

    const totalIncome = Number(incomeResult._sum.amount ?? 0);
    const totalExpense = Number(expenseResult._sum.amount ?? 0);

    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      weeklyExpenses: weeklyExpenses.map((expense) => ({
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}