"use server"

import { sdk } from "@lib/config"
import { cookies as nextCookies } from "next/headers"
import { redirect } from "next/navigation"

type Actor = "customer" | "consignor"
export type FormState = { ok?: boolean; error?: string; email?: string } | null

const SELLER_COOKIE = "_garb_seller_jwt"
const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

function message(e: unknown, fallback = "Something went wrong. Please try again.") {
  const m = e instanceof Error ? e.message : typeof e === "string" ? e : ""
  return m && m.length < 200 ? m.replace(/^Error:\s*/, "") : fallback
}

/* ----------------------------- Password reset ----------------------------- */

export async function requestPasswordReset(actor: Actor, _state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim()
  if (!email) return { error: "Enter your email address.", email }
  try {
    await sdk.auth.resetPassword(actor, "emailpass", { identifier: email })
  } catch {
    // Same answer either way, so the form doesn't reveal who has an account.
  }
  return { ok: true }
}

export async function completePasswordReset(actor: Actor, _state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
  const token = String(formData.get("token") ?? "")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")
  if (password.length < 8) return { error: "Use at least 8 characters." }
  if (password !== confirm) return { error: "The passwords don't match." }
  try {
    await sdk.auth.updateProvider(actor, "emailpass", { email, password }, token)
  } catch (e) {
    return { error: "This reset link has expired. Request a new one." }
  }
  return { ok: true }
}

/* --------------------------------- Seller --------------------------------- */

async function sellerToken() {
  return (await nextCookies()).get(SELLER_COOKIE)?.value
}

async function setSellerToken(token: string) {
  ;(await nextCookies()).set(SELLER_COOKIE, token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

async function sellerFetch<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T | null> {
  const token = await sellerToken()
  if (!token) return null
  const res = await fetch(`${BACKEND}${path}`, {
    method: init?.method ?? "GET",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  })
  if (res.status === 401) return null
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText)
  return res.json()
}

async function authPost(path: string, body: unknown, token?: string) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || "Request failed")
  return json
}

export async function sellerLogin(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  try {
    const { token } = await authPost("/auth/consignor/emailpass", { email, password })
    await setSellerToken(token)
  } catch {
    return { error: "That email and password don't match a seller account.", email }
  }
  redirect("/seller")
}

export async function sellerLogout() {
  ;(await nextCookies()).delete(SELLER_COOKIE)
  redirect("/seller")
}

export type SellerInvite = { email: string; first_name: string; has_account: boolean }

export async function getSellerInvite(token: string): Promise<SellerInvite | null> {
  const res = await fetch(`${BACKEND}/consignors/invite?token=${encodeURIComponent(token)}`, { cache: "no-store" })
  if (!res.ok) return null
  return (await res.json()).invite
}

export async function activateSeller(_state: FormState, formData: FormData): Promise<FormState> {
  const invite = String(formData.get("token") ?? "")
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")
  if (password.length < 8) return { error: "Use at least 8 characters." }
  if (password !== confirm) return { error: "The passwords don't match." }
  try {
    let registration: string
    try {
      registration = (await authPost("/auth/consignor/emailpass/register", { email, password })).token
    } catch {
      // The login may exist already (for example an earlier, unfinished activation).
      registration = (await authPost("/auth/consignor/emailpass", { email, password })).token
    }
    await authPost("/consignors/activate", { token: invite }, registration)
    const { token } = await authPost("/auth/consignor/emailpass", { email, password })
    await setSellerToken(token)
  } catch (e) {
    return { error: message(e, "We couldn't activate your account. Ask us for a new invite.") }
  }
  redirect("/seller")
}

export type SellerSummary = {
  active_count: number
  expiring_soon_count: number
  awaiting_pickup_count: number
  sold_count: number
  lifetime_earnings: number
  this_month_earnings: number
  pending_earnings: number
  ready_to_collect: number
  scheduled_payouts: number
}

export type Seller = {
  id: string
  account_number: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  split_rate: number
  created_at: string
}

export type SellerItem = {
  id: string
  item_code: string
  title: string
  status: "active" | "sold" | "expired" | "returned" | "forfeited" | "withdrawn"
  received_at: string
  display_days: number
  expires_at: string
  pickup_deadline: string | null
  list_price: number
  sale_price: number | null
  consignor_share: number | null
  sold_at: string | null
  payout_id: string | null
  product: { id: string; handle: string; status: string; thumbnail: string | null } | null
}

export type SellerPayout = {
  id: string
  period: string
  amount: number
  item_count: number
  status: string
  state: "paid" | "ready" | "scheduled"
  available_at: string
  paid_at: string | null
  method: string | null
  items: { id: string; title: string; item_code: string; sale_price: number; consignor_share: number }[]
}

export async function getSeller() {
  try {
    return await sellerFetch<{ consignor: Seller; summary: SellerSummary }>("/consignors/me")
  } catch {
    return null
  }
}

export async function getSellerItems() {
  return (await sellerFetch<{ items: SellerItem[] }>("/consignors/me/items"))?.items ?? []
}

export async function getSellerPayouts() {
  return (await sellerFetch<{ payouts: SellerPayout[] }>("/consignors/me/payouts"))?.payouts ?? []
}

export async function updateSellerPhone(_state: FormState, formData: FormData): Promise<FormState> {
  const phone = String(formData.get("phone") ?? "").trim()
  if (phone.replace(/\D/g, "").length < 7) return { error: "Enter a valid phone number." }
  try {
    await sellerFetch("/consignors/me", { method: "POST", body: { phone } })
    return { ok: true }
  } catch (e) {
    return { error: message(e) }
  }
}
