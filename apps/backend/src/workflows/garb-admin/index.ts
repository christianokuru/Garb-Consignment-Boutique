import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { CONSIGNMENT_MODULE } from "../../modules/consignment"
import { DESIGNER_MODULE } from "../../modules/designer"
import { APPOINTMENT_MODULE } from "../../modules/appointment"
import type ConsignmentModuleService from "../../modules/consignment/service"
import type DesignerModuleService from "../../modules/designer/service"
import type AppointmentModuleService from "../../modules/appointment/service"
import { addDays, displayDaysFor, slugify } from "../../lib/garb"

/* -------------------------------------------------------------------------- */
/* Consignors                                                                 */
/* -------------------------------------------------------------------------- */

export type ConsignorInput = {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  split_rate?: number
  notes?: string | null
}

const createConsignorStep = createStep(
  "create-consignor",
  async (input: ConsignorInput, { container }) => {
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const email = input.email.trim().toLowerCase()
    const [existing] = await service.listConsignors({ email })
    if (existing) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, `A consignor with the email ${email} already exists.`)
    }
    const account_number = await service.nextAccountNumber()
    const consignor = await service.createConsignors({ ...input, email, account_number })
    return new StepResponse(consignor, consignor.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    await service.deleteConsignors(id)
  }
)

export const createConsignorWorkflow = createWorkflow("create-consignor", (input: ConsignorInput) => {
  return new WorkflowResponse(createConsignorStep(input))
})

