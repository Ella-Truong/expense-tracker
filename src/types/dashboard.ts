export type WeeklyExpense = {
    amount: number;
    category: string;
    date: string;
}


export type Dashboard = {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    weeklyExpense: WeeklyExpense[];
}