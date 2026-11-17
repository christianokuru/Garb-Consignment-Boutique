import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CalendarSolid } from "@medusajs/icons"
import { Badge, Button, Container, Drawer, Heading, Input, Label, Select, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "../../lib/sdk"
import { date, dateTime } from "../../lib/format"
import { StatusBadge } from "../../components/status-badge"

type Appointment = {
  id: string
  name: string
  email: string
  phone: string
  appointment_type: "in_store" | "in_house"
  item_count: number
  categories: string[] | null
  brands: string | null
  preferred_date: string | null
  preferred_time: string | null
  notes: string | null
  status: string
  confirmed_for: string | null
  staff_notes: string | null
  created_at: string
}

const toLocalInput = (d: string | null) => {
  if (!d) {
    return ""
  }
  const x = new Date(d)
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 16)
}

const Manage = ({ a }: { a: Appointment }) => {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(a.status)
  const [when, setWhen] = useState(toLocalInput(a.confirmed_for))
  const [notes, setNotes] = useState(a.staff_notes ?? "")
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: () =>
      api(`/admin/appointments/${a.id}`, {
        method: "POST",
        body: { status, confirmed_for: when ? new Date(when).toISOString() : null, staff_notes: notes || null },
      }),
    onSuccess: () => {
      toast.success(status === "confirmed" ? "Confirmed. The client has been emailed." : "Saved")
      queryClient.invalidateQueries({ queryKey: ["garb-appointments"] })
      setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button size="small" variant="secondary">Manage</Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{a.name}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text size="small"><a className="text-ui-fg-interactive" href={`mailto:${a.email}`}>{a.email}</a> · <a className="text-ui-fg-interactive" href={`tel:${a.phone}`}>{a.phone}</a></Text>
            <Text size="small">{a.appointment_type === "in_house" ? "In-home visit" : "In-store"} · {a.item_count} items</Text>
            {a.categories?.length ? <Text size="small">Categories: {a.categories.join(", ")}</Text> : null}
            {a.brands && <Text size="small">Brands: {a.brands}</Text>}
            <Text size="small">Prefers: {[date(a.preferred_date), a.preferred_time].filter((x) => x && x !== "—").join(", ") || "Any time"}</Text>
            {a.notes && <Text size="small" className="text-ui-fg-subtle whitespace-pre-line">“{a.notes}”</Text>}
          </div>
          <div className="flex flex-col gap-1">
            <Label size="small">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                {["new", "confirmed", "completed", "cancelled"].map((s) => (
                  <Select.Item key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label size="small">Appointment time</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            <Text size="xsmall" className="text-ui-fg-subtle">Setting the status to Confirmed with a time emails the client.</Text>
          </div>
          <div className="flex flex-col gap-1">
            <Label size="small">Staff notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild><Button size="small" variant="secondary">Cancel</Button></Drawer.Close>
          <Button size="small" onClick={() => save.mutate()} isLoading={save.isPending}>Save</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

const AppointmentsPage = () => {
  const [filter, setFilter] = useState("new,confirmed")
  const { data, isLoading } = useQuery({
    queryKey: ["garb-appointments", filter],
    queryFn: () => api<{ appointments: Appointment[] }>("/admin/appointments", { query: filter ? { status: filter } : {} }),
  })
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Appointments</Heading>
        <Text size="small" className="text-ui-fg-subtle">Consignment requests from the website booking form.</Text>
      </div>
      <div className="flex gap-2 px-6 py-3">
        {[
          ["new,confirmed", "Open"],
          ["completed,cancelled", "Closed"],
          ["", "All"],
        ].map(([v, l]) => (
          <Button key={l} size="small" variant={filter === v ? "primary" : "transparent"} onClick={() => setFilter(v)}>{l}</Button>
        ))}
      </div>
      {isLoading ? (
        <div className="px-6 py-8"><Text size="small">Loading…</Text></div>
      ) : data?.appointments.length ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Client</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Items</Table.HeaderCell>
              <Table.HeaderCell>When</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.appointments.map((a) => (
              <Table.Row key={a.id}>
                <Table.Cell>
                  <div>{a.name}</div>
                  <Text size="xsmall" className="text-ui-fg-subtle">Requested {date(a.created_at)}</Text>
                </Table.Cell>
                <Table.Cell>{a.appointment_type === "in_house" ? <Badge size="2xsmall" color="purple">In-home</Badge> : <Badge size="2xsmall">In-store</Badge>}</Table.Cell>
                <Table.Cell>{a.item_count}</Table.Cell>
                <Table.Cell>
                  <Text size="small">{a.confirmed_for ? dateTime(a.confirmed_for) : [date(a.preferred_date), a.preferred_time].filter((x) => x && x !== "—").join(", ") || "Flexible"}</Text>
                  {!a.confirmed_for && <Text size="xsmall" className="text-ui-fg-subtle">Preferred</Text>}
                </Table.Cell>
                <Table.Cell><StatusBadge status={a.status} /></Table.Cell>
                <Table.Cell className="text-right"><Manage a={a} /></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : (
        <div className="px-6 py-8"><Text size="small" className="text-ui-fg-subtle">No appointments here.</Text></div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Appointments",
  icon: CalendarSolid,
  rank: 4,
})

export default AppointmentsPage