const updateConsignorStep = createStep(
  "update-consignor",
  async (input: Partial<ConsignorInput> & { id: string }, { container }) => {
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const before = await service.retrieveConsignor(input.id)
    const data = { ...input, ...(input.email ? { email: input.email.trim().toLowerCase() } : {}) }
    const consignor = await service.updateConsignors(data)
    return new StepResponse(consignor, {
      id: before.id,
      first_name: before.first_name,
      last_name: before.last_name,
      email: before.email,
      phone: before.phone,
      split_rate: before.split_rate,
      notes: before.notes,
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

export const updateConsignorWorkflow = createWorkflow(
  "update-consignor",
  (input: Partial<ConsignorInput> & { id: string }) => {
    return new WorkflowResponse(updateConsignorStep(input))
  }
)

/* -------------------------------------------------------------------------- */
/* Designers                                                                  */
/* -------------------------------------------------------------------------- */

type DesignerComp = { mode: "update"; before: any } | { mode: "create"; id: string }

type DesignerInput = { name: string; handle?: string; description?: string | null; is_featured?: boolean }

const upsertDesignerStep = createStep(
  "upsert-designer",
  async (input: DesignerInput & { id?: string }, { container }) => {
    const service: DesignerModuleService = container.resolve(DESIGNER_MODULE)
    if (input.id) {
      const before = await service.retrieveDesigner(input.id)
      const designer = await service.updateDesigners({ ...input, id: input.id })
      return new StepResponse(designer, { mode: "update", before } as DesignerComp)
    }
    const handle = slugify(input.handle || input.name)
    const [existing] = await service.listDesigners({ handle })
    if (existing) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, `The designer "${existing.name}" already exists.`)
    }
    const designer = await service.createDesigners({ ...input, handle })
    return new StepResponse(designer, { mode: "create", id: designer.id } as DesignerComp)
  },
  async (comp, { container }) => {
    if (!comp) {
      return
    }
    const service: DesignerModuleService = container.resolve(DESIGNER_MODULE)
    if (comp.mode === "create") {
      await service.deleteDesigners(comp.id)
    } else {
      const { id, name, handle, description, is_featured } = comp.before
      await service.updateDesigners({ id, name, handle, description, is_featured })
    }
  }
)

export const upsertDesignerWorkflow = createWorkflow(
  "upsert-designer",
  (input: DesignerInput & { id?: string }) => new WorkflowResponse(upsertDesignerStep(input))
)

const deleteDesignerStep = createStep(
  "delete-designer",
  async ({ id }: { id: string }, { container }) => {
    const service: DesignerModuleService = container.resolve(DESIGNER_MODULE)
    await service.softDeleteDesigners(id)
    return new StepResponse(id, id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: DesignerModuleService = container.resolve(DESIGNER_MODULE)
    await service.restoreDesigners(id)
  }
)

export const deleteDesignerWorkflow = createWorkflow("delete-designer", (input: { id: string }) => {
  return new WorkflowResponse(deleteDesignerStep(input))
})

/* -------------------------------------------------------------------------- */
/* Product consignment details                                                */
/* -------------------------------------------------------------------------- */

export type ProductGarbDetailsInput = {
  product_id: string
  designer_id?: string | null
  consignor_id?: string | null
  received_at?: string | null
  display_days?: number | null
  metadata?: Record<string, unknown>
}

const setProductDesignerStep = createStep(
  "set-product-designer",
  async ({ product_id, designer_id }: { product_id: string; designer_id?: string | null }, { container }) => {
    if (designer_id === undefined) {
      return new StepResponse(null, null)
    }
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "product", fields: ["id", "designer.id"], filters: { id: product_id } })
    const previous = (data[0] as any)?.designer?.id ?? null
    if (previous === designer_id) {
      return new StepResponse(previous, null)
    }
    if (previous) {
      await link.dismiss({ [Modules.PRODUCT]: { product_id }, [DESIGNER_MODULE]: { designer_id: previous } })
    }
    if (designer_id) {
      await link.create({ [Modules.PRODUCT]: { product_id }, [DESIGNER_MODULE]: { designer_id } })
    }
    return new StepResponse(designer_id, { product_id, previous, next: designer_id })
  },
  async (comp, { container }) => {
    if (!comp) {
      return
    }
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    if (comp.next) {
      await link.dismiss({ [Modules.PRODUCT]: { product_id: comp.product_id }, [DESIGNER_MODULE]: { designer_id: comp.next } })
    }
    if (comp.previous) {
      await link.create({ [Modules.PRODUCT]: { product_id: comp.product_id }, [DESIGNER_MODULE]: { designer_id: comp.previous } })
    }
  }
)

type ItemComp =
  | { mode: "removed"; id: string; product_id: string }
  | { mode: "updated"; before: any }
  | { mode: "created"; id: string; product_id: string }
  | null

const upsertConsignmentItemStep = createStep(
  "upsert-consignment-item",
  async (input: ProductGarbDetailsInput, { container }) => {
    if (input.consignor_id === undefined) {
      return new StepResponse(null as any, null as ItemComp)
    }
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "metadata",
        "categories.name",
        "variants.sku",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "consignment_item.*",
      ],
      filters: { id: input.product_id },
    })
    const product = data[0] as any
    if (!product) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
    }
    const existing = product.consignment_item
    if (!input.consignor_id) {
      if (existing) {
        await link.dismiss({
          [CONSIGNMENT_MODULE]: { consignment_item_id: existing.id },
          [Modules.PRODUCT]: { product_id: product.id },
        })
        await service.softDeleteConsignmentItems(existing.id)
      }
      return new StepResponse(null as any, (existing ? { mode: "removed", id: existing.id, product_id: product.id } : null) as ItemComp)
    }
    const price = Number(
      product.variants?.[0]?.prices?.find((p: any) => p.currency_code === "cad")?.amount ?? 0
    )
    const received = input.received_at ? new Date(input.received_at) : existing?.received_at ? new Date(existing.received_at) : new Date()
    const displayDays =
      input.display_days ?? existing?.display_days ?? displayDaysFor(product.categories?.[0]?.name, price)
    const code =
      (product.metadata?.item_code as string) || product.variants?.[0]?.sku?.replace(/^GARB-/, "") || product.id
    const data_ = {
      consignor_id: input.consignor_id,
      item_code: code,
      title: product.title,
      received_at: received,
      display_days: displayDays,
      expires_at: addDays(received, displayDays),
      list_price: price,
    }
    if (existing) {
      const before = await service.retrieveConsignmentItem(existing.id)
      const item = await service.updateConsignmentItems({ id: existing.id, ...data_ })
      return new StepResponse(item as any, {
        mode: "updated",
        before: {
          id: before.id,
          consignor_id: before.consignor_id,
          item_code: before.item_code,
          title: before.title,
          received_at: before.received_at,
          display_days: before.display_days,
          expires_at: before.expires_at,
          list_price: Number(before.list_price),
        },
      } as ItemComp)
    }
    const item = await service.createConsignmentItems({ ...data_, status: "active" })
    await link.create({
      [CONSIGNMENT_MODULE]: { consignment_item_id: item.id },
      [Modules.PRODUCT]: { product_id: product.id },
    })
    return new StepResponse(item as any, { mode: "created", id: item.id, product_id: product.id } as ItemComp)
  },
  async (comp, { container }) => {
    if (!comp) {
      return
    }
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    if (comp.mode === "created") {
      await link.dismiss({
        [CONSIGNMENT_MODULE]: { consignment_item_id: comp.id },
        [Modules.PRODUCT]: { product_id: comp.product_id },
      })
      await service.deleteConsignmentItems(comp.id)
    } else if (comp.mode === "updated") {
      await service.updateConsignmentItems(comp.before)
    } else if (comp.mode === "removed") {
      await service.restoreConsignmentItems(comp.id)
      await link.create({
        [CONSIGNMENT_MODULE]: { consignment_item_id: comp.id },
        [Modules.PRODUCT]: { product_id: comp.product_id },
      })
    }
  }
)

