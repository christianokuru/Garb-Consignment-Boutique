import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateProductGarbDetailsWorkflow, ProductGarbDetailsInput } from "../../../../../workflows/garb-admin"

async function load(req: AuthenticatedMedusaRequest) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "metadata",
      "designer.id",
      "designer.name",
      "consignment_item.*",
      "consignment_item.consignor.id",
      "consignment_item.consignor.first_name",
      "consignment_item.consignor.last_name",
      "consignment_item.consignor.account_number",
    ],
    filters: { id: req.params.id },
  })
  const product = data[0] as any
  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }
  return {
    product_id: product.id,
    metadata: product.metadata ?? {},
    designer: product.designer ?? null,
    consignment_item: product.consignment_item
      ? {
          ...product.consignment_item,
          list_price: Number(product.consignment_item.list_price),
          sale_price: product.consignment_item.sale_price == null ? null : Number(product.consignment_item.sale_price),
          consignor_share:
            product.consignment_item.consignor_share == null ? null : Number(product.consignment_item.consignor_share),
        }
      : null,
  }
}

/** GET /admin/products/:id/garb: designer, consignor and Garb details for the product widget. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  res.json({ garb: await load(req) })
}

/** POST /admin/products/:id/garb */
export const POST = async (req: AuthenticatedMedusaRequest<Omit<ProductGarbDetailsInput, "product_id">>, res: MedusaResponse) => {
  await updateProductGarbDetailsWorkflow(req.scope).run({
    input: { product_id: req.params.id, ...req.validatedBody },
  })
  res.json({ garb: await load(req) })
}
