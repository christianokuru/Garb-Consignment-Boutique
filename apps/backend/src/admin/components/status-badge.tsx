import { StatusBadge as Badge } from "@medusajs/ui"
import { statusColor, statusLabel } from "../lib/format"

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge color={statusColor[status] ?? "grey"}>{statusLabel[status] ?? status}</Badge>
)
