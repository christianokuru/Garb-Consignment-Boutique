/**
 * Shared Garb business rules.
 */

export const DEFAULT_SPLIT_RATE = 50
export const STANDARD_DISPLAY_DAYS = 90
export const EXTENDED_DISPLAY_DAYS = 180
export const PICKUP_WINDOW_DAYS = 7
export const PAYOUT_DAY_OF_MONTH = 15
// Luxury bags and other highly desirable pieces stay on the floor twice as long.
export const EXTENDED_DISPLAY_PRICE = 1500

const DAY = 24 * 60 * 60 * 1000

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function displayDaysFor(category: string | null | undefined, price: number) {
  if ((category ?? "").toLowerCase().includes("bag") || price >= EXTENDED_DISPLAY_PRICE) {
    return EXTENDED_DISPLAY_DAYS
  }
  return STANDARD_DISPLAY_DAYS
}

export function addDays(date: Date | string, days: number) {
  return new Date(new Date(date).getTime() + days * DAY)
}

/** "2026-10" for any date in October 2026 (store time zone is close enough to UTC for monthly grouping). */
export function periodFor(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** Sales from a month can be collected on or after the 15th of the following month. */
export function payoutAvailableAt(period: string) {
  const [year, month] = period.split("-").map(Number)
  // month is 1-based, so `month` as a 0-based index is the following month.
  return new Date(Date.UTC(year, month, PAYOUT_DAY_OF_MONTH, 12))
}

export function previousPeriod(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1)
  return periodFor(d)
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function consignorShare(salePrice: number, splitRate: number) {
  return roundMoney((salePrice * splitRate) / 100)
}
