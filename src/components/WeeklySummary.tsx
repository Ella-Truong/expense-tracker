import type { WeeklyExpense } from "@/types/dashboard";

type Props = {
  expenses: WeeklyExpense[];
};

export default function WeeklySummary({ expenses }: Props) {
  if (!expenses || expenses.length === 0) {
    return null;
  }

  return (
    <section className="border-4 border-[#3b2a1a] bg-[#f4e7c5] p-6 shadow-[6px_6px_0_#3b2a1a]">
      <h2 className="mb-4 text-xl font-black">
        📦 WEEKLY SUMMARY
      </h2>

      <div className="space-y-2">
        {expenses.map((expense, index) => (
          <div
            key={index}
            className="flex justify-between border-2 border-[#3b2a1a] bg-[#e8d7ad] p-3"
          >
            <span>
              {expense.category} —{" "}
              {new Date(expense.date).toLocaleDateString()}
            </span>

            <span className="font-bold">
              ${expense.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}