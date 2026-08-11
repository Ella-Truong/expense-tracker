export type IncomeInput = {
    amount: number;
    note?: string;
    date: string;
}


export type ExpenseInput = {
    amount: number;
    note?: string;
    category: string;
    date: string;
}