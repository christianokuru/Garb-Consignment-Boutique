import { MedusaService } from "@medusajs/framework/utils"
import AppointmentRequest from "./models/appointment-request"

class AppointmentModuleService extends MedusaService({
  AppointmentRequest,
}) {}

export default AppointmentModuleService
