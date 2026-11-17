"use client"

import { requestAppointment } from "@lib/data/garb"
import { STORE } from "@lib/garb"
import Link from "next/link"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

const CATEGORIES = ["Outerwear", "Dresses", "Tops & knitwear", "Pants & denim", "Suiting", "Bags", "Footwear", "Jewelry & watches", "Accessories"]
const TIMES = ["Afternoon (12–3)", "Late afternoon (3–6)", "Any time"]

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button className="btn btn-primary w-full py-3.5 sm:w-auto" disabled={pending} data-testid="booking-submit">
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden />}
      Request appointment
    </button>
  )
}

function Err({ msg, id }: { msg?: string; id: string }) {
  return msg ? <p id={id} className="mt-1.5 text-micro text-alert">{msg}</p> : null
}

export default function BookingForm() {
  const [state, action] = useActionState(requestAppointment, null)
  const [type, setType] = useState<"in_store" | "in_house">("in_store")
  const fe = state?.fieldErrors ?? {}
  // React resets the form after each submit; defaults keep what was typed.
  const v = (k: string) => (state?.values?.[k] as string | undefined) ?? undefined
  const picked = (state?.values?.categories as string[] | undefined) ?? []
  const today = new Date().toISOString().slice(0, 10)

  if (state?.ok) {
    return (
      <div className="rounded-utility bg-paper p-6 sm:p-8" role="status" data-testid="booking-success">
        <p className="display-sm">Thank you. <em>We&apos;ll be in touch.</em></p>
        <p className="mt-4 max-w-lg text-body text-[#3d3d3d]">
          We&apos;ve emailed you a copy of your request. We&apos;ll confirm a time by email or phone within two business days.
          Until then, have a look at how to <Link href="/consign/what-we-take" className="link">prepare your pieces</Link>.
        </p>
        <Link href="/new-arrivals" className="btn btn-secondary mt-6">Browse the shop</Link>
      </div>
    )
  }

  const input = (name: string) => ({
    name,
    id: name,
    defaultValue: v(name),
    "aria-invalid": fe[name] ? true : undefined,
    "aria-describedby": fe[name] ? `${name}-error` : undefined,
    className: "field",
  })

  return (
    <form action={action} className="space-y-8" noValidate>
      <fieldset>
        <legend className="field-label">Where should we meet?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["in_store", "At the shop", "Up to 25 pieces. 1046 Queen St W."],
            ["in_house", "At your home", "For collections of 25 pieces or more, Toronto area."],
          ].map(([value, title, copy]) => (
            <label key={value} className={`flex cursor-pointer gap-3 rounded-[14px] border p-4 transition-colors ${type === value ? "border-ink" : "border-line hover:border-[#bdbdbd]"}`}>
              <input type="radio" name="appointment_type" value={value} checked={type === value} onChange={() => setType(value as typeof type)} className="mt-1 accent-black" />
              <span>
                <span className="block text-body font-medium">{title}</span>
                <span className="block text-label text-quiet">{copy}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="field-label">Full name</label>
          <input {...input("name")} autoComplete="name" required />
          <Err msg={fe.name} id="name-error" />
        </div>
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input {...input("email")} type="email" autoComplete="email" inputMode="email" required />
          <Err msg={fe.email} id="email-error" />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Phone</label>
          <input {...input("phone")} type="tel" autoComplete="tel" inputMode="tel" required />
          <Err msg={fe.phone} id="phone-error" />
        </div>
        <div>
          <label htmlFor="item_count" className="field-label">How many pieces?</label>
          <input {...input("item_count")} type="number" min={1} max={500} inputMode="numeric" required />
          <Err msg={fe.item_count} id="item_count-error" />
        </div>
        <div>
          <label htmlFor="brands" className="field-label">Main labels <span className="font-normal text-quiet">(optional)</span></label>
          <input {...input("brands")} placeholder="e.g. Max Mara, Celine, Acne" />
        </div>
      </div>

      <fieldset>
        <legend className="field-label">What are you bringing? <span className="font-normal text-quiet">(optional)</span></legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="checkbox" name="categories" value={c} defaultChecked={picked.includes(c)} className="peer sr-only" />
              <span className="pill peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ink">{c}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="preferred_date" className="field-label">Preferred day <span className="font-normal text-quiet">(optional)</span></label>
          <input {...input("preferred_date")} type="date" min={today} />
          <p className="field-hint">We&apos;re open Tuesday to Sunday.</p>
        </div>
        <div>
          <label htmlFor="preferred_time" className="field-label">Preferred time</label>
          <select {...input("preferred_time")} defaultValue={v("preferred_time") ?? "Any time"}>
            {TIMES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="field-label">Anything else? <span className="font-normal text-quiet">(optional)</span></label>
          <textarea name="notes" id="notes" rows={4} defaultValue={v("notes")} className="field" placeholder="Special pieces, sizes, condition, or your address for an in-home visit." />
        </div>
      </div>

      {/* Leave empty. Hidden from people; catches bots. */}
      <div className="hidden" aria-hidden>
        <label>Company <input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {state?.error && <p className="rounded-[14px] bg-[#fbeae5] px-4 py-3 text-label text-alert" role="alert">{state.error}</p>}
      {Object.keys(fe).length > 0 && <p className="text-label text-alert" role="alert">Please check the highlighted fields.</p>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Submit />
        <p className="text-label text-quiet">
          Prefer to talk? Call <a href={STORE.phoneHref} className="link">{STORE.phone}</a> or email{" "}
          <a href={`mailto:${STORE.email}`} className="link">{STORE.email}</a>.
        </p>
      </div>
    </form>
  )
}
