import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { upsertDesignerWorkflow } from "../../../workflows/garb-admin"

/** GET /admin/designers?q= */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const q = (req.query.q as string | undefined)?.trim().toLowerCase()
  const { data } = await query.graph({
    entity: "designer",
    fields: ["id", "name", "handle", "description", "is_featured", "products.id"],
  })
  const designers = (data as any[])
    .filter((d) => !q || d.name.toLowerCase().includes(q))
    .map(({ products = [], ...d }) => ({ ...d, product_count: products.length }))
    .sort((a, b) => a.name.localeCompare(b.name))
  res.json({ designers, count: designers.length })
}

/** POST /admin/designers */
export const POST = async (req: AuthenticatedMedusaRequest<any>, res: MedusaResponse) => {
  const { result } = await upsertDesignerWorkflow(req.scope).run({ input: req.validatedBody })
  res.status(201).json({ designer: result })
}
