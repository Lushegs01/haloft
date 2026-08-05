/** Shared display formatting for marketplace data. */

const NAIRA = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number): string {
  return NAIRA.format(amount);
}

/** Compact form for tight metadata rows: ₦350k rather than ₦350,000. */
export function formatNairaShort(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `₦${millions % 1 === 0 ? millions : millions.toFixed(1)}m`;
  }
  if (amount >= 1_000) return `₦${Math.round(amount / 1_000)}k`;
  return `₦${amount}`;
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  hostel: "Hostel",
  apartment: "Apartment",
  shared_house: "Shared flat",
  single_room: "Single room",
  self_contained: "Self-contained",
  studio: "Studio",
};

export function propertyTypeLabel(value: string | null | undefined): string {
  if (!value) return "Property";
  return PROPERTY_TYPE_LABELS[value] ?? value.replace(/_/g, " ");
}
