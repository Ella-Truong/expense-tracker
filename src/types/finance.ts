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


export type Income = {
  id: number;
  amount: string;
  note: string | null;
  date: string;
};

export type Expense = {
  id: number;
  amount: string;
  category: string;
  note: string | null;
  date: string;
};
