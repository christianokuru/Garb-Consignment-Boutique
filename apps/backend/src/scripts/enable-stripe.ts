import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Turns on card payments for the Canada region once STRIPE_API_KEY is set:
 *   npx medusa exec ./src/scripts/enable-stripe.ts
 * (You can also do this in Admin > Settings > Regions > Canada.)
 */
export default async function enableStripe({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const payment = container.resolve(Modules.PAYMENT)

  const providers = await payment.listPaymentProviders({ id: "pp_stripe_stripe" })
  if (!providers.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Stripe isn't registered. Set STRIPE_API_KEY in apps/backend/.env and restart Medusa first."
    )
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
    filters: { currency_code: "cad" },
  })
  for (const region of regions as any[]) {
    const current = (region.payment_providers ?? []).map((p: any) => p.id)
    if (current.includes("pp_stripe_stripe")) {
      logger.info(`[garb] Stripe already enabled for ${region.name}`)
      continue
    }
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: region.id }, update: { payment_providers: [...current, "pp_stripe_stripe"] } },
    })
    logger.info(`[garb] Enabled Stripe card payments for ${region.name}`)
  }
}
