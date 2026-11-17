import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendEmail, STOREFRONT_URL } from "../lib/notify"

type Data = { entity_id: string; token: string; actor_type: string }

export default async function passwordResetHandler({ event: { data }, container }: SubscriberArgs<Data>) {
  const path =
    data.actor_type === "consignor" ? "/seller/reset-password" : data.actor_type === "customer" ? "/account/reset-password" : null
  if (!path) {
    return
  }
  const url = `${STOREFRONT_URL}${path}?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.entity_id)}`
  await sendEmail(container, {
    to: data.entity_id,
    template: "password-reset",
    subject: "Reset your Garb password",
    text: `We received a request to reset your password. Choose a new one here (the link expires in 15 minutes):\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
    data: { url },
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
