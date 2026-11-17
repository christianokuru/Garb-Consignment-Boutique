import Link from "next/link"
import React from "react"

/**
 * Garb sells in one country, so URLs carry no country prefix (the middleware
 * maps them to the Canada region). Kept as a thin wrapper so starter code
 * that imports it keeps working.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
