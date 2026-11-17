import AuthShell from "@modules/garb/auth/auth-shell"
import { ForgotPasswordForm } from "@modules/garb/auth/forms"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Seller password reset", robots: { index: false } }

export default function SellerForgotPage() {
  return (
    <AuthShell title={<>Seller <em>password</em> reset</>} intro="Enter the email on your consignment account and we'll send a reset link.">
      <ForgotPasswordForm actor="consignor" loginHref="/seller" />
    </AuthShell>
  )
}
