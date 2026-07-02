"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cancelBooking } from "../property/[slug]/booking/actions";

export function CancelBookingButton({
  bookingId,
  campusSlug,
}: {
  bookingId: string;
  campusSlug: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;

    startTransition(async () => {
      const result = await cancelBooking(bookingId, campusSlug);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Booking cancelled.");
        router.refresh();
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={handleCancel}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
      Cancel
    </Button>
  );
}
