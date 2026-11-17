import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Input, Label, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../lib/sdk"
import { date, daysUntil, money } from "../lib/format"
import { StatusBadge } from "../components/status-badge"

type Garb = {
  metadata: Record<string, any>
  designer: { id: string; name: string } | null
  consignment_item: {
    id: string
    status: string
    received_at: string
    display_days: number
    expires_at: string
    sale_price: number | null
    consignor_share: number | null
    sold_at: string | null
    consignor: { id: string; first_name: string; last_name: string; account_number: string }
  } | null
}

const CONDITIONS = ["New with tags", "Flawless", "Mint", "Pristine", "Excellent", "Very good", "Good"]
const NONE = "__none"

const toLines = (o: Record<string, string> | undefined) =>
  Object.entries(o ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")

const fromLines = (s: string) =>
  Object.fromEntries(
    s
      .split("\n")
      .map((l) => l.split(":"))
      .filter((p) => p.length >= 2 && p[0].trim())
      .map(([k, ...v]) => [k.trim(), v.join(":").trim()])
  )

const ProductGarbDetails = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const key = ["garb-product", product.id]
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api<{ garb: Garb }>(`/admin/products/${product.id}/garb`) })
  const designers = useQuery({ queryKey: ["garb-designers"], queryFn: () => api<{ designers: { id: string; name: string }[] }>("/admin/designers") })
  const consignors = useQuery({
    queryKey: ["garb-consignors", ""],
    queryFn: () => api<{ consignors: { id: string; first_name: string; last_name: string; account_number: string }[] }>("/admin/consignors"),
  })

  const g = data?.garb
  const initial = useMemo(
    () => ({
      designer_id: g?.designer?.id ?? NONE,
      consignor_id: g?.consignment_item?.consignor.id ?? NONE,
      received_at: g?.consignment_item?.received_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      display_days: String(g?.consignment_item?.display_days ?? ""),
      gender: g?.metadata.gender ?? "women",
      size: g?.metadata.size ?? "",
      condition: g?.metadata.condition ?? "Mint",
      colour: g?.metadata.colour ?? "",
      retail_price: g?.metadata.retail_price ? String(g.metadata.retail_price) : "",
      item_code: g?.metadata.item_code ?? product.variants?.[0]?.sku?.replace(/^GARB-/, "") ?? "",
      measurements: toLines(g?.metadata.measurements),
      details: toLines(g?.metadata.details),
    }),
    [g, product.variants]
  )
  const [form, setForm] = useState(initial)
  useEffect(() => setForm(initial), [initial])

  const save = useMutation({
    mutationFn: () =>
      api<{ garb: Garb }>(`/admin/products/${product.id}/garb`, {
        method: "POST",
        body: {
          designer_id: form.designer_id === NONE ? null : form.designer_id,
          consignor_id: form.consignor_id === NONE ? null : form.consignor_id,
          received_at: form.consignor_id === NONE ? null : new Date(form.received_at).toISOString(),
          display_days: form.display_days ? Number(form.display_days) : null,
          metadata: {
            ...(g?.metadata ?? {}),
            gender: form.gender,
            size: form.size,
            condition: form.condition,
            colour: form.colour,
            item_code: form.item_code,
            retail_price: form.retail_price ? Number(form.retail_price) : null,
            measurements: fromLines(form.measurements),
            details: fromLines(form.details),
          },
        },
      }),
    onSuccess: () => {
      toast.success("Garb details saved")
      queryClient.invalidateQueries({ queryKey: key })
      queryClient.invalidateQueries({ queryKey: ["product"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) {
    return <Container className="px-6 py-4"><Text size="small">Loading Garb details…</Text></Container>
  }
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const item = g?.consignment_item

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Garb details</Heading>
        {item && <StatusBadge status={item.status} />}
      </div>
      {item && (
        <div className="flex flex-col gap-1 px-6 py-3">
          <Text size="small">
            Consigned by{" "}
            <Link className="text-ui-fg-interactive" to={`/consignors/${item.consignor.id}`}>
              {item.consignor.first_name} {item.consignor.last_name}
            </Link>{" "}
            ({item.consignor.account_number})
          </Text>
          <Text size="xsmall" className="text-ui-fg-subtle">
            {item.status === "sold"
              ? `Sold ${date(item.sold_at)} for ${money(item.sale_price)} · seller earns ${money(item.consignor_share)}`
              : `In ${date(item.received_at)} · on display until ${date(item.expires_at)} (${daysUntil(item.expires_at)} days)`}
          </Text>
        </div>
      )}
      <form
        className="flex flex-col gap-3 px-6 py-4"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <div className="flex flex-col gap-1">
          <Label size="small">Designer</Label>
          <Select value={form.designer_id} onValueChange={(v) => setForm((f) => ({ ...f, designer_id: v }))}>
            <Select.Trigger><Select.Value placeholder="Choose designer" /></Select.Trigger>
            <Select.Content>
              <Select.Item value={NONE}>No designer</Select.Item>
              {(designers.data?.designers ?? []).map((d) => (
                <Select.Item key={d.id} value={d.id}>{d.name}</Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label size="small">Consignor</Label>
          <Select value={form.consignor_id} onValueChange={(v) => setForm((f) => ({ ...f, consignor_id: v }))}>
            <Select.Trigger><Select.Value placeholder="Choose consignor" /></Select.Trigger>
            <Select.Content>
              <Select.Item value={NONE}>Owned by Garb</Select.Item>
              {(consignors.data?.consignors ?? []).map((c) => (
                <Select.Item key={c.id} value={c.id}>{c.first_name} {c.last_name} · {c.account_number}</Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        {form.consignor_id !== NONE && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1"><Label size="small">Received</Label><Input size="small" type="date" value={form.received_at} onChange={set("received_at")} /></div>
            <div className="flex flex-col gap-1"><Label size="small">Display days</Label><Input size="small" type="number" placeholder="90 or 180" value={form.display_days} onChange={set("display_days")} /></div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label size="small">Department</Label>
            <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="women">Women</Select.Item>
                <Select.Item value="men">Men</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div className="flex flex-col gap-1"><Label size="small">Item code</Label><Input size="small" value={form.item_code} onChange={set("item_code")} /></div>
          <div className="flex flex-col gap-1"><Label size="small">Size</Label><Input size="small" value={form.size} onChange={set("size")} /></div>
          <div className="flex flex-col gap-1">
            <Label size="small">Condition</Label>
            <Select value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v }))}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                {CONDITIONS.map((c) => <Select.Item key={c} value={c}>{c}</Select.Item>)}
              </Select.Content>
            </Select>
          </div>
          <div className="flex flex-col gap-1"><Label size="small">Colour</Label><Input size="small" value={form.colour} onChange={set("colour")} /></div>
          <div className="flex flex-col gap-1"><Label size="small">Original retail (CAD)</Label><Input size="small" type="number" min={0} value={form.retail_price} onChange={set("retail_price")} /></div>
        </div>
        <div className="flex flex-col gap-1">
          <Label size="small">Measurements</Label>
          <Textarea rows={4} placeholder={"Chest: 20 in (51 cm)\nLength: 28 in (71 cm)"} value={form.measurements} onChange={set("measurements")} />
        </div>
        <div className="flex flex-col gap-1">
          <Label size="small">Other details</Label>
          <Textarea rows={3} placeholder={"Composition: 100% Wool\nOrigin: Italy"} value={form.details} onChange={set("details")} />
          <Text size="xsmall" className="text-ui-fg-subtle">One per line, as “Label: value”.</Text>
        </div>
        <Button size="small" type="submit" isLoading={save.isPending}>Save</Button>
      </form>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side",
})

export default ProductGarbDetails
