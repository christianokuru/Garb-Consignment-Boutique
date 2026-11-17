import { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import { DEFAULT_REGION_STORE_POLICIES } from "../lib/region-store-policies"
import { DESIGNER_MODULE } from "../modules/designer"
import { CONSIGNMENT_MODULE } from "../modules/consignment"
import { APPOINTMENT_MODULE } from "../modules/appointment"
import type DesignerModuleService from "../modules/designer/service"
import type ConsignmentModuleService from "../modules/consignment/service"
import type AppointmentModuleService from "../modules/appointment/service"
import { slugify, displayDaysFor, periodFor, payoutAvailableAt } from "../lib/garb"
import catalog from "./data/garb-catalog.json"

type CatalogItem = {
  code: string
  gender: "women" | "men"
  category: string
  designer: string
  type: string
  size: string
  labeled_size: string | null
  price: number
  compare_at: number | null
  description: string | null
  colour: string
  condition_grade: string
  condition: string
  measurements: Record<string, string>
  details: Record<string, string>
  images: string[]
}

const WOMEN_CATEGORIES = [
  "Outerwear",
  "Dresses",
  "Tops",
  "Knitwear",
  "Pants",
  "Denim",
  "Skirts",
  "Suits & Sets",
  "Bags",
  "Footwear",
  "Accessories",
  "Jewelry",
]
const MEN_CATEGORIES = [
  "Outerwear",
  "Suits",
  "Shirts",
  "Knitwear",
  "Pants",
  "Footwear",
  "Bags",
  "Accessories",
]

const FEATURED_DESIGNERS = [
  "Chanel",
  "Hermès",
  "Louis Vuitton",
  "Gucci",
  "Prada",
  "Saint Laurent",
  "Bottega Veneta",
  "Max Mara",
  "Dries van Noten",
  "Burberry",
  "The Row",
  "Brunello Cucinelli",
  "Loro Piana",
  "Tom Ford",
  "Celine",
  "Christian Louboutin",
]

// Sales tax by province (rates as of 2025). Prices are tax-exclusive.
const PROVINCE_TAX: { code: string; name: string; rate: number }[] = [
  { code: "ca-on", name: "HST", rate: 13 },
  { code: "ca-qc", name: "GST + QST", rate: 14.975 },
  { code: "ca-bc", name: "GST + PST", rate: 12 },
  { code: "ca-ab", name: "GST", rate: 5 },
  { code: "ca-mb", name: "GST + PST", rate: 12 },
  { code: "ca-sk", name: "GST + PST", rate: 11 },
  { code: "ca-ns", name: "HST", rate: 14 },
  { code: "ca-nb", name: "HST", rate: 15 },
  { code: "ca-nl", name: "HST", rate: 15 },
  { code: "ca-pe", name: "HST", rate: 15 },
  { code: "ca-nt", name: "GST", rate: 5 },
  { code: "ca-nu", name: "GST", rate: 5 },
  { code: "ca-yt", name: "GST", rate: 5 },
]

const CONSIGNORS = [
  { first_name: "Amelia", last_name: "Hart", email: "seller@garb.test", phone: "416-555-0142" },
  { first_name: "Julien", last_name: "Moreau", email: "julien.moreau@example.com", phone: "416-555-0187" },
  { first_name: "Priya", last_name: "Raman", email: "priya.raman@example.com", phone: "647-555-0110" },
  { first_name: "Daniel", last_name: "Okafor", email: "daniel.okafor@example.com", phone: "416-555-0163" },
  { first_name: "Sofia", last_name: "Bianchi", email: "sofia.bianchi@example.com", phone: "905-555-0128" },
  { first_name: "Margaret", last_name: "Lam", email: "margaret.lam@example.com", phone: "647-555-0199" },
]

export const DEMO_SELLER = { email: "seller@garb.test", password: "garbseller1" }

const DAY = 24 * 60 * 60 * 1000

// Catalogue photos ship in static/catalog and are served by the backend.
const imageUrl = (file: string) =>
  `${(process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}/static/catalog/${file}`

// Deterministic pseudo-random so re-seeding gives the same demo data.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function productTitle(item: CatalogItem) {
  return `${item.designer} ${item.type}`
}

