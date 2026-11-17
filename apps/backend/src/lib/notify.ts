import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export const STORE_EMAIL = process.env.GARB_STORE_EMAIL || "consign@garb.ca"
export const ETRANSFER_EMAIL = process.env.GARB_ETRANSFER_EMAIL || "consign@garb.ca"
export const STOREFRONT_URL = (process.env.STOREFRONT_URL || "http://localhost:8000").replace(/\/$/, "")

export type EmailMessage = {
  to: string
  template: string
  subject: string
  text: string
  idempotency_key?: string
  data?: Record<string, unknown>
}

/**
 * Sends an email through the Notification Module. In development the local
 * provider only logs it. Failures are logged and never break the caller.
 */
export async function sendEmail(container: MedusaContainer, message: EmailMessage) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const notifications = container.resolve(Modules.NOTIFICATION)
    await notifications.createNotifications({
      to: message.to,
      channel: "email",
      template: message.template,
      idempotency_key: message.idempotency_key,
      data: { subject: message.subject, text: message.text, ...(message.data ?? {}) },
    })
  } catch (e) {
    logger.warn(`[garb] Could not send "${message.template}" email to ${message.to}: ${(e as Error).message}`)
  }
}

export function money(amount: number | string | null | undefined) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(amount ?? 0))
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) {
    return ""
  }
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "America/Toronto" }).format(new Date(date))
}
