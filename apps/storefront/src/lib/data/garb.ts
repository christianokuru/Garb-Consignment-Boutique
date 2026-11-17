"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getRegion } from "./regions"

export type Designer = {
  id: string
  name: string
  handle: string
  description: string | null
  is_featured: boolean
  product_count: number
  counts: { women: number; men: number }
}

export type ListingProduct = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  hover_image: string | null
  designer: string | null
  designer_handle: string | null
  gender: string | null
  size: string | null
  item_type: string | null
  item_code: string | null
  condition: string | null
  price: number
  original_price: number
  on_sale: boolean
}

export type Facet = { value: string; count: number }

export type SearchResult = {
  products: ListingProduct[]
  count: number
  facets: { designer: Facet[]; size: Facet[]; category: Facet[] }
  price: { min: number; max: number } | null
}

export type SortKey = "newest" | "price_asc" | "price_desc"

export type SearchParams = {
  q?: string
  gender?: string
  category?: string
  designer?: string[]
  size?: string[]
  onSale?: boolean
  minPrice?: number
  maxPrice?: number
  sort?: SortKey
  page?: number
  limit?: number
  excludeId?: string
}

const CACHE = { next: { revalidate: 60, tags: ["products"] } }

const SORTS: Record<SortKey, Record<string, "ASC" | "DESC">> = {
  newest: { item_number: "DESC" },
  price_asc: { min_price_cad: "ASC" },
  price_desc: { min_price_cad: "DESC" },
}

/**
 * Product listings come from Medusa's search index, which holds the designer,
 * size, department and price for every published piece. One request returns
 * a page of products plus the facet counts for the filters.
 */
export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const limit = params.limit ?? 24
  const page = Math.max(1, params.page ?? 1)
  const filters: Record<string, unknown> = {}
  if (params.q?.trim()) filters.q = params.q.trim()
  if (params.gender) filters.gender = params.gender
  if (params.category) filters.category_handles = params.category
  if (params.designer?.length) filters.designer = params.designer.length === 1 ? params.designer[0] : { $in: params.designer }
  if (params.size?.length) filters.size = params.size.length === 1 ? params.size[0] : { $in: params.size }
  if (params.onSale) filters.on_sale_cad = true
  if (params.minPrice != null || params.maxPrice != null) {
    filters.min_price_cad = {
      ...(params.minPrice != null ? { $gte: params.minPrice } : {}),
      ...(params.maxPrice != null ? { $lte: params.maxPrice } : {}),
    }
  }
  if (params.excludeId) filters.id = { $ne: params.excludeId }

  const order = params.q?.trim() && !params.sort ? undefined : SORTS[params.sort ?? "newest"]

  try {
    const res = await sdk.client.fetch<{ results: any[] }>("/store/search", {
      method: "POST",
      body: {
        queries: [
          {
            entity: "product",
            filters,
            pagination: { skip: (page - 1) * limit, take: limit, ...(order ? { order } : {}) },
            search_options: {
              count: "exact",
              disjunctive_facets: true,
              facets: [
                { field: "designer", limit: 200, sort: "alpha" },
                { field: "size", limit: 60 },
                { field: "category", limit: 30 },
                { field: "min_price_cad", type: "stats" },
              ],
            },
          },
        ],
      },
      ...CACHE,
      cache: "force-cache",
    })
    const result = res.results?.[0] ?? {}
    const products: ListingProduct[] = (result.hits ?? []).map(({ document: d }: any) => ({
      id: d.id,
      title: d.title,
      handle: d.handle,
      thumbnail: d.thumbnail ?? null,
      hover_image: d.hover_image ?? null,
      designer: d.designer ?? null,
      designer_handle: d.designer_handle ?? null,
      gender: d.gender ?? null,
      size: d.size ?? null,
      item_type: d.item_type ?? null,
      item_code: d.item_code ?? null,
      condition: d.condition ?? null,
      price: Number(d.min_price_cad ?? 0),
      original_price: Number(d.original_price_cad ?? d.min_price_cad ?? 0),
      on_sale: Boolean(d.on_sale_cad),
    }))
    const facet = (name: string): Facet[] => result.facets?.[name]?.values ?? []
    const stats = result.facets?.min_price_cad
    return {
      products,
      count: result.metadata?.count ?? products.length,
      facets: { designer: facet("designer"), size: facet("size"), category: facet("category") },
      price: stats && stats.count ? { min: stats.min, max: stats.max } : null,
    }
  } catch {
    return { products: [], count: 0, facets: { designer: [], size: [], category: [] }, price: null }
  }
}

export async function listDesigners(opts: { featured?: boolean; gender?: string } = {}): Promise<Designer[]> {
  try {
    const { designers } = await sdk.client.fetch<{ designers: Designer[] }>("/store/designers", {
      query: { ...(opts.featured ? { featured: "true" } : {}), ...(opts.gender ? { gender: opts.gender } : {}) },
      ...CACHE,
      cache: "force-cache",
    })
    return designers
  } catch {
    return []
  }
}

export async function getDesigner(handle: string) {
  try {
    return await sdk.client.fetch<{ designer: Omit<Designer, "product_count" | "counts">; product_ids: string[] }>(
      `/store/designers/${encodeURIComponent(handle)}`,
      { ...CACHE, cache: "force-cache" }
    )
  } catch {
    return null
  }
}

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,+metadata,*images,*categories,*categories.parent_category,+designer.id,+designer.name,+designer.handle"

export type GarbProduct = HttpTypes.StoreProduct & {
  designer?: { id: string; name: string; handle: string } | null
}

export async function getProductByHandle(handle: string): Promise<GarbProduct | null> {
  const region = await getRegion("ca")
  if (!region) return null
  try {
    const { products } = await sdk.client.fetch<{ products: GarbProduct[] }>("/store/products", {
      query: { handle, region_id: region.id, fields: PRODUCT_FIELDS, limit: 1 },
      ...CACHE,
      cache: "force-cache",
    })
    return products[0] ?? null
  } catch {
    return null
  }
}
