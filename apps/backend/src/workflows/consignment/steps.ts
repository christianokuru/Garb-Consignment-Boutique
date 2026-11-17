import crypto from "crypto"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CONSIGNMENT_MODULE } from "../../modules/consignment"
import type ConsignmentModuleService from "../../modules/consignment/service"
import {
  addDays,
  consignorShare,
  payoutAvailableAt,
  PICKUP_WINDOW_DAYS,
  roundMoney,
} from "../../lib/garb"

type ItemSnapshot = {
  id: string
  status: string
  sale_price: number | null
  consignor_share: number | null
  sold_at: Date | null
  order_id: string | null
  pickup_deadline: Date | null
  expires_at: Date
}

function snapshot(item: any): ItemSnapshot {
  return {
    id: item.id,
    status: item.status,
    sale_price: item.sale_price == null ? null : Number(item.sale_price),
    consignor_share: item.consignor_share == null ? null : Number(item.consignor_share),
    sold_at: item.sold_at ?? null,
    order_id: item.order_id ?? null,
    pickup_deadline: item.pickup_deadline ?? null,
    expires_at: item.expires_at,
  }
}

async function restore(container: any, snapshots: ItemSnapshot[] | undefined) {
  if (!snapshots?.length) {
    return
  }
  const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
  await service.updateConsignmentItems(snapshots as any)
}

/* -------------------------------------------------------------------------- */
/* Sales                                                                      */
/* -------------------------------------------------------------------------- */

export type SaleLine = {
  consignment_item_id: string
  product_id: string
  sale_price: number
  split_rate: number
}

export const findSaleLinesStep = createStep(
  "find-sale-lines",
  async ({ order_id }: { order_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "items.product_id", "items.unit_price", "items.quantity", "items.discount_total", "items.subtotal"],
      filters: { id: order_id },
    })
    const order = orders[0]
    if (!order) {
      return new StepResponse([] as SaleLine[])
    }
    const lines = (order.items ?? []).filter((i: any) => i?.product_id)
    const productIds = lines.map((i: any) => i.product_id as string)
    if (!productIds.length) {
      return new StepResponse([] as SaleLine[])
    }
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "consignment_item.id", "consignment_item.status", "consignment_item.consignor.split_rate"],
      filters: { id: productIds },
    })
    const result: SaleLine[] = []
    for (const product of products as any[]) {
      const item = product.consignment_item
      if (!item || item.status !== "active") {
        continue
      }
      const line = lines.find((l: any) => l.product_id === product.id) as any
      const discount = Number(line.discount_total ?? 0)
      const unit = Number(line.unit_price ?? 0)
      result.push({
        consignment_item_id: item.id,
        product_id: product.id,
        sale_price: roundMoney(Math.max(0, unit - discount / Math.max(1, Number(line.quantity ?? 1)))),
        split_rate: Number(item.consignor?.split_rate ?? 50),
      })
    }
    return new StepResponse(result)
  }
)

export const markItemsSoldStep = createStep(
  "mark-items-sold",
  async ({ lines, order_id }: { lines: SaleLine[]; order_id: string }, { container }) => {
    if (!lines.length) {
      return new StepResponse([], [])
    }
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const before = await service.listConsignmentItems({ id: lines.map((l) => l.consignment_item_id) })
    const now = new Date()
    const updated = await service.updateConsignmentItems(
      lines.map((l) => ({
        id: l.consignment_item_id,
        status: "sold" as const,
        sale_price: l.sale_price,
        consignor_share: consignorShare(l.sale_price, l.split_rate),
        sold_at: now,
        order_id,
      }))
    )
    return new StepResponse(updated, before.map(snapshot))
  },
  async (snapshots, { container }) => restore(container, snapshots)
)

export const findItemsForOrderStep = createStep(
  "find-items-for-order",
  async ({ order_id }: { order_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "consignment_item",
      fields: ["id", "status", "payout_id", "expires_at", "product.id"],
      filters: { order_id, status: "sold" },
    })
    // Items already paid out are never reversed automatically.
    const items = (data as any[]).filter((i) => !i.payout_id)
    return new StepResponse(
      items.map((i) => ({ id: i.id as string, product_id: i.product?.id as string | undefined, expires_at: i.expires_at }))
    )
  }
)

export const revertItemsToActiveStep = createStep(
  "revert-items-to-active",
  async (items: { id: string }[], { container }) => {
    if (!items.length) {
      return new StepResponse([], [])
    }
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const before = await service.listConsignmentItems({ id: items.map((i) => i.id) })
    const updated = await service.updateConsignmentItems(
      items.map((i) => ({
        id: i.id,
        status: "active" as const,
        sale_price: null,
        consignor_share: null,
        sold_at: null,
        order_id: null,
      }))
    )
    return new StepResponse(updated, before.map(snapshot))
  },
  async (snapshots, { container }) => restore(container, snapshots)
)

/* -------------------------------------------------------------------------- */
/* Expiry                                                                     */
/* -------------------------------------------------------------------------- */

export const expireOverdueItemsStep = createStep(
  "expire-overdue-items",
  async ({ now }: { now: Date }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const { data } = await query.graph({
      entity: "consignment_item",
      fields: [
        "id",
        "title",
        "item_code",
        "status",
        "expires_at",
        "pickup_deadline",
        "product.id",
        "consignor.id",
        "consignor.email",
        "consignor.first_name",
      ],
      filters: { status: "active", expires_at: { $lt: now } },
    })
    const items = data as any[]
    if (!items.length) {
      return new StepResponse({ expired: [] as any[], product_ids: [] as string[] }, [])
    }
    const before = items.map(snapshot)
    const deadline = addDays(now, PICKUP_WINDOW_DAYS)
    await service.updateConsignmentItems(
      items.map((i) => ({ id: i.id, status: "expired" as const, pickup_deadline: deadline }))
    )
    return new StepResponse(
      {
        expired: items.map((i) => ({ ...i, pickup_deadline: deadline })),
        product_ids: items.map((i) => i.product?.id).filter(Boolean) as string[],
      },
      before
    )
  },
  async (snapshots, { container }) => restore(container, snapshots)
)

