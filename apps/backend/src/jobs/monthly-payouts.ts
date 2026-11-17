import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generatePayoutsWorkflow } from "../workflows/consignment"
import { previousPeriod } from "../lib/garb"

/**
 * On the 5th of each month, last month's sales are grouped into payouts that
 * sellers can collect from the 15th. Running on the 5th (not the 1st) leaves
 * time for unpaid e-transfer orders from the end of the month to be settled.
 */
export default async function monthlyPayoutsJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const period = previousPeriod()
  const { result } = await generatePayoutsWorkflow(container).run({ input: { period } })
  logger.info(`[garb] Generated ${result.length} payouts for ${period}`)
}

export const config = {
  name: "garb-monthly-payouts",
  schedule: "0 8 5 * *",
}
