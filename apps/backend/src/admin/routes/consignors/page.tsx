import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import { Badge, Button, Container, Drawer, Heading, Input, Label, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "../../lib/sdk"
import { money } from "../../lib/format"

type Row = {
  id: string
  account_number: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  split_rate: number
  has_account: boolean
  active_count: number
  sold_count: number
  awaiting_pickup_count: number
  unpaid_earnings: number
}

const empty = { first_name: "", last_name: "", email: "", phone: "", split_rate: "50", notes: "" }

const CreateConsignor = () => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const create = useMutation({
    mutationFn: () =>
      api<{ consignor: { id: string } }>("/admin/consignors", {
        method: "POST",
        body: { ...form, split_rate: Number(form.split_rate), phone: form.phone || null, notes: form.notes || null },
      }),
    onSuccess: ({ consignor }) => {
      toast.success("Consignor added")
      queryClient.invalidateQueries({ queryKey: ["garb-consignors"] })
      setOpen(false)
      setForm(empty)
      navigate(`/consignors/${consignor.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button size="small" variant="secondary">Add consignor</Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Add consignor</Drawer.Title>
        </Drawer.Header>
        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
        >
          <Drawer.Body className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" required value={form.first_name} onChange={set("first_name")} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" required value={form.last_name} onChange={set("last_name")} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={set("email")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="split_rate">Seller's split (%)</Label>
              <Input id="split_rate" type="number" min={0} max={100} value={form.split_rate} onChange={set("split_rate")} />
              <Text size="xsmall" className="text-ui-fg-subtle">Garb's standard split is 50%.</Text>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={set("notes")} />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary" size="small" type="button">Cancel</Button>
            </Drawer.Close>
            <Button size="small" type="submit" isLoading={create.isPending}>Save</Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}

const ConsignorsPage = () => {
  const [q, setQ] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["garb-consignors", q],
    queryFn: () => api<{ consignors: Row[] }>("/admin/consignors", { query: q ? { q } : {} }),
  })
  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading level="h1">Consignors</Heading>
          <Text size="small" className="text-ui-fg-subtle">People who sell through Garb.</Text>
        </div>
        <div className="flex items-center gap-2">
          <Input size="small" type="search" placeholder="Search name, email, account" value={q} onChange={(e) => setQ(e.target.value)} />
          <CreateConsignor />
        </div>
      </div>
      {isLoading ? (
        <div className="px-6 py-8"><Text size="small">Loading…</Text></div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Account</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>On floor</Table.HeaderCell>
              <Table.HeaderCell>Sold</Table.HeaderCell>
              <Table.HeaderCell>Pickup</Table.HeaderCell>
              <Table.HeaderCell>Unbatched earnings</Table.HeaderCell>
              <Table.HeaderCell>Online</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(data?.consignors ?? []).map((c) => (
              <Table.Row key={c.id} className="cursor-pointer">
                <Table.Cell>
                  <Link to={`/consignors/${c.id}`} className="txt-compact-small-plus hover:underline">{c.account_number}</Link>
                </Table.Cell>
                <Table.Cell>
                  <Link to={`/consignors/${c.id}`} className="block">
                    <div>{c.first_name} {c.last_name}</div>
                    <Text size="xsmall" className="text-ui-fg-subtle">{c.email}</Text>
                  </Link>
                </Table.Cell>
                <Table.Cell>{c.active_count}</Table.Cell>
                <Table.Cell>{c.sold_count}</Table.Cell>
                <Table.Cell>{c.awaiting_pickup_count ? <Badge color="orange" size="2xsmall">{c.awaiting_pickup_count}</Badge> : "—"}</Table.Cell>
                <Table.Cell>{money(c.unpaid_earnings)}</Table.Cell>
                <Table.Cell>{c.has_account ? <Badge color="green" size="2xsmall">Active</Badge> : <Text size="xsmall" className="text-ui-fg-muted">Not invited</Text>}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Consignors",
  icon: Users,
  rank: 2,
})

export default ConsignorsPage
