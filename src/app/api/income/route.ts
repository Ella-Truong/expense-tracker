import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import type { IncomeInput } from "@/types/finance";

// Insert an income into a database
export async function POST(request: NextRequest){
    try{
        const body: IncomeInput = await request.json();

        if (!body.amount || body.amount == 0 || !body.date) {
            return NextResponse.json(
                { error: "Amount and date are required."},
                {status: 400 }
            )
        };

        const income = await prisma.income.create({
            data: {
                amount: body.amount,
                note: body.note,
                date: new Date(body.date),
            }
        });

        return NextResponse.json(income, {status: 201});
    }catch{
        return NextResponse.json(
            { error: "Failed to create income"},
            { status: 500 }
        )
    }
}


// retrive an income from database
export async function GET(){
    try{
        const income = await prisma.income.findMany({
            orderBy: {
                date: "desc",
            }
        });

        return NextResponse.json(income)

    }catch{
        return NextResponse.json(
            { error: "Failed to fetch income"},
            { status: 500 }
        )

    }
}