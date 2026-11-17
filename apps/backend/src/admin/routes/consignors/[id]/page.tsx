import { Button, Container, Copy, Heading, Input, Label, Tabs, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../../../lib/sdk"
import { date, money, period } from "../../../lib/format"
import { AdminItem, ItemTable, LoadingRow } from "../../../components/item-table"
import { StatusBadge } from "../../../components/status-badge"

type Detail = {
  id: string
  account_number: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  split_rate: number
  notes: string | null
  has_account: boolean
  invite_pending: boolean
  invite_expires_at: string | null
  created_at: string
  items: AdminItem[]
  payouts: { id: string; period: string; amount: number; item_count: number; status: string; available_at: string; paid_at: string | null; method: string | null }[]
}

const ConsignorDetailPage = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["garb-consignor", id],
    queryFn: () => api<{ consignor: Detail }>(`/admin/consignors/${id}`),
  })
  const c = data?.consignor
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", split_rate: "50", notes: "" })
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  useEffect(() => {
    if (c) {
      setForm({
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone ?? "",
        split_rate: String(c.split_rate),
        notes: c.notes ?? "",
      })
    }
  }, [c?.id])

  const save = useMutation({
    mutationFn: () =>
      api(`/admin/consignors/${id}`, {
        method: "POST",
        body: { ...form, split_rate: Number(form.split_rate), phone: form.phone || null, notes: form.notes || null },
      }),
    onSuccess: () => {
      toast.success("Saved")
      queryClient.invalidateQueries({ queryKey: ["garb-consignor", id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const invite = useMutation({
    mutationFn: () => api<{ invite_url: string }>(`/admin/consignors/${id}/invite`, { method: "POST" }),
    onSuccess: (r) => {
      setInviteUrl(r.invite_url)
      toast.success("Invite sent by email")
      queryClient.invalidateQueries({ queryKey: ["garb-consignor", id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading || !c) {
    return <Container><LoadingRow /></Container>
  }
  const by = (s: string[]) => c.items.filter((i) => s.includes(i.status))
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const earned = by(["sold"]).reduce((s, i) => s + Number(i.consignor_share ?? 0), 0)

  return (
    <div className="flex flex-col gap-y-3 lg:flex-row lg:items-start lg:gap-x-3">
      <div className="flex flex-1 flex-col gap-y-3">
        <Container className="p-0">
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">{c.account_number} · since {date(c.created_at)}</Text>
            <Heading level="h1">{c.first_name} {c.last_name}</Heading>
          </div>
          <div className="grid grid-cols-3 divide-x border-t">
            <div className="px-6 py-3"><Text size="xsmall" className="text-ui-fg-subtle">On the floor</Text><Heading level="h3">{by(["active"]).length}</Heading></div>
            <div className="px-6 py-3"><Text size="xsmall" className="text-ui-fg-subtle">Sold</Text><Heading level="h3">{by(["sold"]).length}</Heading></div>
            <div className="px-6 py-3"><Text size="xsmall" className="text-ui-fg-subtle">Lifetime earnings</Text><Heading level="h3">{money(earned)}</Heading></div>
          </div>
        </Container>
        <Container className="p-0">
          <Tabs defaultValue="active">
            <div className="border-b px-6 py-3">
              <Tabs.List>
                <Tabs.Trigger value="active">On the floor ({by(["active"]).length})</Tabs.Trigger>
                <Tabs.Trigger value="sold">Sold ({by(["sold"]).length})</Tabs.Trigger>
                <Tabs.Trigger value="other">Returned & expired ({by(["expired", "returned", "forfeited", "withdrawn"]).length})</Tabs.Trigger>
                <Tabs.Trigger value="payouts">Payouts ({c.payouts.length})</Tabs.Trigger>
              </Tabs.List>
            </div>
            <Tabs.Content value="active"><ItemTable showConsignor={false} items={by(["active"])} empty="No pieces on the floor. Assign this seller on a product page." /></Tabs.Content>
            <Tabs.Content value="sold"><ItemTable showConsignor={false} items={by(["sold"])} empty="Nothing sold yet." /></Tabs.Content>
            <Tabs.Content value="other"><ItemTable showConsignor={false} items={by(["expired", "returned", "forfeited", "withdrawn"])} empty="Nothing here." /></Tabs.Content>
            <Tabs.Content value="payouts">
              {c.payouts.length ? (
                <div className="divide-y">
                  {c.payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <Text size="small" weight="plus">{period(p.period)} sales</Text>
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          {p.item_count} items · {p.status === "paid" ? `Paid ${date(p.paid_at)}${p.method ? ` by ${p.method}` : ""}` : `Collectable from ${date(p.available_at)}`}
                        </Text>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={p.status === "paid" ? "paid" : new Date(p.available_at) <= new Date() ? "ready" : "scheduled"} />
                        <Text weight="plus">{money(p.amount)}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8"><Text size="small" className="text-ui-fg-subtle">No payouts yet.</Text></div>
              )}
            </Tabs.Content>
          </Tabs>
        </Container>
      </div>

      <div className="flex w-full flex-col gap-y-3 lg:max-w-[380px]">
        <Container className="flex flex-col gap-3 px-6 py-4">
          <Heading level="h2">Seller dashboard</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {c.has_account
              ? "This seller has an online account and can follow their pieces and payouts."
              : c.invite_pending
                ? `Invite sent. It expires ${date(c.invite_expires_at)}.`
                : "Send an invite so this seller can follow their pieces online."}
          </Text>
          {!c.has_account && (
            <Button size="small" variant="secondary" onClick={() => invite.mutate()} isLoading={invite.isPending}>
              {c.invite_pending ? "Send a new invite" : "Send invite"}
            </Button>
          )}
          {inviteUrl && (
            <div className="bg-ui-bg-subtle flex items-center gap-2 rounded-md p-2">
              <Text size="xsmall" className="truncate">{inviteUrl}</Text>
              <Copy content={inviteUrl} />
            </div>
          )}
        </Container>
        <Container className="px-6 py-4">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate()
            }}
          >
            <Heading level="h2">Details</Heading>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1"><Label size="small">First name</Label><Input size="small" value={form.first_name} onChange={set("first_name")} /></div>
              <div className="flex flex-col gap-1"><Label size="small">Last name</Label><Input size="small" value={form.last_name} onChange={set("last_name")} /></div>
            </div>
            <div className="flex flex-col gap-1"><Label size="small">Email</Label><Input size="small" type="email" value={form.email} onChange={set("email")} /></div>
            <div className="flex flex-col gap-1"><Label size="small">Phone</Label><Input size="small" value={form.phone} onChange={set("phone")} /></div>
            <div className="flex flex-col gap-1"><Label size="small">Seller's split (%)</Label><Input size="small" type="number" min={0} max={100} value={form.split_rate} onChange={set("split_rate")} /></div>
            <div className="flex flex-col gap-1"><Label size="small">Notes</Label><Textarea value={form.notes} onChange={set("notes")} /></div>
            <Button size="small" type="submit" isLoading={save.isPending}>Save</Button>
          </form>
        </Container>
      </div>
    </div>
  )
}

export default ConsignorDetailPage
