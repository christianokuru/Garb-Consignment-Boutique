import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { publicItem } from "../../consignors/helpers"

/** GET /admin/consignment-items?status=expired&consignor_id=... */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const status = req.query.status as string | undefined
  const consignorId = req.query.consignor_id as string | undefined
  const { data } = await query.graph({
    entity: "consignment_item",
    fields: [
      "*",
      "consignor.id",
      "consignor.first_name",
      "consignor.last_name",
      "consignor.account_number",
      "product.id",
      "product.handle",
      "product.status",
      "product.thumbnail",
      "product.variants.sku",
    ],
    filters: {
      ...(status ? { status: status.split(",") } : {}),
      ...(consignorId ? { consignor_id: consignorId } : {}),
    },
  })
  const items = (data as any[])
    .map((i) => ({ ...publicItem(i), consignor: i.consignor }))
    .sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())
  res.json({ items, count: items.length })
}
