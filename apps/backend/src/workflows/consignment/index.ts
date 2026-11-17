import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ProductStatus } from "@medusajs/framework/utils"
import { setAuthAppMetadataStep, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
  completeActivationStep,
  createInviteTokenStep,
  createPayoutsForPeriodStep,
  expireOverdueItemsStep,
  findItemsForOrderStep,
  findSaleLinesStep,
  forfeitUncollectedItemsStep,
  markItemsSoldStep,
  revertItemsToActiveStep,
  validateInviteStep,
} from "./steps"

/**
 * When an order is placed, every consigned piece in it is marked sold, the
 * consignor's share is recorded, and the product leaves the shop floor.
 */
export const recordConsignmentSalesWorkflow = createWorkflow(
  "record-consignment-sales",
  (input: { order_id: string }) => {
    const lines = findSaleLinesStep({ order_id: input.order_id })
    const items = markItemsSoldStep({ lines, order_id: input.order_id })
    const productIds = transform({ lines }, ({ lines }) => lines.map((l) => l.product_id))

    when({ productIds }, ({ productIds }) => productIds.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({
        input: {
          selector: { id: productIds },
          update: { status: ProductStatus.DRAFT },
        },
      })
    })

    return new WorkflowResponse(items)
  }
)

/**
 * When an order is cancelled (for example an unpaid e-transfer), its pieces go
 * back on sale.
 */
export const revertConsignmentSalesWorkflow = createWorkflow(
  "revert-consignment-sales",
  (input: { order_id: string }) => {
    const items = findItemsForOrderStep({ order_id: input.order_id })
    const reverted = revertItemsToActiveStep(items)
    const productIds = transform({ items }, ({ items }) =>
      items.map((i) => i.product_id).filter((id): id is string => !!id)
    )

    when({ productIds }, ({ productIds }) => productIds.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({
        input: {
          selector: { id: productIds },
          update: { status: ProductStatus.PUBLISHED },
        },
      })
    })

    return new WorkflowResponse(reverted)
  }
)

/**
 * Daily housekeeping: pieces past their display period come off the floor and
 * wait for pickup; pieces not collected within the pickup window become Garb's.
 */
export const processConsignmentExpiryWorkflow = createWorkflow(
  "process-consignment-expiry",
  (input: { now: Date }) => {
    const result = expireOverdueItemsStep({ now: input.now })
    const forfeited = forfeitUncollectedItemsStep({ now: input.now }).config({ name: "garb-forfeit" })
    const productIds = transform({ result }, ({ result }) => result.product_ids)

    when({ productIds }, ({ productIds }) => productIds.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({
        input: {
          selector: { id: productIds },
          update: { status: ProductStatus.DRAFT },
        },
      })
    })

    return new WorkflowResponse({ expired: result.expired, forfeited })
  }
)

/** Groups a month's sales into one payout per consignor. */
export const generatePayoutsWorkflow = createWorkflow(
  "generate-payouts",
  (input: { period: string }) => {
    const payouts = createPayoutsForPeriodStep({ period: input.period })
    return new WorkflowResponse(payouts)
  }
)

/** Creates (or refreshes) a seller's invite link. */
export const createConsignorInviteWorkflow = createWorkflow(
  "create-consignor-invite",
  (input: { consignor_id: string; ttl_days?: number }) => {
    const ttl = transform({ input }, ({ input }) => input.ttl_days ?? 14)
    const result = createInviteTokenStep({ consignor_id: input.consignor_id, ttl_days: ttl })
    return new WorkflowResponse(result)
  }
)

/** Connects a newly registered login to the consignor the invite was for. */
export const activateConsignorAccountWorkflow = createWorkflow(
  "activate-consignor-account",
  (input: { token: string; auth_identity_id: string }) => {
    const consignor = validateInviteStep(input)
    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: "consignor",
      value: consignor.id,
    })
    const updated = completeActivationStep({ consignor_id: consignor.id })
    return new WorkflowResponse(updated)
  }
)
