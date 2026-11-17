import AuthShell from "@modules/garb/auth/auth-shell"
import { ForgotPasswordForm } from "@modules/garb/auth/forms"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } }

export default function ForgotPasswordPage() {
  return (
    <AuthShell title={<>Forgot your <em>password</em>?</>} intro="Enter the email you shop with and we'll send you a link to choose a new one.">
      <ForgotPasswordForm actor="customer" loginHref="/account" />
    </AuthShell>
  )
}
