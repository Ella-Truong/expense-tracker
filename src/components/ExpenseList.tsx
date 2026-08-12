import { Expense } from "@/types/finance";

type Props = {
  expenses?: Expense[];
  onDelete: (id: number) => Promise<void>;
};

export default function ExpenseList({
  expenses = [],
  onDelete,
}: Props) {
  return (
    <section className="border-4 border-[#3b2a1a] bg-[#f4e7c5] p-6 shadow-[6px_6px_0_#3b2a1a]">
      <h2 className="mb-4 text-xl font-black">
        💸 EXPENSES
      </h2>

      {expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between border-2 border-[#3b2a1a] bg-[#e8d7ad] p-3"
            >
              <div>
                <p className="font-black">
                  {expense.category}
                </p>

                {expense.note && (
                  <p className="text-sm">
                    {expense.note}
                  </p>
                )}

                <p className="text-xs font-bold opacity-70">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-black">
                  ${expense.amount}
                </span>

                <button
                  onClick={() => onDelete(expense.id)}
                  className="border-2 border-[#3b2a1a] bg-[#c96b5c] px-3 py-1 font-bold"
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}