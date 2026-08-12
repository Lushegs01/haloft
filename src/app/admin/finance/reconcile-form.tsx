"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { recordRefund, resolveReconciliation } from "./actions";

/**
 * The two things an operator does with an anomalous payment: send the
 * money back, or say why they are not going to.
 *
 * The refund amount is prefilled with what the ledger says is
 * outstanding, because that is right nearly every time — and it is an
 * input rather than a button because the exception is real: a duplicate
 * may be refunded in part when the student wants the balance held for
 * another room.
 */
export function ReconcileForm({
  paymentId,
  outstanding,
}: {
  paymentId: string;
  outstanding: number;
}) {
  const [amount, setAmount] = useState(String(outstanding));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(action: (fd: FormData) => Promise<{ error?: string; success?: boolean }>, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("paymentId", paymentId);
    formData.set("amount", amount);
    formData.set("reference", reference);
    formData.set("notes", notes);
    for (const [key, value] of Object.entries(extra ?? {})) {
      formData.set(key, value);
    }

    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Recorded.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:flex-wrap">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Refund amount
        <Input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-9 w-36"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Paystack refund ref
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="RFND-…"
          className="h-9 w-40"
        />
      </label>

      <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
        Note
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What was done, and why"
          className="h-9 min-w-[12rem]"
        />
      </label>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => submit(recordRefund)}
          title="Records a refund already issued in the Paystack dashboard"
        >
          {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Record refund
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => submit(resolveReconciliation, { status: "resolved" })}
        >
          Mark resolved
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => submit(resolveReconciliation, { status: "written_off" })}
          title="Money that will not be recovered or returned. Needs a note."
        >
          Write off
        </Button>
      </div>
    </div>
  );
}
