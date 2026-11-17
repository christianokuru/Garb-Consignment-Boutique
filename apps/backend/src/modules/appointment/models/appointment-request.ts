import { model } from "@medusajs/framework/utils"

const AppointmentRequest = model.define("appointment_request", {
  id: model.id({ prefix: "appt" }).primaryKey(),
  name: model.text().searchable(),
  email: model.text().searchable(),
  phone: model.text(),
  appointment_type: model.enum(["in_store", "in_house"]).default("in_store"),
  item_count: model.number(),
  categories: model.json().nullable(),
  brands: model.text().nullable(),
  preferred_date: model.dateTime().nullable(),
  preferred_time: model.text().nullable(),
  notes: model.text().nullable(),
  status: model.enum(["new", "confirmed", "completed", "cancelled"]).default("new"),
  confirmed_for: model.dateTime().nullable(),
  staff_notes: model.text().nullable(),
})

export default AppointmentRequest
