"use client"

import {
  activateSeller,
  completePasswordReset,
  requestPasswordReset,
  sellerLogin,
  updateSellerPhone,
  type FormState,
} from "@lib/data/garb-auth"
import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"

export function Submit({ children, className = "w-full" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={`btn btn-primary py-3.5 ${className}`} disabled={pending} aria-busy={pending}>
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden />}
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = props.id ?? props.name
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} className="field" {...props} />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

function ErrorText({ state }: { state: FormState }) {
  return state?.error ? (
    <p className="rounded-[14px] bg-[#fbeae5] px-4 py-3 text-label text-alert" role="alert">{state.error}</p>
  ) : null
}

export function ForgotPasswordForm({ actor, loginHref }: { actor: "customer" | "consignor"; loginHref: string }) {
  const [state, action] = useActionState(requestPasswordReset.bind(null, actor), null)
  if (state?.ok) {
    return (
      <div className="space-y-4" role="status">
        <p className="text-body">If there&apos;s an account for that email, we&apos;ve sent a link to choose a new password. It expires in 15 minutes.</p>
        <Link href={loginHref} className="btn btn-secondary">Back to sign in</Link>
      </div>
    )
  }
  return (
    <form action={action} className="space-y-5">
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state?.email} required />
      <ErrorText state={state} />
      <Submit>Send reset link</Submit>
      <p className="text-label"><Link href={loginHref} className="link">Back to sign in</Link></p>
    </form>
  )
}

export function ResetPasswordForm({
  actor,
  email,
  token,
  loginHref,
}: {
  actor: "customer" | "consignor"
  email: string
  token: string
  loginHref: string
}) {
  const [state, action] = useActionState(completePasswordReset.bind(null, actor), null)
  if (state?.ok) {
    return (
      <div className="space-y-4" role="status">
        <p className="text-body">Your password has been changed.</p>
        <Link href={loginHref} className="btn btn-primary">Sign in</Link>
      </div>
    )
  }
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <p className="text-label text-quiet">For {email}</p>
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      <ErrorText state={state} />
      <Submit>Save new password</Submit>
    </form>
  )
}

export function SellerLoginForm() {
  const [state, action] = useActionState(sellerLogin, null)
  return (
    <form action={action} className="space-y-5" data-testid="seller-login-form">
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state?.email} required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <ErrorText state={state} />
      <Submit>Sign in</Submit>
      <p className="text-label"><Link href="/seller/forgot-password" className="link">Forgot your password?</Link></p>
    </form>
  )
}

export function SellerActivateForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState(activateSeller, null)
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      <div>
        <p className="field-label">Email</p>
        <p className="rounded-utility bg-paper px-4 py-3 text-body text-quiet">{email}</p>
      </div>
      <Field label="Choose a password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." />
      <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      <ErrorText state={state} />
      <Submit>Activate my account</Submit>
    </form>
  )
}

export function SellerPhoneForm({ phone }: { phone: string | null }) {
  const [state, action] = useActionState(updateSellerPhone, null)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1">
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" defaultValue={phone ?? ""} required />
      </div>
      <Submit className="">Save</Submit>
      {state?.ok && <p className="w-full text-label" role="status">Saved.</p>}
      {state?.error && <p className="w-full text-label text-alert" role="alert">{state.error}</p>}
    </form>
  )
}
