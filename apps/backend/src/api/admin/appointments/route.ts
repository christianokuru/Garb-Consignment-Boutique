import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APPOINTMENT_MODULE } from "../../../modules/appointment"
import type AppointmentModuleService from "../../../modules/appointment/service"

/** GET /admin/appointments?status=new */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: AppointmentModuleService = req.scope.resolve(APPOINTMENT_MODULE)
  const status = req.query.status as string | undefined
  const appointments = await service.listAppointmentRequests(
    status ? { status: status.split(",") as any } : {},
    { order: { created_at: "DESC" } }
  )
  res.json({ appointments, count: appointments.length })
}
