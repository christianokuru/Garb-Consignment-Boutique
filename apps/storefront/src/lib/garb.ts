/**
 * Store facts used across the site. Client-safe (no server imports).
 */
export const STORE = {
  name: "Garb Consignment Boutique",
  shortName: "Garb",
  street: "1046 Queen St W",
  city: "Toronto",
  province: "ON",
  postalCode: "M6J 1H7",
  phone: "416.588.2121",
  phoneHref: "tel:+14165882121",
  email: "consign@garb.ca",
  etransferEmail: process.env.NEXT_PUBLIC_ETRANSFER_EMAIL || "consign@garb.ca",
  instagram: "https://www.instagram.com/garbconsignment/",
  facebook: "https://www.facebook.com/garbTO",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Garb+Consignment+1046+Queen+St+W+Toronto",
  timeZone: "America/Toronto",
  // 0 = Sunday. null = closed.
  hours: [
    [12, 18],
    null,
    [12, 18],
    [12, 18],
    [12, 18],
    [12, 18],
    [12, 18],
  ] as ([number, number] | null)[],
  unpaidHoldHours: 72,
  splitRate: 50,
  displayDays: 90,
} as const

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const formatHour = (h: number) => (h === 12 ? "12" : h > 12 ? String(h - 12) : String(h))

export function hoursLabel(range: [number, number] | null) {
  return range ? `${formatHour(range[0])}–${formatHour(range[1])} pm` : "Closed"
}

/** Current day and hour in Toronto. */
function torontoNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE.timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date)
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun"
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday.slice(0, 3))
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0)
  return { day, time: hour + minute / 60 }
}

export type OpenStatus = { open: boolean; label: string }

/** "Open now · until 6 pm", "Opens today at 12 pm" or "Closed · opens Tuesday at 12 pm". */
export function openStatus(date = new Date()): OpenStatus {
  const { day, time } = torontoNow(date)
  const today = STORE.hours[day]
  if (today && time >= today[0] && time < today[1]) {
    return { open: true, label: `Open now · until ${formatHour(today[1])} pm` }
  }
  if (today && time < today[0]) {
    return { open: false, label: `Opens today at ${formatHour(today[0])} pm` }
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7
    const h = STORE.hours[d]
    if (h) {
      return { open: false, label: `Closed · opens ${i === 1 ? "tomorrow" : DAY_NAMES[d]} at ${formatHour(h[0])} pm` }
    }
  }
  return { open: false, label: "Closed" }
}

export const WOMEN_CATEGORIES = [
  "Outerwear",
  "Dresses",
  "Tops",
  "Knitwear",
  "Pants",
  "Denim",
  "Skirts",
  "Suits & Sets",
  "Bags",
  "Footwear",
  "Accessories",
  "Jewelry",
]
export const MEN_CATEGORIES = ["Outerwear", "Suits", "Shirts", "Knitwear", "Pants", "Footwear", "Bags", "Accessories"]

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const departments = {
  women: { label: "Women", categories: WOMEN_CATEGORIES },
  men: { label: "Men", categories: MEN_CATEGORIES },
} as const

export type Department = keyof typeof departments

export function categoryFromSlug(department: Department, slug: string) {
  return departments[department].categories.find((c) => slugify(c) === slug) ?? null
}

export const formatPrice = (amount: number | null | undefined, opts?: { cents?: boolean }) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  }).format(Number(amount ?? 0))
