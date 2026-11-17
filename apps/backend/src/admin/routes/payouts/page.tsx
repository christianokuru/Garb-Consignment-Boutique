import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CashSolid } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Prompt, Select, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../../lib/sdk"
import { date, money, period } from "../../lib/format"
import { StatusBadge } from "../../components/status-badge"

type Payout = {
  id: string
  period: string
  amount: number
  item_count: number
  status: string
  state: string
  available_at: string
  paid_at: string | null
  method: string | null
  consignor: { id: string; first_name: string; last_name: string; account_number: string }
}

const lastMonth = () => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

const MarkPaid = ({ payout }: { payout: Payout }) => {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState("E-transfer")
  const queryClient = useQueryClient()
  const pay = useMutation({
    mutationFn: () => api(`/admin/payouts/${payout.id}/mark-paid`, { method: "POST", body: { method } }),
    onSuccess: () => {
      toast.success(`${payout.consignor.first_name}'s payout marked as paid`)
      queryClient.invalidateQueries()
      setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Prompt open={open} onOpenChange={setOpen}>
      <Prompt.Trigger asChild>
        <Button size="small" variant="secondary">Mark paid</Button>
      </Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Pay {money(payout.amount)} to {payout.consignor.first_name} {payout.consignor.last_name}?</Prompt.Title>
          <Prompt.Description>
            <div className="mt-3 flex flex-col gap-1">
              <Label size="small">Paid by</Label>
              <Select value={method} onValueChange={setMethod}>
                <Select.Trigger><Select.Value /></Select.Trigger>
                <Select.Content>
                  {["E-transfer", "Cheque", "Cash", "Store credit"].map((m) => (
                    <Select.Item key={m} value={m}>{m}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </Prompt.Description>
        </Prompt.Header>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action onClick={() => pay.mutate()}>Mark paid</Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

const PayoutsPage = () => {
  const [status, setStatus] = useState("scheduled")
  const [gen, setGen] = useState(lastMonth())
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["garb-payouts", status],
    queryFn: () => api<{ payouts: Payout[] }>("/admin/payouts", { query: status === "all" ? {} : { status } }),
  })
  const generate = useMutation({
    mutationFn: () => api<{ count: number }>("/admin/payouts/generate", { method: "POST", body: { period: gen } }),
    onSuccess: (r) => {
      toast.success(r.count ? `Created or updated ${r.count} payouts for ${period(gen)}` : `No unbatched sales in ${period(gen)}`)
      queryClient.invalidateQueries()
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const payouts = data?.payouts ?? []
  const total = payouts.filter((p) => p.state === "ready").reduce((s, p) => s + p.amount, 0)

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex flex-wrap items-end justify-between gap-3 px-6 py-4">
          <div>
            <Heading level="h1">Payouts</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              A month's sales are grouped automatically on the 5th of the next month and can be collected from the 15th. {total ? `${money(total)} is ready to collect.` : ""}
            </Text>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label size="xsmall">Month</Label>
              <Input size="small" type="month" value={gen} onChange={(e) => setGen(e.target.value)} />
            </div>
            <Button size="small" variant="secondary" onClick={() => generate.mutate()} isLoading={generate.isPending}>
              Group sales
            </Button>
          </div>
        </div>
        <div className="flex gap-2 px-6 py-3">
          {[
            ["scheduled", "To pay"],
            ["paid", "Paid"],
            ["all", "All"],
          ].map(([v, l]) => (
            <Button key={v} size="small" variant={status === v ? "primary" : "transparent"} onClick={() => setStatus(v)}>
              {l}
            </Button>
          ))}
        </div>
        {isLoading ? (
          <div className="px-6 py-8"><Text size="small">Loading…</Text></div>
        ) : payouts.length ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Seller</Table.HeaderCell>
                <Table.HeaderCell>Sales month</Table.HeaderCell>
                <Table.HeaderCell>Items</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payouts.map((p) => (
                <Table.Row key={p.id}>
                  <Table.Cell>
                    <Link to={`/consignors/${p.consignor.id}`} className="hover:underline">
                      {p.consignor.first_name} {p.consignor.last_name}
                    </Link>
                    <Text size="xsmall" className="text-ui-fg-subtle">{p.consignor.account_number}</Text>
                  </Table.Cell>
                  <Table.Cell>{period(p.period)}</Table.Cell>
                  <Table.Cell>{p.item_count}</Table.Cell>
                  <Table.Cell>{money(p.amount)}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={p.state} />
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {p.status === "paid" ? `${date(p.paid_at)}${p.method ? ` · ${p.method}` : ""}` : `From ${date(p.available_at)}`}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className="text-right">{p.status !== "paid" && <MarkPaid payout={p} />}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <div className="px-6 py-8"><Text size="small" className="text-ui-fg-subtle">No payouts here.</Text></div>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Payouts",
  icon: CashSolid,
  rank: 3,
})

export default PayoutsPage
