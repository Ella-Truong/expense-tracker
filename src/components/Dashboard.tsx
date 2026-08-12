import type { Dashboard } from "@/types/dashboard";

type Props = {
  dashboard: Dashboard;
};

export default function Dashboard({ dashboard }: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <Stat label="💰 INCOME" value={dashboard?.totalIncome ?? 0} />
      <Stat label="💸 SPENT" value={dashboard?.totalExpense ?? 0} />
      <Stat label="🪙 BALANCE" value={dashboard?.balance ?? 0} />
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border-4 border-[#3b2a1a] bg-[#f4e7c5] p-5 shadow-[6px_6px_0_#3b2a1a]">
      <p className="text-sm font-black">{label}</p>
      <p className="mt-2 text-2xl font-black">
        ${value.toFixed(2)}
      </p>
    </div>
  );
}