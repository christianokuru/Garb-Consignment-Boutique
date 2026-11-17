import { clx } from "@medusajs/ui"
import React from "react"

type Variant = "primary" | "secondary" | "transparent" | "danger" | "outline"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: "small" | "base" | "large" | "xlarge"
  isLoading?: boolean
  asChild?: boolean
}

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  transparent: "btn-ghost",
  danger: "bg-alert text-white hover:opacity-90",
}

/**
 * Garb pill button. API-compatible with the @medusajs/ui Button the starter
 * uses, so checkout and account code can switch to it without other changes.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "base", isLoading, className, children, disabled, asChild: _asChild, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={clx("btn", variants[variant], size === "small" && "btn-sm", size === "large" && "py-3.5", className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
      )}
      {children}
    </button>
  )
})

export default Button
