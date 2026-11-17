import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles } from "@medusajs/icons"
import { Button, Container, Heading, Input, Switch, Table, Text, toast, usePrompt } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "../../lib/sdk"

type Designer = { id: string; name: string; handle: string; is_featured: boolean; product_count: number }

const DesignersPage = () => {
  const [q, setQ] = useState("")
  const [name, setName] = useState("")
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const { data, isLoading } = useQuery({
    queryKey: ["garb-designers"],
    queryFn: () => api<{ designers: Designer[] }>("/admin/designers"),
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["garb-designers"] })
  const create = useMutation({
    mutationFn: () => api("/admin/designers", { method: "POST", body: { name } }),
    onSuccess: () => {
      toast.success(`${name} added`)
      setName("")
      refresh()
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: (d: { id: string; is_featured: boolean }) => api(`/admin/designers/${d.id}`, { method: "POST", body: { is_featured: d.is_featured } }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/designers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Designer removed")
      refresh()
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const list = (data?.designers ?? []).filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading level="h1">Designers</Heading>
          <Text size="small" className="text-ui-fg-subtle">Labels shown on the site. Featured designers appear on the home page and in the menu.</Text>
        </div>
        <Input size="small" type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <form
        className="flex gap-2 px-6 py-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) {
            create.mutate()
          }
        }}
      >
        <Input size="small" placeholder="New designer name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button size="small" variant="secondary" type="submit" isLoading={create.isPending}>Add</Button>
      </form>
      {isLoading ? (
        <div className="px-6 py-8"><Text size="small">Loading…</Text></div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Products</Table.HeaderCell>
              <Table.HeaderCell>Featured</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {list.map((d) => (
              <Table.Row key={d.id}>
                <Table.Cell>
                  <div>{d.name}</div>
                  <Text size="xsmall" className="text-ui-fg-subtle">/designers/{d.handle}</Text>
                </Table.Cell>
                <Table.Cell>{d.product_count}</Table.Cell>
                <Table.Cell>
                  <Switch checked={d.is_featured} onCheckedChange={(v) => update.mutate({ id: d.id, is_featured: v })} />
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Button
                    size="small"
                    variant="transparent"
                    disabled={d.product_count > 0}
                    onClick={async () => {
                      if (await prompt({ title: `Remove ${d.name}?`, description: "Only designers without products can be removed." })) {
                        remove.mutate(d.id)
                      }
                    }}
                  >
                    Remove
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Designers",
  icon: Sparkles,
  rank: 5,
})

export default DesignersPage
