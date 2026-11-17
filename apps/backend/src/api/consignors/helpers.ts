import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function getConsignor(req: AuthenticatedMedusaRequest, fields: string[]) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "consignor",
    fields,
    filters: { id: req.auth_context.actor_id },
  })
  if (!data[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Seller account not found")
  }
  return data[0] as any
}

export function publicItem(item: any) {
  const product = item.product
  const variant = product?.variants?.[0]
  return {
    id: item.id,
    item_code: item.item_code,
    title: item.title,
    status: item.status,
    received_at: item.received_at,
    display_days: item.display_days,
    expires_at: item.expires_at,
    pickup_deadline: item.pickup_deadline,
    list_price: Number(item.list_price),
    sale_price: item.sale_price == null ? null : Number(item.sale_price),
    consignor_share: item.consignor_share == null ? null : Number(item.consignor_share),
    sold_at: item.sold_at,
    payout_id: item.payout_id ?? null,
    product: product
      ? {
          id: product.id,
          handle: product.handle,
          status: product.status,
          thumbnail: product.thumbnail,
          sku: variant?.sku ?? null,
        }
      : null,
  }
}
