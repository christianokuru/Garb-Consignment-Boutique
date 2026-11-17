import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CONSIGNMENT_MODULE } from "../../../modules/consignment"
import type ConsignmentModuleService from "../../../modules/consignment/service"
import { hashToken } from "../../../workflows/consignment/steps"

/**
 * GET /consignors/invite?token=...
 * Public: tells the activation page who the invite is for.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = String(req.query.token ?? "")
  const service: ConsignmentModuleService = req.scope.resolve(CONSIGNMENT_MODULE)
  const [consignor] = token ? await service.listConsignors({ invite_token_hash: hashToken(token) }) : []
  if (!consignor || !consignor.invite_expires_at || new Date(consignor.invite_expires_at) < new Date()) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "This invite link is invalid or has expired.")
  }
  res.json({ invite: { email: consignor.email, first_name: consignor.first_name, has_account: consignor.has_account } })
}
