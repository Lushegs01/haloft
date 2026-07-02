"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateBookingStatus, type BookingAction } from "./actions";

const confirmations: Partial<Record<BookingAction, string>> = {
  cancel:
    "Cancel this booking? The room will be freed up unless another active booking holds it.",
  complete: "Mark this booking as completed? The room will be freed up.",
};

const successMessages: Record<BookingAction, string> = {
  confirm: "Booking confirmed. The room is now marked occupied.",
  complete: "Booking completed.",
  cancel: "Booking cancelled.",
};

export function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: BookingAction) {
    const confirmation = confirmations[action];
    if (confirmation && !window.confirm(confirmation)) return;

    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, action);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(successMessages[action]);
        router.refresh();
      }
    });
  }

  if (status !== "pending" && status !== "confirmed") {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          {status === "pending" && (
            <Button size="sm" onClick={() => run("confirm")}>
              Confirm
            </Button>
          )}
          {status === "confirmed" && (
            <Button size="sm" variant="outline" onClick={() => run("complete")}>
              Complete
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => run("cancel")}
          >
            Cancel
          </Button>
        </>
      )}
    </div>
  );
}
