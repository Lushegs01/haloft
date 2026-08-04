"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { RoomListing } from "@/types/database";

interface BookingFormProps {
  room: RoomListing;
  propertySlug: string;
  campusSlug: string;
  propertyTitle: string;
  /** False when the room is already reserved, occupied, or under maintenance */
  isBookable?: boolean;
}

export function BookingForm({
  room,
  propertySlug,
  campusSlug,
  propertyTitle,
  isBookable = true,
}: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const monthlyPrice = room.price_per_month ?? 0;
  const depositMonths = room.deposit_months ?? 1;
  const deposit = monthlyPrice * depositMonths;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createBooking(formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    // Show the confirmation, then move the student to their dashboard.
    // Staying here is not an option: the booking reserved this room, so a
    // re-render of this route would no longer find it as bookable.
    setSuccess(true);
    toast.success("Booking submitted successfully!");
    router.push(`/${campusSlug}/dashboard`);
  }

  if (!isBookable && !success) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-lg">
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">This room is taken</h2>
            <p className="text-muted-foreground mb-6">
              {room.name} at {propertyTitle} is no longer available. Other rooms
              at this property may still be open.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push(`/${campusSlug}/property/${propertySlug}`)}>
                See other rooms here
              </Button>
              <Button variant="outline" onClick={() => router.push(`/${campusSlug}/search`)}>
                Browse all listings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-lg">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              Your booking request has been submitted. You will receive a confirmation email once it is reviewed by our team.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push(`/${campusSlug}/dashboard`)}>
                View My Bookings
              </Button>
              <Button variant="outline" onClick={() => router.push(`/${campusSlug}/property/${propertySlug}`)}>
                Back to Property
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Book Your Room</h1>
        <p className="text-muted-foreground mb-6">
          {propertyTitle} — {room.name}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Details
              </CardTitle>
              <CardDescription>Select your move-in and move-out dates</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="roomId" value={room.id ?? ""} />
                <input type="hidden" name="propertyId" value={room.property_id ?? ""} />
                <input type="hidden" name="campusSlug" value={campusSlug} />

                <div className="space-y-2">
                  <Label htmlFor="checkInDate">Move-in Date</Label>
                  <Input
                    id="checkInDate"
                    name="checkInDate"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOutDate">Move-out Date</Label>
                  <Input
                    id="checkOutDate"
                    name="checkOutDate"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests (optional)</Label>
                  <Input
                    id="specialRequests"
                    name="specialRequests"
                    placeholder="Any specific needs or questions..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Booking Request
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span>₦{monthlyPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Security Deposit</span>
                  <span>₦{deposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit Months</span>
                  <span>{depositMonths}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>First Payment</span>
                  <span>₦{(monthlyPrice + deposit).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm"><span className="font-medium">Room:</span> {room.name}</p>
                <p className="text-sm"><span className="font-medium">Type:</span> {room.room_type}</p>
                <p className="text-sm"><span className="font-medium">Capacity:</span> {room.max_occupancy} person(s)</p>
                <p className="text-sm"><span className="font-medium">Floor:</span> {room.floor ?? "N/A"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