export const updateProductGarbDetailsWorkflow = createWorkflow(
  "update-product-garb-details",
  (input: ProductGarbDetailsInput) => {
    when({ input }, ({ input }) => !!input.metadata).then(() => {
      const update = transform({ input }, ({ input }) => ({
        selector: { id: input.product_id },
        update: { metadata: input.metadata },
      }))
      updateProductsWorkflow.runAsStep({ input: update })
    })
    const designer = setProductDesignerStep({ product_id: input.product_id, designer_id: input.designer_id })
    const item = upsertConsignmentItemStep(input)
    return new WorkflowResponse({ designer, item })
  }
)

/* -------------------------------------------------------------------------- */
/* Consignment item actions                                                    */
/* -------------------------------------------------------------------------- */

export type ItemAction = "extend" | "returned" | "withdrawn" | "forfeited" | "relist"

const consignmentItemActionStep = createStep(
  "consignment-item-action",
  async ({ id, action, days }: { id: string; action: ItemAction; days?: number }, { container }) => {
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const before = await service.retrieveConsignmentItem(id)
    if (before.status === "sold") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Sold items can't be changed here. Cancel the order instead.")
    }
    const { data } = await query.graph({ entity: "consignment_item", fields: ["id", "product.id"], filters: { id } })
    const productId = (data[0] as any)?.product?.id as string | undefined
    let update: Record<string, unknown>
    let publish: boolean | null = null
    switch (action) {
      case "extend":
      case "relist": {
        const extra = days ?? 30
        const base = before.status === "active" ? new Date(before.expires_at) : new Date()
        update = { status: "active", expires_at: addDays(base, extra), display_days: before.display_days + extra, pickup_deadline: null }
        publish = true
        break
      }
      case "returned":
      case "withdrawn":
      case "forfeited":
        update = { status: action }
        publish = false
        break
      default:
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unknown action ${action}`)
    }
    const item = await service.updateConsignmentItems({ id, ...update })
    return new StepResponse(
      { item, product_id: productId, publish },
      {
        id,
        status: before.status,
        expires_at: before.expires_at,
        display_days: before.display_days,
        pickup_deadline: before.pickup_deadline,
      }
    )
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    await service.updateConsignmentItems(prev as any)
  }
)

export const consignmentItemActionWorkflow = createWorkflow(
  "consignment-item-action",
  (input: { id: string; action: ItemAction; days?: number }) => {
    const result = consignmentItemActionStep(input)
    when({ result }, ({ result }) => !!result.product_id).then(() => {
      const update = transform({ result }, ({ result }) => ({
        selector: { id: result.product_id! },
        update: { status: result.publish ? ProductStatus.PUBLISHED : ProductStatus.DRAFT },
      }))
      updateProductsWorkflow.runAsStep({ input: update })
    })
    return new WorkflowResponse(result)
  }
)

/* -------------------------------------------------------------------------- */
/* Payouts                                                                    */
/* -------------------------------------------------------------------------- */

const markPayoutPaidStep = createStep(
  "mark-payout-paid",
  async ({ id, method, note }: { id: string; method?: string; note?: string }, { container }) => {
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    const before = await service.retrievePayout(id)
    if (before.status === "paid") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This payout is already marked as paid.")
    }
    const payout = await service.updatePayouts({
      id,
      status: "paid",
      paid_at: new Date(),
      method: method ?? before.method,
      note: note ?? before.note,
    })
    return new StepResponse(payout, { id, status: before.status, paid_at: before.paid_at, method: before.method, note: before.note })
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }
    const service: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
    await service.updatePayouts(prev as any)
  }
)

export const markPayoutPaidWorkflow = createWorkflow(
  "mark-payout-paid",
  (input: { id: string; method?: string; note?: string }) => new WorkflowResponse(markPayoutPaidStep(input))
)

/* -------------------------------------------------------------------------- */
/* Appointment requests                                                       */
/* -------------------------------------------------------------------------- */

export type AppointmentInput = {
  name: string
  email: string
  phone: string
  appointment_type: "in_store" | "in_house"
  item_count: number
  categories?: string[]
  brands?: string | null
  preferred_date?: string | null
  preferred_time?: string | null
  notes?: string | null
}

const createAppointmentStep = createStep(
  "create-appointment",
  async (input: AppointmentInput, { container }) => {
    const service: AppointmentModuleService = container.resolve(APPOINTMENT_MODULE)
    const appointment = await service.createAppointmentRequests({
      ...input,
      email: input.email.trim().toLowerCase(),
      categories: input.categories ?? null,
      preferred_date: input.preferred_date ? new Date(input.preferred_date) : null,
    } as any)
    return new StepResponse(appointment, appointment.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: AppointmentModuleService = container.resolve(APPOINTMENT_MODULE)
    await service.deleteAppointmentRequests(id)
  }
)

export const createAppointmentRequestWorkflow = createWorkflow(
  "create-appointment-request",
  (input: AppointmentInput) => new WorkflowResponse(createAppointmentStep(input))
)

type AppointmentUpdate = {
  id: string
  status?: "new" | "confirmed" | "completed" | "cancelled"
  confirmed_for?: string | null
  staff_notes?: string | null
}

const updateAppointmentStep = createStep(
  "update-appointment",
  async (input: AppointmentUpdate, { container }) => {
    const service: AppointmentModuleService = container.resolve(APPOINTMENT_MODULE)
    const before = await service.retrieveAppointmentRequest(input.id)
    const appointment = await service.updateAppointmentRequests({
      ...input,
      ...(input.confirmed_for !== undefined
        ? { confirmed_for: input.confirmed_for ? new Date(input.confirmed_for) : null }
        : {}),
    } as any)
    return new StepResponse(appointment, {
      id: before.id,
      status: before.status,
      confirmed_for: before.confirmed_for,
      staff_notes: before.staff_notes,
    })
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }
    const service: AppointmentModuleService = container.resolve(APPOINTMENT_MODULE)
    await service.updateAppointmentRequests(prev as any)
  }
)

export const updateAppointmentRequestWorkflow = createWorkflow(
  "update-appointment-request",
  (input: AppointmentUpdate) => new WorkflowResponse(updateAppointmentStep(input))
)
