import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateAppointmentRequestWorkflow } from "../../../../workflows/garb-admin"
import { formatDate, sendEmail } from "../../../../lib/notify"

/** POST /admin/appointments/:id { status?, confirmed_for?, staff_notes? } */
export const POST = async (req: AuthenticatedMedusaRequest<any>, res: MedusaResponse) => {
  const { result } = await updateAppointmentRequestWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  if (req.validatedBody.status === "confirmed" && result.confirmed_for) {
    const time = new Intl.DateTimeFormat("en-CA", { timeStyle: "short", timeZone: "America/Toronto" }).format(
      new Date(result.confirmed_for)
    )
    await sendEmail(req.scope, {
      to: result.email,
      template: "appointment-confirmed",
      subject: "Your Garb consignment appointment is confirmed",
      text: `Hi ${result.name},\n\nYour ${result.appointment_type === "in_house" ? "in-home" : "in-store"} consignment appointment is confirmed for ${formatDate(result.confirmed_for)} at ${time}.\n\n${result.appointment_type === "in_house" ? "We'll come to the address you gave us." : "We're at 1046 Queen St W, Toronto."} Please have items freshly cleaned and on hangers or neatly folded.\n\nNeed to change it? Call 416.588.2121.`,
    })
  }
  res.json({ appointment: result })
}
