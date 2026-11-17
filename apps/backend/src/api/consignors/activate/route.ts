import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { activateConsignorAccountWorkflow } from "../../../workflows/consignment"

/**
 * POST /consignors/activate
 * Called with the registration token from /auth/consignor/emailpass/register.
 */
export const POST = async (req: AuthenticatedMedusaRequest<{ token: string }>, res: MedusaResponse) => {
  if (req.auth_context?.actor_id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "This login is already connected to a seller account.")
  }
  const { result } = await activateConsignorAccountWorkflow(req.scope).run({
    input: { token: req.validatedBody.token, auth_identity_id: req.auth_context.auth_identity_id },
  })
  res.json({ consignor: { id: result.id, email: result.email, first_name: result.first_name } })
}
