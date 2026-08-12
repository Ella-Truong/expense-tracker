import { Income } from "@/types/finance";

type Props = {
  incomes: Income[];
  onDelete: (id: number) => Promise<void>;
};

export default function IncomeList({
  incomes,
  onDelete,
}: Props) {
  return (
    <section className="border-4 border-[#3b2a1a] bg-[#f4e7c5] p-6 shadow-[6px_6px_0_#3b2a1a]">
      <h2 className="mb-4 text-xl font-black">
        💰 INCOME
      </h2>

      {incomes.length === 0 ? (
        <p>No income records yet.</p>
      ) : (
        <div className="space-y-2">
          {incomes.map((income) => (
            <div
              key={income.id}
              className="flex justify-between border-2 border-[#3b2a1a] bg-[#e8d7ad] p-3"
            >
              <span>
                ${income.amount} — {income.note ?? "No note"}
              </span>

              <button
                onClick={() => onDelete(income.id)}
                className="border-2 border-[#3b2a1a] bg-[#c96b5c] px-3 py-1 font-bold"
              >
                DELETE
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}