export const forfeitUncollectedItemsStep = createStep(
  "forfeit-uncollected-items",
  async ({ now }: { now: Date }, { container }) => {
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const items = await service.listConsignmentItems({
      status: "expired",
      pickup_deadline: { $lt: now },
    })
    if (!items.length) {
      return new StepResponse([], [])
    }
    await service.updateConsignmentItems(items.map((i) => ({ id: i.id, status: "forfeited" as const })))
    return new StepResponse(
      items.map((i) => i.id),
      items.map(snapshot)
    )
  },
  async (snapshots, { container }) => restore(container, snapshots)
)

/* -------------------------------------------------------------------------- */
/* Payouts                                                                    */
/* -------------------------------------------------------------------------- */

export const createPayoutsForPeriodStep = createStep(
  "create-payouts-for-period",
  async ({ period }: { period: string }, { container }) => {
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const [year, month] = period.split("-").map(Number)
    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 1))
    const items = await service.listConsignmentItems({
      status: "sold",
      payout_id: null,
      sold_at: { $gte: start, $lt: end },
    })
    const byConsignor = new Map<string, typeof items>()
    for (const item of items) {
      const list = byConsignor.get(item.consignor_id) ?? []
      list.push(item)
      byConsignor.set(item.consignor_id, list)
    }
    const created: any[] = []
    for (const [consignorId, list] of byConsignor) {
      const amount = roundMoney(list.reduce((sum, i) => sum + Number(i.consignor_share ?? 0), 0))
      const [existing] = await service.listPayouts({ consignor_id: consignorId, period, status: "scheduled" })
      const payout = existing
        ? await service.updatePayouts({
            id: existing.id,
            amount: roundMoney(Number(existing.amount) + amount),
            item_count: existing.item_count + list.length,
          })
        : await service.createPayouts({
            consignor_id: consignorId,
            period,
            amount,
            item_count: list.length,
            available_at: payoutAvailableAt(period),
            status: "scheduled",
          })
      await service.updateConsignmentItems(list.map((i) => ({ id: i.id, payout_id: payout.id })))
      created.push({ payout, item_ids: list.map((i) => i.id), existed: !!existing, added: amount })
    }
    return new StepResponse(
      created.map((c) => c.payout),
      created.map((c) => ({ id: c.payout.id, item_ids: c.item_ids, existed: c.existed, added: c.added, count: c.item_ids.length }))
    )
  },
  async (comp, { container }) => {
    if (!comp?.length) {
      return
    }
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    for (const c of comp) {
      await service.updateConsignmentItems(c.item_ids.map((id) => ({ id, payout_id: null })))
      if (c.existed) {
        const payout = await service.retrievePayout(c.id)
        await service.updatePayouts({
          id: c.id,
          amount: roundMoney(Number(payout.amount) - c.added),
          item_count: payout.item_count - c.count,
        })
      } else {
        await service.deletePayouts(c.id)
      }
    }
  }
)

/* -------------------------------------------------------------------------- */
/* Consignor accounts                                                         */
/* -------------------------------------------------------------------------- */

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export const createInviteTokenStep = createStep(
  "create-invite-token",
  async ({ consignor_id, ttl_days }: { consignor_id: string; ttl_days: number }, { container }) => {
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const before = await service.retrieveConsignor(consignor_id)
    const token = crypto.randomBytes(24).toString("base64url")
    const consignor = await service.updateConsignors({
      id: consignor_id,
      invite_token_hash: hashToken(token),
      invite_expires_at: addDays(new Date(), ttl_days),
    })
    return new StepResponse(
      { token, consignor },
      { id: before.id, invite_token_hash: before.invite_token_hash, invite_expires_at: before.invite_expires_at }
    )
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    await service.updateConsignors(prev)
  }
)

export const validateInviteStep = createStep(
  "validate-invite",
  async ({ token, auth_identity_id }: { token: string; auth_identity_id: string }, { container }) => {
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const [consignor] = await service.listConsignors({ invite_token_hash: hashToken(token) })
    if (!consignor || !consignor.invite_expires_at || new Date(consignor.invite_expires_at) < new Date()) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This invite link is invalid or has expired.")
    }
    const { data: identities } = await query.graph({
      entity: "auth_identity",
      fields: ["id", "app_metadata", "provider_identities.entity_id"],
      filters: { id: auth_identity_id },
    })
    const identity = identities[0] as any
    const emails = (identity?.provider_identities ?? []).map((p: any) => String(p.entity_id).toLowerCase())
    if (!emails.includes(consignor.email.toLowerCase())) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Please register with the same email address your invite was sent to."
      )
    }
    if (identity?.app_metadata?.consignor_id && identity.app_metadata.consignor_id !== consignor.id) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This login already belongs to another seller account.")
    }
    return new StepResponse(consignor)
  }
)

export const completeActivationStep = createStep(
  "complete-activation",
  async ({ consignor_id }: { consignor_id: string }, { container }) => {
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const before = await service.retrieveConsignor(consignor_id)
    const consignor = await service.updateConsignors({
      id: consignor_id,
      has_account: true,
      invite_token_hash: null,
      invite_expires_at: null,
    })
    return new StepResponse(consignor, {
      id: before.id,
      has_account: before.has_account,
      invite_token_hash: before.invite_token_hash,
      invite_expires_at: before.invite_expires_at,
    })
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    await service.updateConsignors(prev)
  }
)
