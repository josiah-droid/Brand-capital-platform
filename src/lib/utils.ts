import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (amount === null || amount === undefined) return "-"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount)
}

export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return "-"

  return new Intl.NumberFormat("en-US", options).format(value)
}

export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "-"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date))
}

export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return "-"

  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)

  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "text-red-600 bg-red-100"
    case "high":
      return "text-orange-600 bg-orange-100"
    case "medium":
      return "text-yellow-600 bg-yellow-100"
    case "low":
      return "text-green-600 bg-green-100"
    default:
      return "text-gray-600 bg-gray-100"
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-100"
    case "in_progress":
      return "text-blue-600 bg-blue-100"
    case "blocked":
      return "text-red-600 bg-red-100"
    case "todo":
      return "text-gray-600 bg-gray-100"
    default:
      return "text-gray-600 bg-gray-100"
  }
}
