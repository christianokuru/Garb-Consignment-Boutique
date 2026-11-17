import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { publicItem } from "../../helpers"

/** GET /consignors/me/items?status=active|sold|expired|... */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const status = req.query.status as string | undefined
  const { data } = await query.graph({
    entity: "consignment_item",
    fields: ["*", "product.id", "product.handle", "product.status", "product.thumbnail", "product.variants.sku"],
    filters: {
      consignor_id: req.auth_context.actor_id,
      ...(status ? { status: status.split(",") as any } : {}),
    },
  })
  const items = (data as any[])
    .map(publicItem)
    .sort((a, b) => new Date(b.sold_at ?? b.received_at).getTime() - new Date(a.sold_at ?? a.received_at).getTime())
  res.json({ items, count: items.length })
}
