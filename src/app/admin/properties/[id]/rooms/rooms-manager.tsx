"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BedDouble, Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import {
  createRoom,
  updateRoom,
  deleteRoom,
  toggleRoomAvailability,
} from "./actions";
import type { Room } from "@/types/database";
import { tenancyTotal } from "@/lib/payments-logic";

const ROOM_TYPES = ["single", "double", "triple", "quad", "suite", "shared"] as const;

const statusColors: Record<string, string> = {
  available: "bg-success/10 text-success border-success/20",
  occupied: "bg-destructive/10 text-destructive border-destructive/20",
  reserved: "bg-amber/10 text-amber border-amber/20",
  maintenance: "bg-muted text-muted-foreground border-border",
};

export function RoomsManager({
  propertyId,
  initialRooms,
}: {
  propertyId: string;
  initialRooms: Room[];
}) {
  const [rooms] = useState<Room[]>(initialRooms);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [saving, startSaving] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  // Rent, agency and caution are charged as one payment, so the form
  // tracks them live and shows the single figure the student will see.
  const [fees, setFees] = useState({ rent: 0, agency: 0, caution: 0 });
  const totalPayable = tenancyTotal(fees.rent, fees.agency, fees.caution);
  const router = useRouter();

  function feesOf(room: Room | null) {
    return {
      rent: Number(room?.annual_rent ?? 0),
      agency: Number(room?.agency_fee ?? 0),
      caution: Number(room?.caution_fee ?? 0),
    };
  }

  function openNew() {
    setEditing(null);
    setFees({ rent: 0, agency: 0, caution: 0 });
    setDialogOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setFees(feesOf(room));
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSaving(async () => {
      const result = editing
        ? await updateRoom(editing.id, formData)
        : await createRoom(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(editing ? "Room updated." : "Room added.");
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  function handleToggle(room: Room) {
    setBusyId(room.id);
    startSaving(async () => {
      const result = await toggleRoomAvailability(
        room.id,
        propertyId,
        !room.is_available
      );
      if (result.error) toast.error(result.error);
      else router.refresh();
      setBusyId(null);
    });
  }

  function handleDelete(room: Room) {
    if (!window.confirm(`Delete "${room.name}"? This cannot be undone.`)) return;
    setBusyId(room.id);
    startSaving(async () => {
      const result = await deleteRoom(room.id, propertyId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Room deleted.");
        router.refresh();
      }
      setBusyId(null);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Rooms</CardTitle>
          <CardDescription>
            The bookable units for this property. Students book rooms, not the property itself.
          </CardDescription>
        </div>
        <Button type="button" onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <BedDouble className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No rooms yet. Add at least one room so students can book this property.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Room</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Payable/yr</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{room.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Sleeps {room.max_occupancy}
                        {room.floor != null ? ` · Floor ${room.floor}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize">{room.room_type}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusColors[room.status] ?? ""}>
                        {room.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₦{tenancyTotal(room.annual_rent, room.agency_fee, room.caution_fee).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {busyId === room.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title={room.is_available ? "Mark under maintenance" : "Mark available"}
                              onClick={() => handleToggle(room)}
                            >
                              {room.is_available ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Edit"
                              onClick={() => openEdit(room)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Delete"
                              onClick={() => handleDelete(room)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Room" : "Add Room"}</DialogTitle>
          </DialogHeader>
          {/* key remounts the form so defaults reset between new/edit */}
          <form onSubmit={handleSubmit} key={editing?.id ?? "new"} className="space-y-4">
            <input type="hidden" name="propertyId" value={propertyId} />

            <div className="space-y-2">
              <Label htmlFor="name">Room name</Label>
              <Input id="name" name="name" required defaultValue={editing?.name ?? ""} placeholder="e.g. Deluxe Single Room (1A)" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomType">Type</Label>
                <Select name="roomType" defaultValue={editing?.room_type ?? "single"}>
                  <SelectTrigger id="roomType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxOccupancy">Max occupancy</Label>
                <Input id="maxOccupancy" name="maxOccupancy" type="number" min={1} required defaultValue={editing?.max_occupancy ?? 1} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualRent">Annual rent (₦)</Label>
                <Input id="annualRent" name="annualRent" type="number" min={0} required
                  defaultValue={editing?.annual_rent ?? ""}
                  onChange={(e) => setFees((f) => ({ ...f, rent: Number(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyFee">Agency fee (₦)</Label>
                <Input id="agencyFee" name="agencyFee" type="number" min={0}
                  defaultValue={editing?.agency_fee ?? 0}
                  onChange={(e) => setFees((f) => ({ ...f, agency: Number(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cautionFee">Caution fee (₦)</Label>
                <Input id="cautionFee" name="cautionFee" type="number" min={0}
                  defaultValue={editing?.caution_fee ?? 0}
                  onChange={(e) => setFees((f) => ({ ...f, caution: Number(e.target.value) || 0 }))} />
              </div>
            </div>

            {/* The student pays all three at once, so show the figure they
                will actually be charged rather than leaving it to be added up
                in someone's head. */}
            <p className="text-[13px] text-muted-foreground">
              Student pays{" "}
              <strong className="text-foreground">
                ₦{totalPayable.toLocaleString()}
              </strong>{" "}
              once, covering a full year.
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input id="floor" name="floor" type="number" min={0} defaultValue={editing?.floor ?? ""} placeholder="—" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Input id="amenities" name="amenities" defaultValue={editing?.amenities?.join(", ") ?? ""} placeholder="en_suite, wardrobe, fan" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} defaultValue={editing?.description ?? ""} placeholder="Optional details about the room" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Add room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
