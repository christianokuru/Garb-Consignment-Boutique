import { Button, DropdownMenu, IconButton, Table, Text, toast, usePrompt } from "@medusajs/ui"
import { EllipsisHorizontal } from "@medusajs/icons"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "../lib/sdk"
import { date, daysUntil, money } from "../lib/format"
import { StatusBadge } from "./status-badge"

export type AdminItem = {
  id: string
  item_code: string
  title: string
  status: string
  received_at: string
  expires_at: string
  pickup_deadline: string | null
  list_price: number
  sale_price: number | null
  consignor_share: number | null
  sold_at: string | null
  product: { id: string; thumbnail: string | null; status: string } | null
  consignor?: { id: string; first_name: string; last_name: string; account_number: string }
}

export const ItemTable = ({ items, showConsignor = true, empty }: { items: AdminItem[]; showConsignor?: boolean; empty: string }) => {
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const action = useMutation({
    mutationFn: (v: { id: string; action: string; days?: number }) =>
      api(`/admin/consignment-items/${v.id}/actions`, { method: "POST", body: { action: v.action, days: v.days } }),
    onSuccess: () => {
      toast.success("Item updated")
      queryClient.invalidateQueries()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const run = async (id: string, act: string, label: string, days?: number) => {
    const ok = await prompt({ title: `${label}?`, description: "This updates the item and its product listing.", confirmText: label })
    if (ok) {
      action.mutate({ id, action: act, days })
    }
  }

  if (!items.length) {
    return (
      <div className="px-6 py-8">
        <Text size="small" className="text-ui-fg-subtle">{empty}</Text>
      </div>
    )
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Item</Table.HeaderCell>
          {showConsignor && <Table.HeaderCell>Seller</Table.HeaderCell>}
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell>Price</Table.HeaderCell>
          <Table.HeaderCell>Dates</Table.HeaderCell>
          <Table.HeaderCell className="w-10" />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => {
          const left = daysUntil(item.expires_at)
          return (
            <Table.Row key={item.id}>
              <Table.Cell>
                <div className="flex items-center gap-3 py-2">
                  <div className="bg-ui-bg-subtle h-10 w-8 shrink-0 overflow-hidden rounded">
                    {item.product?.thumbnail && <img src={item.product.thumbnail} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    {item.product ? (
                      <Link to={`/products/${item.product.id}`} className="txt-compact-small-plus hover:underline">
                        {item.title}
                      </Link>
                    ) : (
                      <Text size="small" weight="plus">{item.title}</Text>
                    )}
                    <Text size="xsmall" className="text-ui-fg-subtle">#{item.item_code}</Text>
                  </div>
                </div>
              </Table.Cell>
              {showConsignor && (
                <Table.Cell>
                  {item.consignor ? (
                    <Link to={`/consignors/${item.consignor.id}`} className="hover:underline">
                      {item.consignor.first_name} {item.consignor.last_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Table.Cell>
              )}
              <Table.Cell>
                <StatusBadge status={item.status} />
              </Table.Cell>
              <Table.Cell>
                {item.status === "sold" ? (
                  <div>
                    <Text size="small">{money(item.sale_price)}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">Seller {money(item.consignor_share)}</Text>
                  </div>
                ) : (
                  money(item.list_price)
                )}
              </Table.Cell>
              <Table.Cell>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {item.status === "sold"
                    ? `Sold ${date(item.sold_at)}`
                    : item.status === "expired"
                      ? `Pickup by ${date(item.pickup_deadline)}`
                      : item.status === "active"
                        ? `${left >= 0 ? `${left} days left` : "Overdue"} · ends ${date(item.expires_at)}`
                        : `In ${date(item.received_at)}`}
                </Text>
              </Table.Cell>
              <Table.Cell>
                {item.status !== "sold" && (
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <IconButton size="small" variant="transparent">
                        <EllipsisHorizontal />
                      </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      {item.status === "active" && (
                        <DropdownMenu.Item onClick={() => run(item.id, "extend", "Extend by 30 days", 30)}>Extend 30 days</DropdownMenu.Item>
                      )}
                      {item.status !== "active" && (
                        <DropdownMenu.Item onClick={() => run(item.id, "relist", "Put back on the floor for 30 days", 30)}>Relist for 30 days</DropdownMenu.Item>
                      )}
                      {item.status !== "returned" && (
                        <DropdownMenu.Item onClick={() => run(item.id, "returned", "Mark as picked up by seller")}>Picked up by seller</DropdownMenu.Item>
                      )}
                      {item.status === "active" && (
                        <DropdownMenu.Item onClick={() => run(item.id, "withdrawn", "Withdraw from sale")}>Withdraw from sale</DropdownMenu.Item>
                      )}
                      {item.status === "expired" && (
                        <DropdownMenu.Item onClick={() => run(item.id, "forfeited", "Mark as Garb property")}>Mark as Garb property</DropdownMenu.Item>
                      )}
                    </DropdownMenu.Content>
                  </DropdownMenu>
                )}
              </Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table>
  )
}

export const LoadingRow = () => (
  <div className="px-6 py-8">
    <Button variant="transparent" isLoading size="small">Loading</Button>
  </div>
)
