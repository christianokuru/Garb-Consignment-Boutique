import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/**
 * GET /store/designers/:handle
 * The designer and the ids of their published products, newest first. The
 * storefront fetches the products themselves through /store/products so
 * prices and stock come from the usual place.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "designer",
    fields: ["id", "name", "handle", "description", "is_featured", "products.id", "products.status", "products.created_at", "products.metadata"],
    filters: { handle: req.params.handle },
  })
  const designer = data[0] as any
  if (!designer) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Designer not found")
  }
  const gender = req.query.gender as string | undefined
  const products = (designer.products ?? [])
    .filter((p: any) => p?.status === "published" && (!gender || p.metadata?.gender === gender))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  res.json({
    designer: {
      id: designer.id,
      name: designer.name,
      handle: designer.handle,
      description: designer.description,
      is_featured: designer.is_featured,
    },
    product_ids: products.map((p: any) => p.id),
  })
}
