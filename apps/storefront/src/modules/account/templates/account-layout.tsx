import React from "react"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"
import { STORE } from "@lib/garb"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({ customer, children }) => {
  return (
    <div className="content-container pb-8 pt-8 sm:pt-12" data-testid="account-page">
      <div className={customer ? "grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16" : ""}>
        {customer && <div><AccountNav customer={customer} /></div>}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <div className="mt-20 flex flex-col justify-between gap-6 rounded-utility bg-paper p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-body font-medium">Questions about an order?</p>
          <p className="text-label text-[#3d3d3d]">We&apos;re in the shop Tuesday to Sunday, 12 to 6.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={STORE.phoneHref} className="btn btn-secondary btn-sm bg-white">{STORE.phone}</a>
          <a href={`mailto:${STORE.email}`} className="btn btn-primary btn-sm">Email us</a>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
