import React from "react"

type P = React.SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number, props: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
})

export const SearchIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
)
export const UserIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" /></svg>
)
export const MenuIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 8h16M4 16h16" /></svg>
)
export const CloseIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const ArrowUpRight = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M7 17 17 7M8 7h9v9" /></svg>
)
export const ArrowRight = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 12h16M14 6l6 6-6 6" /></svg>
)
export const ArrowLeft = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M20 12H4M10 6l-6 6 6 6" /></svg>
)
export const ChevronDown = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="m6 9 6 6 6-6" /></svg>
)
export const PlusIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const MinusIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M5 12h14" /></svg>
)
export const FilterIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
)
export const CheckIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)
export const MapPinIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
)
