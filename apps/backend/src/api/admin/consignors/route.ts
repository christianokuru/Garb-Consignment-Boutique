import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createConsignorWorkflow, ConsignorInput } from "../../../workflows/garb-admin"
import { roundMoney } from "../../../lib/garb"

/** GET /admin/consignors?q= */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const q = (req.query.q as string | undefined)?.trim().toLowerCase()
  const { data } = await query.graph({
    entity: "consignor",
    fields: [
      "id",
      "account_number",
      "first_name",
      "last_name",
      "email",
      "phone",
      "split_rate",
      "has_account",
      "created_at",
      "items.status",
      "items.consignor_share",
      "items.payout_id",
    ],
  })
  const consignors = (data as any[])
    .filter((c) =>
      !q ||
      [c.first_name, c.last_name, c.email, c.account_number, `${c.first_name} ${c.last_name}`]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    )
    .map(({ items = [], ...c }) => ({
      ...c,
      active_count: items.filter((i: any) => i.status === "active").length,
      sold_count: items.filter((i: any) => i.status === "sold").length,
      awaiting_pickup_count: items.filter((i: any) => i.status === "expired").length,
      unpaid_earnings: roundMoney(
        items.filter((i: any) => i.status === "sold" && !i.payout_id).reduce((s: number, i: any) => s + Number(i.consignor_share ?? 0), 0)
      ),
    }))
    .sort((a, b) => a.last_name.localeCompare(b.last_name))
  res.json({ consignors, count: consignors.length })
}

/** POST /admin/consignors */
export const POST = async (req: AuthenticatedMedusaRequest<ConsignorInput>, res: MedusaResponse) => {
  const { result } = await createConsignorWorkflow(req.scope).run({ input: req.validatedBody })
  res.status(201).json({ consignor: result })
}
