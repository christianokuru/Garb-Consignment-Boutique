import AuthShell from "@modules/garb/auth/auth-shell"
import { ResetPasswordForm } from "@modules/garb/auth/forms"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } }

type Props = { searchParams: Promise<{ token?: string; email?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams
  return (
    <AuthShell title={<>Choose a new <em>password</em></>}>
      {token && email ? (
        <ResetPasswordForm actor="customer" email={email} token={token} loginHref="/account" />
      ) : (
        <p className="text-body">This link is incomplete. <Link href="/forgot-password" className="link">Request a new one</Link>.</p>
      )}
    </AuthShell>
  )
}
