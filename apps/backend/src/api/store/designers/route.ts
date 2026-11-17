import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/designers
 * Designers with at least one piece for sale, with counts per department.
 * Query: `featured=true`, `gender=women|men`.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const gender = req.query.gender as string | undefined
  const featured = req.query.featured === "true"

  const { data } = await query.graph({
    entity: "designer",
    fields: ["id", "name", "handle", "description", "is_featured", "products.id", "products.status", "products.metadata"],
    filters: featured ? { is_featured: true } : {},
  })

  const designers = (data as any[])
    .map((d) => {
      const live = (d.products ?? []).filter((p: any) => p?.status === "published")
      const women = live.filter((p: any) => p.metadata?.gender === "women").length
      const men = live.filter((p: any) => p.metadata?.gender === "men").length
      return {
        id: d.id,
        name: d.name,
        handle: d.handle,
        description: d.description,
        is_featured: d.is_featured,
        product_count: gender === "women" ? women : gender === "men" ? men : live.length,
        counts: { women, men },
      }
    })
    .filter((d) => d.product_count > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))

  res.json({ designers, count: designers.length })
}
