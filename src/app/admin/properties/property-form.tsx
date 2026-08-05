"use client";

import { useState } from "react";
import Link from "next/link";
import { createProperty, updateProperty } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { Property, Campus, Neighbourhood, Landlord } from "@/types/database";

interface PropertyFormProps {
  property?: Property;
  campuses: Campus[];
  neighbourhoods: Neighbourhood[];
  landlords: Landlord[];
}

export function PropertyForm({ property, campuses, neighbourhoods, landlords }: PropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState(property?.campus_id ?? "");
  const isEdit = !!property;

  const filteredNeighbourhoods = neighbourhoods.filter(
    (n) => n.campus_id === selectedCampus
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    if (isEdit && property) {
      const result = await updateProperty(property.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Property updated successfully!");
      }
    } else {
      const result = await createProperty(formData);
      if (result.error) {
        toast.error(result.error);
      }
      // redirect handled by server action on success
    }

    setLoading(false);
  }

  const propertyTypes = [
    { value: "hostel", label: "Hostel" },
    { value: "apartment", label: "Apartment" },
    { value: "shared_house", label: "Shared House" },
    { value: "single_room", label: "Single Room" },
    { value: "self_contained", label: "Self Contained" },
    { value: "studio", label: "Studio" },
  ];

  const statuses = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "unpublished", label: "Unpublished" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/properties">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? "Edit Property" : "New Property"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update property details" : "Create a new property listing"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={property?.title}
                placeholder="Property title"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={property?.description ?? ""}
                placeholder="Property description"
                rows={4}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={property?.address}
                placeholder="Full address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campusId">Campus</Label>
              <Select
                name="campusId"
                defaultValue={property?.campus_id ?? ""}
                onValueChange={(v) => setSelectedCampus(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighbourhoodId">Neighbourhood</Label>
              <Select
                name="neighbourhoodId"
                defaultValue={property?.neighbourhood_id ?? ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select neighbourhood" />
                </SelectTrigger>
                <SelectContent>
                  {filteredNeighbourhoods.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select
                name="propertyType"
                defaultValue={property?.property_type ?? "hostel"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                defaultValue={property?.status ?? "draft"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="landlordId">Landlord</Label>
              <Select
                name="landlordId"
                defaultValue={property?.landlord_id ?? ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select landlord" />
                </SelectTrigger>
                <SelectContent>
                  {landlords.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                defaultValue={property?.latitude ?? ""}
                placeholder="7.2500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                defaultValue={property?.longitude ?? ""}
                placeholder="3.4500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities & Rules</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Input
                id="amenities"
                name="amenities"
                defaultValue={property?.amenities?.join(", ") ?? ""}
                placeholder="wifi, 24_7_power, security, kitchen, laundry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rules">House Rules (one per line)</Label>
              <Textarea
                id="rules"
                name="rules"
                defaultValue={property?.rules?.join("\n") ?? ""}
                placeholder="No smoking&#10;No pets&#10;Quiet hours after 10pm"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                name="metaTitle"
                defaultValue={property?.meta_title ?? ""}
                placeholder="Custom page title for SEO"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                name="metaDescription"
                defaultValue={property?.meta_description ?? ""}
                placeholder="Custom description for SEO"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? "Save Changes" : "Create Property"}
          </Button>
          <Link href="/admin/properties">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
