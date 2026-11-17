import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArchiveBox } from "@medusajs/icons"
import { Container, Heading, Tabs, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../lib/sdk"
import { money } from "../../lib/format"
import { AdminItem, ItemTable, LoadingRow } from "../../components/item-table"

type Overview = {
  active: number
  expiring_this_week: number
  awaiting_pickup: number
  sold_this_month: number
  sales_this_month: number
  unbatched_earnings: number
  payouts_ready: number
  new_appointments: number
}

const Stat = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="flex flex-col gap-1 px-6 py-4">
    <Text size="small" className="text-ui-fg-subtle">{label}</Text>
    <Heading level="h2">{value}</Heading>
    {hint && <Text size="xsmall" className="text-ui-fg-muted">{hint}</Text>}
  </div>
)

const useItems = (status: string) =>
  useQuery({
    queryKey: ["garb-items", status],
    queryFn: () => api<{ items: AdminItem[] }>("/admin/consignment-items", { query: { status } }),
  })

const ConsignmentPage = () => {
  const overview = useQuery({ queryKey: ["garb-overview"], queryFn: () => api<{ overview: Overview }>("/admin/garb/overview") })
  const active = useItems("active")
  const expired = useItems("expired")
  const sold = useItems("sold")
  const o = overview.data?.overview
  const soon = (active.data?.items ?? []).filter((i) => new Date(i.expires_at).getTime() < Date.now() + 14 * 86400000)

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h1">Consignment</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Pieces on the floor, what needs attention, and what has sold. Sellers earn their split when a piece sells; payouts are grouped monthly and collectable from the 15th.
          </Text>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y border-t md:grid-cols-4 md:divide-y-0">
          <Stat label="On the floor" value={o?.active ?? "–"} hint={`${o?.expiring_this_week ?? 0} ending this week`} />
          <Stat label="Awaiting pickup" value={o?.awaiting_pickup ?? "–"} hint="Display period ended" />
          <Stat label="Sold this month" value={o?.sold_this_month ?? "–"} hint={money(o?.sales_this_month)} />
          <Stat label="Payouts ready" value={money(o?.payouts_ready)} hint={`${money(o?.unbatched_earnings)} not yet batched`} />
        </div>
      </Container>

      <Container className="p-0">
        <Tabs defaultValue="attention">
          <div className="border-b px-6 py-3">
            <Tabs.List>
              <Tabs.Trigger value="attention">Needs attention ({soon.length + (expired.data?.items.length ?? 0)})</Tabs.Trigger>
              <Tabs.Trigger value="active">On the floor ({active.data?.items.length ?? 0})</Tabs.Trigger>
              <Tabs.Trigger value="sold">Sold ({sold.data?.items.length ?? 0})</Tabs.Trigger>
            </Tabs.List>
          </div>
          <Tabs.Content value="attention">
            {expired.isLoading || active.isLoading ? (
              <LoadingRow />
            ) : (
              <ItemTable
                items={[...(expired.data?.items ?? []), ...soon]}
                empty="Nothing needs attention. No pieces are waiting for pickup or ending in the next two weeks."
              />
            )}
          </Tabs.Content>
          <Tabs.Content value="active">
            {active.isLoading ? <LoadingRow /> : <ItemTable items={active.data?.items ?? []} empty="No pieces on the floor." />}
          </Tabs.Content>
          <Tabs.Content value="sold">
            {sold.isLoading ? (
              <LoadingRow />
            ) : (
              <ItemTable
                items={[...(sold.data?.items ?? [])].sort((a, b) => new Date(b.sold_at ?? 0).getTime() - new Date(a.sold_at ?? 0).getTime())}
                empty="Nothing sold yet."
              />
            )}
          </Tabs.Content>
        </Tabs>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Consignment",
  icon: ArchiveBox,
  rank: 1,
})

export default ConsignmentPage
