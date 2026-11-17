import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createConsignorInviteWorkflow } from "../../../../../workflows/consignment"
import { formatDate, sendEmail, STOREFRONT_URL } from "../../../../../lib/notify"

/**
 * POST /admin/consignors/:id/invite
 * Creates a fresh invite link (valid 14 days), emails it, and returns it so
 * staff can also share it by text.
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { result } = await createConsignorInviteWorkflow(req.scope).run({ input: { consignor_id: req.params.id } })
  const url = `${STOREFRONT_URL}/seller/activate?token=${encodeURIComponent(result.token)}`
  await sendEmail(req.scope, {
    to: result.consignor.email,
    template: "consignor-invite",
    subject: "Your Garb seller account",
    text: `Hi ${result.consignor.first_name},\n\nYou can now follow your consigned pieces online: see what's on the floor, what has sold, and when your payouts are ready.\n\nSet your password here (link valid until ${formatDate(result.consignor.invite_expires_at)}):\n${url}\n\nGarb Consignment Boutique`,
    data: { url },
  })
  res.json({ invite_url: url, expires_at: result.consignor.invite_expires_at })
}
