import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import type { ExpenseInput } from "@/types/finance";


export async function POST(request: NextRequest) {
  try {
    const body: ExpenseInput = await request.json();

    if (
      !body.amount ||
      body.amount <= 0 ||
      !body.category ||
      !body.date
    ) {
      return NextResponse.json(
        { error: "Amount, category, and date are required" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        amount: body.amount,
        category: body.category,
        note: body.note,
        date: new Date(body.date),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}