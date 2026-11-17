export const money = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(n ?? 0))

export const date = (d: string | Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(d)) : "—"

export const dateTime = (d: string | Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d)) : "—"

export const period = (p: string) => {
  const [y, m] = p.split("-").map(Number)
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1))
}

export const daysUntil = (d: string | Date) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)

export type ItemStatus = "active" | "sold" | "expired" | "returned" | "forfeited" | "withdrawn"

export const statusColor: Record<string, "green" | "blue" | "orange" | "grey" | "red" | "purple"> = {
  active: "green",
  sold: "blue",
  expired: "orange",
  returned: "grey",
  forfeited: "purple",
  withdrawn: "grey",
  scheduled: "orange",
  ready: "green",
  paid: "grey",
  new: "blue",
  confirmed: "green",
  completed: "grey",
  cancelled: "red",
}

export const statusLabel: Record<string, string> = {
  active: "On the floor",
  sold: "Sold",
  expired: "Awaiting pickup",
  returned: "Returned to seller",
  forfeited: "Garb property",
  withdrawn: "Withdrawn",
  scheduled: "Scheduled",
  ready: "Ready to collect",
  paid: "Paid",
  new: "New",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}
