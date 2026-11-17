import { ExecArgs } from "@medusajs/framework/types"
import consignmentExpiryJob from "../jobs/consignment-expiry"
import cancelUnpaidOrdersJob from "../jobs/cancel-unpaid-orders"

/**
 * Runs the daily housekeeping jobs on demand:
 *   npx medusa exec ./src/scripts/run-garb-jobs.ts
 */
export default async function runGarbJobs({ container }: ExecArgs) {
  await consignmentExpiryJob(container)
  await cancelUnpaidOrdersJob(container)
}
