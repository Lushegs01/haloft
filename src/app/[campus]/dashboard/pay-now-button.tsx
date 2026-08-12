"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { initializePayment } from "./payment-actions";

export function PayNowButton({
  bookingId,
  amount,
}: {
  bookingId: string;
  amount: number;
}) {
  const [pending, startTransition] = useTransition();

  function handlePay() {
    startTransition(async () => {
      // No campus argument: the payment callback resolves the campus from
      // the booking, so nothing about the destination rides along with
      // the transaction.
      const result = await initializePayment(bookingId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    });
  }

  return (
    <Button
      size="sm"
      className="gap-1.5 rounded-full shadow-sm shadow-primary/20"
      disabled={pending}
      onClick={handlePay}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CreditCard className="h-3.5 w-3.5" />
      )}
      Pay ₦{amount.toLocaleString()}
    </Button>
  );
}
