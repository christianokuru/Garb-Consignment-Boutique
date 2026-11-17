import { getSellerInvite } from "@lib/data/garb-auth"
import AuthShell from "@modules/garb/auth/auth-shell"
import { SellerActivateForm } from "@modules/garb/auth/forms"
import { STORE } from "@lib/garb"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Activate your seller account", robots: { index: false } }

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ActivatePage({ searchParams }: Props) {
  const { token } = await searchParams
  const invite = token ? await getSellerInvite(token) : null

  if (!token || !invite) {
    return (
      <AuthShell title={<>This link is no longer <em>active</em></>} intro={<>Invite links last 14 days and work once. Already activated? <Link href="/seller" className="link">Sign in here</Link>. Otherwise Call us at <a href={STORE.phoneHref} className="link">{STORE.phone}</a> or email <a href={`mailto:${STORE.email}`} className="link">{STORE.email}</a> and we&apos;ll send a new one.</>}>
        <Link href="/seller" className="btn btn-secondary">Go to seller sign in</Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={<>Welcome, <em>{invite.first_name}</em></>}
      intro="Choose a password to follow your consigned pieces online: what's on the floor, what has sold, and when your payouts are ready."
    >
      <SellerActivateForm token={token} email={invite.email} />
    </AuthShell>
  )
}
