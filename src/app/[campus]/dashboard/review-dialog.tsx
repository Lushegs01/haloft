"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, Loader2, PenLine } from "lucide-react";
import { submitReview } from "./review-actions";

const CATEGORIES = [
  { name: "overall", label: "Overall" },
  { name: "cleanliness", label: "Cleanliness" },
  { name: "location", label: "Location" },
  { name: "value", label: "Value for money" },
  { name: "management", label: "Management" },
] as const;

function StarRating({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={name}>
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              n <= (hover || value)
                ? "fill-amber text-amber"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewDialog({
  bookingId,
  campusSlug,
  propertyTitle,
}: {
  bookingId: string;
  campusSlug: string;
  propertyTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({
    overall: 0,
    cleanliness: 0,
    location: 0,
    value: 0,
    management: 0,
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (Object.values(ratings).some((r) => r < 1)) {
      toast.error("Please rate every category before submitting.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitReview(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Thanks! Your review will appear once approved.");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 rounded-full"
        onClick={() => setOpen(true)}
      >
        <PenLine className="h-3.5 w-3.5" />
        Write a review
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review your stay</DialogTitle>
          <DialogDescription>{propertyTitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="campusSlug" value={campusSlug} />

          <div className="space-y-3">
            {CATEGORIES.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <Label className="text-sm">{c.label}</Label>
                <StarRating
                  name={c.name}
                  value={ratings[c.name]}
                  onChange={(v) => setRatings((r) => ({ ...r, [c.name]: v }))}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your review (optional)</Label>
            <Textarea
              id="comment"
              name="comment"
              rows={4}
              maxLength={2000}
              placeholder="What was your experience like? What should other students know?"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="gap-2">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
