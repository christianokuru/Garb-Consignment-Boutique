import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createAppointmentRequestWorkflow } from "../../../workflows/garb-admin"
import type { StoreCreateAppointmentType } from "../../validators"
import { formatDate, sendEmail, STORE_EMAIL } from "../../../lib/notify"

/**
 * POST /store/appointments
 * A consignment appointment request from the booking form.
 */
export const POST = async (req: MedusaRequest<StoreCreateAppointmentType>, res: MedusaResponse) => {
  const { company: _honeypot, ...input } = req.validatedBody
  const { result } = await createAppointmentRequestWorkflow(req.scope).run({ input })

  const when = [input.preferred_date ? formatDate(input.preferred_date) : null, input.preferred_time]
    .filter(Boolean)
    .join(", ")
  const kind = input.appointment_type === "in_house" ? "in-home" : "in-store"
  await sendEmail(req.scope, {
    to: result.email,
    template: "appointment-received",
    subject: "We received your consignment request",
    text: `Hi ${result.name},\n\nThanks for thinking of Garb. We received your request for an ${kind} consignment appointment${when ? ` (${when})` : ""}. We'll confirm a time by email or phone within two business days.\n\nBefore you come in: please bring items freshly cleaned, on hangers or neatly folded in a garment bag or tote (no garbage bags).\n\nGarb Consignment Boutique\n1046 Queen St W, Toronto\n416.588.2121`,
  })
  await sendEmail(req.scope, {
    to: STORE_EMAIL,
    template: "appointment-received-staff",
    subject: `New ${kind} appointment request: ${result.name} (${result.item_count} items)`,
    text: `${result.name}\n${result.email}\n${result.phone}\nItems: ${result.item_count}\nCategories: ${(input.categories ?? []).join(", ")}\nBrands: ${input.brands ?? ""}\nPreferred: ${when}\nNotes: ${input.notes ?? ""}`,
  })

  res.status(201).json({ appointment: { id: result.id, status: result.status } })
}
