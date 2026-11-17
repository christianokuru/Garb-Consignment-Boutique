import AuthShell from "@modules/garb/auth/auth-shell"
import { ResetPasswordForm } from "@modules/garb/auth/forms"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Choose a new seller password", robots: { index: false } }

type Props = { searchParams: Promise<{ token?: string; email?: string }> }

export default async function SellerResetPage({ searchParams }: Props) {
  const { token, email } = await searchParams
  return (
    <AuthShell title={<>Choose a new <em>password</em></>}>
      {token && email ? (
        <ResetPasswordForm actor="consignor" email={email} token={token} loginHref="/seller" />
      ) : (
        <p className="text-body">This link is incomplete. <Link href="/seller/forgot-password" className="link">Request a new one</Link>.</p>
      )}
    </AuthShell>
  )
}
