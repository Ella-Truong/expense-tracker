"use client";

import { FormEvent, useState } from "react";
import type { IncomeInput } from "@/types/finance";

type Props = {
  onSubmit: (data: IncomeInput) => Promise<void>;
};

export default function IncomeForm({ onSubmit }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    await onSubmit({
      amount: Number(amount),
      note,
      date,
    });

    setAmount("");
    setNote("");
    setDate("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-4 border-[#3b2a1a] bg-[#e8d7ad] p-6 shadow-[6px_6px_0_#3b2a1a]"
    >
      <h2 className="mb-5 text-xl font-black">
        🟩 ADD INCOME
      </h2>

      <div className="space-y-4">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full border-4 border-[#3b2a1a] bg-[#fff8df] p-2"
        />

        <input
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border-4 border-[#3b2a1a] bg-[#fff8df] p-2"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border-4 border-[#3b2a1a] bg-[#fff8df] p-2"
        />

        <button className="w-full border-4 border-[#3b2a1a] bg-[#6b9f45] p-3 font-black shadow-[4px_4px_0_#3b2a1a]">
          + ADD INCOME
        </button>
      </div>
    </form>
  );
}