export async function seedGarb(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const paymentModule = container.resolve(Modules.PAYMENT)
  const authModule = container.resolve(Modules.AUTH)
  const designerService: DesignerModuleService = container.resolve(DESIGNER_MODULE)
  const consignmentService: ConsignmentModuleService = container.resolve(CONSIGNMENT_MODULE)
  const appointmentService: AppointmentModuleService = container.resolve(APPOINTMENT_MODULE)

  const items = catalog as unknown as CatalogItem[]
  const random = rng(1046)
  const now = Date.now()

  logger.info("[garb] Creating store, sales channel and publishable key")
  const {
    result: [salesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [{ name: "Garb Online", description: "garb.ca storefront" }],
    },
  })

  const {
    result: [publishableKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [{ title: "Garb Storefront", type: "publishable", created_by: "" }],
    },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableKey.id, add: [salesChannel.id] },
  })

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Garb Consignment Boutique",
          supported_currencies: [{ currency_code: "cad", is_default: true }],
          default_sales_channel_id: salesChannel.id,
        },
      ],
    },
  })

  logger.info("[garb] Creating Canada region and taxes")
  const providers = await paymentModule.listPaymentProviders({})
  const paymentProviderIds = providers
    .map((p) => p.id)
    .filter((id) => id === "pp_system_default" || id === "pp_stripe_stripe")

  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Canada",
          currency_code: "cad",
          countries: ["ca"],
          automatic_taxes: true,
          is_tax_inclusive: false,
          payment_providers: paymentProviderIds,
          metadata: DEFAULT_REGION_STORE_POLICIES,
        },
      ],
    },
  })

  const { result: taxRegions } = await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "ca",
        provider_id: "tp_system",
        default_tax_rate: { name: "GST", code: "GST", rate: 5 },
      },
    ],
  })
  await createTaxRegionsWorkflow(container).run({
    input: PROVINCE_TAX.map((p) => ({
      country_code: "ca",
      province_code: p.code,
      parent_id: taxRegions[0].id,
      default_tax_rate: { name: p.name, code: p.name.replace(/\W+/g, "").toUpperCase(), rate: p.rate },
    })),
  })

  logger.info("[garb] Creating stock location, shipping and pickup")
  const {
    result: [location],
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Garb, Queen West",
          address: {
            address_1: "1046 Queen St W",
            city: "Toronto",
            province: "ON",
            postal_code: "M6J 1H7",
            country_code: "CA",
            phone: "416-588-2121",
          },
        },
      ],
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const shippingProfile = profiles[0]

  const shippingSet = await fulfillmentModule.createFulfillmentSets({
    name: "Garb shipping",
    type: "shipping",
    service_zones: [{ name: "Canada", geo_zones: [{ type: "country", country_code: "ca" }] }],
  })
  const pickupSet = await fulfillmentModule.createFulfillmentSets({
    name: "Garb in-store pickup",
    type: "pickup",
    service_zones: [{ name: "Queen West store", geo_zones: [{ type: "country", country_code: "ca" }] }],
  })
  for (const set of [shippingSet, pickupSet]) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: set.id },
    })
  }

  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]
  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Canada Post Expedited",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: shippingSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Expedited", description: "Tracked, 2 to 6 business days.", code: "expedited" },
        prices: [
          { currency_code: "cad", amount: 20 },
          { region_id: region.id, amount: 20 },
        ],
        rules: storeRules,
      },
      {
        name: "Canada Post Xpresspost",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: shippingSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Xpresspost", description: "Tracked and insured, 1 to 3 business days.", code: "xpresspost" },
        prices: [
          { currency_code: "cad", amount: 35 },
          { region_id: region.id, amount: 35 },
        ],
        rules: storeRules,
      },
      {
        name: "Pick up at 1046 Queen St W",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: pickupSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "In-store pickup", description: "Ready within one business day.", code: "pickup" },
        prices: [
          { currency_code: "cad", amount: 0 },
          { region_id: region.id, amount: 0 },
        ],
        rules: storeRules,
      },
    ],
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: location.id, add: [salesChannel.id] },
  })

  logger.info("[garb] Creating categories")
  const { result: parents } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Women", handle: "women", is_active: true, rank: 0 },
        { name: "Men", handle: "men", is_active: true, rank: 1 },
      ],
    },
  })
  const women = parents.find((c) => c.handle === "women")!
  const men = parents.find((c) => c.handle === "men")!
  const { result: children } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        ...WOMEN_CATEGORIES.map((name, rank) => ({
          name,
          handle: `women-${slugify(name)}`,
          parent_category_id: women.id,
          is_active: true,
          rank,
        })),
        ...MEN_CATEGORIES.map((name, rank) => ({
          name,
          handle: `men-${slugify(name)}`,
          parent_category_id: men.id,
          is_active: true,
          rank,
        })),
      ],
    },
  })
  const categoryId = (gender: string, name: string) =>
    children.find((c) => c.handle === `${gender}-${slugify(name)}`)!.id

  logger.info("[garb] Creating designers")
  const designerNames = [...new Set(items.map((i) => i.designer))].sort()
  const designers = await designerService.createDesigners(
    designerNames.map((name) => ({
      name,
      handle: slugify(name),
      is_featured: FEATURED_DESIGNERS.includes(name),
    }))
  )
  const designerByName = new Map(designers.map((d) => [d.name, d]))

  logger.info(`[garb] Creating ${items.length} products`)
  const productByCode = new Map<string, { id: string; variantId: string }>()
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25)
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: batch.map((item) => ({
          title: productTitle(item),
          subtitle: item.colour || undefined,
          handle: slugify(`${item.designer}-${item.type}-${item.code}`),
          description: item.description || undefined,
          status: ProductStatus.PUBLISHED,
          discountable: true,
          shipping_profile_id: shippingProfile.id,
          category_ids: [categoryId(item.gender, item.category)],
          thumbnail: imageUrl(item.images[0]),
          images: item.images.map((file) => ({ url: imageUrl(file) })),
          material: item.details["Composition"] || undefined,
          origin_country: undefined,
          sales_channels: [{ id: salesChannel.id }],
          options: [{ title: "Size", values: [item.size] }],
          variants: [
            {
              title: item.size,
              sku: `GARB-${item.code}`,
              manage_inventory: true,
              allow_backorder: false,
              options: { Size: item.size },
              prices: [{ amount: item.compare_at ?? item.price, currency_code: "cad" }],
            },
          ],
          metadata: {
            item_code: item.code,
            gender: item.gender,
            item_type: item.type,
            size: item.size,
            labeled_size: item.labeled_size,
            colour: item.colour,
            condition: item.condition,
            condition_grade: item.condition_grade,
            measurements: item.measurements,
            details: item.details,
          },
        })),
      },
    })
    result.forEach((product, idx) => {
      productByCode.set(batch[idx].code, { id: product.id, variantId: product.variants[0].id })
    })
  }

  // Link products to designers.
  await link.create(
    items.map((item) => ({
      [Modules.PRODUCT]: { product_id: productByCode.get(item.code)!.id },
      [DESIGNER_MODULE]: { designer_id: designerByName.get(item.designer)!.id },
    }))
  )

  // One piece of each item, held at the store.
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((inv) => ({
        inventory_item_id: inv.id,
        location_id: location.id,
        stocked_quantity: 1,
      })),
    },
  })

  logger.info("[garb] Creating sale price list")
  const saleItems = items.filter((i) => i.compare_at)
  await createPriceListsWorkflow(container).run({
    input: {
      price_lists_data: [
        // `type` is accepted by the Pricing Module but missing from the workflow DTO type.
        {
          title: "Sale",
          description: "Marked-down pieces",
          type: "sale",
          status: "active",
          prices: saleItems.map((item) => ({
            amount: item.price,
            currency_code: "cad",
            variant_id: productByCode.get(item.code)!.variantId,
          })),
        } as any,
      ],
    },
  })

  logger.info("[garb] Creating consignors and consignment records")
  const consignors: any[] = []
  for (const c of CONSIGNORS) {
    const account_number = await consignmentService.nextAccountNumber()
    consignors.push(await consignmentService.createConsignors({ ...c, account_number, split_rate: 50 }))
  }

  const itemRecords = await consignmentService.createConsignmentItems(
    items.map((item, idx) => {
      const daysAgo = Math.floor(random() * 80)
      const received = new Date(now - daysAgo * DAY)
      const displayDays = displayDaysFor(item.category, item.price)
      return {
        item_code: item.code,
        title: productTitle(item),
        status: "active" as const,
        received_at: received,
        display_days: displayDays,
        expires_at: new Date(received.getTime() + displayDays * DAY),
        list_price: item.compare_at ?? item.price,
        consignor_id: consignors[idx % consignors.length].id,
      }
    })
  )
  await link.create(
    itemRecords.map((record) => ({
      [CONSIGNMENT_MODULE]: { consignment_item_id: record.id },
      [Modules.PRODUCT]: { product_id: productByCode.get(record.item_code)!.id },
    }))
  )

  // Sales history for the demo seller (items sold before this catalogue).
  const history = [
    { title: "Chanel Bouclé Jacket", price: 2400, monthsAgo: 2 },
    { title: "Hermès Silk Carré", price: 380, monthsAgo: 2 },
    { title: "Saint Laurent Le 5 à 7 Bag", price: 1450, monthsAgo: 1 },
    { title: "The Row Wool Trousers", price: 520, monthsAgo: 1 },
    { title: "Loewe Puzzle Wallet", price: 340, monthsAgo: 0 },
  ]
  const seller = consignors[0]
  for (const [idx, h] of history.entries()) {
    const soldAt = new Date()
    soldAt.setMonth(soldAt.getMonth() - h.monthsAgo, 6 + idx)
    const received = new Date(soldAt.getTime() - 30 * DAY)
    const share = Math.round(h.price * (seller.split_rate / 100) * 100) / 100
    const record = await consignmentService.createConsignmentItems({
      item_code: String(137900 + idx),
      title: h.title,
      status: "sold",
      received_at: received,
      display_days: 90,
      expires_at: new Date(received.getTime() + 90 * DAY),
      list_price: h.price,
      sale_price: h.price,
      consignor_share: share,
      sold_at: soldAt,
      consignor_id: seller.id,
    })
    if (h.monthsAgo > 0) {
      const period = periodFor(soldAt)
      const [existing] = await consignmentService.listPayouts({ consignor_id: seller.id, period })
      const payout =
        existing ??
        (await consignmentService.createPayouts({
          consignor_id: seller.id,
          period,
          amount: 0,
          item_count: 0,
          available_at: payoutAvailableAt(period),
          status: h.monthsAgo > 1 ? "paid" : "scheduled",
          paid_at: h.monthsAgo > 1 ? payoutAvailableAt(period) : null,
          method: h.monthsAgo > 1 ? "E-transfer" : null,
        }))
      await consignmentService.updatePayouts({
        id: payout.id,
        amount: Number(payout.amount) + share,
        item_count: payout.item_count + 1,
      })
      await consignmentService.updateConsignmentItems({ id: record.id, payout_id: payout.id })
    }
  }

  // An expired piece waiting for pickup, so the dashboard shows that state.
  await consignmentService.createConsignmentItems({
    item_code: "137880",
    title: "Theory Wool Blazer",
    status: "expired",
    received_at: new Date(now - 95 * DAY),
    display_days: 90,
    expires_at: new Date(now - 5 * DAY),
    pickup_deadline: new Date(now + 2 * DAY),
    list_price: 180,
    consignor_id: seller.id,
  })

  // Demo seller login for the seller dashboard.
  const { authIdentity, success, error } = await authModule.register("emailpass", {
    url: "",
    headers: {},
    query: {},
    protocol: "http",
    body: { email: DEMO_SELLER.email, password: DEMO_SELLER.password },
  })
  if (!success || !authIdentity) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Could not create demo seller login: ${error}`)
  }
  await authModule.updateAuthIdentities({
    id: authIdentity.id,
    app_metadata: { ...(authIdentity.app_metadata ?? {}), consignor_id: seller.id },
  })
  await consignmentService.updateConsignors({ id: seller.id, has_account: true })

  logger.info("[garb] Creating sample appointment requests")
  await appointmentService.createAppointmentRequests(([
    {
      name: "Hannah Becker",
      email: "hannah.becker@example.com",
      phone: "416-555-0175",
      appointment_type: "in_store",
      item_count: 8,
      categories: ["Outerwear", "Bags"],
      brands: "Max Mara, Celine, Acne Studios",
      preferred_date: new Date(now + 3 * DAY),
      preferred_time: "Afternoon",
      notes: "Two coats and a Celine Belt bag with dust bag.",
    },
    {
      name: "Marcus Lee",
      email: "marcus.lee@example.com",
      phone: "647-555-0133",
      appointment_type: "in_house",
      item_count: 40,
      categories: ["Suits", "Footwear", "Accessories"],
      brands: "Tom Ford, Brunello Cucinelli, John Lobb",
      preferred_date: new Date(now + 7 * DAY),
      preferred_time: "Evening",
      notes: "Downsizing. Mostly suiting in size 40R.",
      status: "confirmed",
      confirmed_for: new Date(now + 7 * DAY),
    },
  ] as any))

  logger.info(`[garb] Done. Publishable key: ${publishableKey.token}`)
  return { publishableKey: publishableKey.token }
}

export default async function seedGarbScript({ container }: ExecArgs) {
  await seedGarb(container)
}
