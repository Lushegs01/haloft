import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
