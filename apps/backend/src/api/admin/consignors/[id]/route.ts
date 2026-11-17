import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateConsignorWorkflow, ConsignorInput } from "../../../../workflows/garb-admin"
import { publicItem } from "../../../consignors/helpers"

/** GET /admin/consignors/:id */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "consignor",
    fields: [
      "*",
      "items.*",
      "items.product.id",
      "items.product.handle",
      "items.product.status",
      "items.product.thumbnail",
      "items.product.variants.sku",
      "payouts.*",
    ],
    filters: { id: req.params.id },
  })
  const consignor = data[0] as any
  if (!consignor) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Consignor not found")
  }
  const { invite_token_hash, items = [], payouts = [], ...rest } = consignor
  res.json({
    consignor: {
      ...rest,
      invite_pending: !!invite_token_hash && !!rest.invite_expires_at && new Date(rest.invite_expires_at) > new Date(),
      items: items.map(publicItem),
      payouts: payouts
        .map((p: any) => ({ ...p, amount: Number(p.amount) }))
        .sort((a: any, b: any) => b.period.localeCompare(a.period)),
    },
  })
}

/** POST /admin/consignors/:id */
export const POST = async (req: AuthenticatedMedusaRequest<Partial<ConsignorInput>>, res: MedusaResponse) => {
  const { result } = await updateConsignorWorkflow(req.scope).run({ input: { id: req.params.id, ...req.validatedBody } })
  const { invite_token_hash: _hash, ...consignor } = result as any
  res.json({ consignor })
}
