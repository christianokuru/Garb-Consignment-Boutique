import { STORE } from "@lib/garb"
import InfoPage from "@modules/garb/info-page"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } }

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Legal" title={<>Your <em>privacy</em></>} updated="November 2026">
      <p>We collect only what we need to sell to you, sell for you, and keep in touch when you ask us to.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Orders: your name, email, phone, shipping and billing address, and what you bought.</li>
        <li>Consignment: your name, contact details, the pieces you consign, sales and payouts.</li>
        <li>Appointment requests: the details you enter in the booking form.</li>
      </ul>
      <p>Card payments are handled by our payment processor; we never see or store your full card number.</p>
      <h2>How we use it</h2>
      <p>To process orders and payments, ship or prepare pickups, run your seller account, answer your questions, and meet our legal and tax obligations. We don&apos;t sell your information.</p>
      <h2>Cookies</h2>
      <p>We use essential cookies to keep your bag and sign-in working. We don&apos;t use advertising cookies.</p>
      <h2>Your choices</h2>
      <p>You can ask to see, correct or delete your information at any time by emailing <a href={`mailto:${STORE.email}`}>{STORE.email}</a>.</p>
    </InfoPage>
  )
}
