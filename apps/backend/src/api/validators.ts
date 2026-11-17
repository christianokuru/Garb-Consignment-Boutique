import { z } from "@medusajs/framework/zod"

const optionalText = z.string().trim().max(2000).optional().nullable()

export const StoreCreateAppointment = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30),
  appointment_type: z.enum(["in_store", "in_house"]).default("in_store"),
  item_count: z.coerce.number().int().min(1).max(500),
  categories: z.array(z.string().max(60)).max(20).optional(),
  brands: optionalText,
  preferred_date: z.string().optional().nullable(),
  preferred_time: z.string().max(40).optional().nullable(),
  notes: optionalText,
  // Honeypot: real people leave this empty.
  company: z.string().max(0).optional(),
})
export type StoreCreateAppointmentType = z.infer<typeof StoreCreateAppointment>

export const ConsignorActivate = z.object({ token: z.string().min(10) })

export const ConsignorUpdateMe = z.object({ phone: z.string().trim().min(7).max(30).optional() })

export const AdminCreateConsignor = z.object({
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().nullable(),
  split_rate: z.coerce.number().min(0).max(100).optional(),
  notes: optionalText,
})
export const AdminUpdateConsignor = AdminCreateConsignor.partial()

export const AdminUpsertDesigner = z.object({
  name: z.string().trim().min(1),
  handle: z.string().trim().optional(),
  description: optionalText,
  is_featured: z.boolean().optional(),
})
export const AdminUpdateDesigner = AdminUpsertDesigner.partial()

export const AdminProductGarb = z.object({
  designer_id: z.string().nullable().optional(),
  consignor_id: z.string().nullable().optional(),
  received_at: z.string().nullable().optional(),
  display_days: z.coerce.number().int().min(1).max(730).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const AdminItemAction = z.object({
  action: z.enum(["extend", "returned", "withdrawn", "forfeited", "relist"]),
  days: z.coerce.number().int().min(1).max(365).optional(),
})

export const AdminGeneratePayouts = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export const AdminMarkPayoutPaid = z.object({
  method: z.string().trim().max(60).optional(),
  note: optionalText,
})

export const AdminUpdateAppointment = z.object({
  status: z.enum(["new", "confirmed", "completed", "cancelled"]).optional(),
  confirmed_for: z.string().nullable().optional(),
  staff_notes: optionalText,
})
