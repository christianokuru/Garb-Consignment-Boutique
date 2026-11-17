"use client"

import NativeSelect, { NativeSelectProps } from "@modules/common/components/native-select"
import { forwardRef } from "react"

import { PROVINCES } from "@lib/provinces"

export { provinceName } from "@lib/provinces"

const ProvinceSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function ProvinceSelect(props, ref) {
  return (
    <NativeSelect ref={ref} placeholder="Province" aria-label="Province" {...props}>
      {PROVINCES.map(([code, name]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </NativeSelect>
  )
})

export default ProvinceSelect
