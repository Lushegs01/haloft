import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Straight-line walking estimate between two coordinates, at a ~78 m/min
// pace. Listings show it as "≈ N min walk to campus".
export function walkMinutes(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(toLat - fromLat)
  const dLng = toRad(toLng - fromLng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2
  const meters = 2 * R * Math.asin(Math.sqrt(a))
  return Math.max(1, Math.round(meters / 78))
}

// For user input interpolated into PostgREST .or() filter strings:
// strips the characters PostgREST parses as filter syntax so the input
// cannot add or alter filter conditions.
export function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/[,()"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100)
}
