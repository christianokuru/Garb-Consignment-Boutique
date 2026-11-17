import { Checkbox, Label } from "@modules/common/components/ui"
import React from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  'data-testid': dataTestId
}) => {
  return (
    <div className="flex items-center space-x-2 ">
      <Checkbox
        className="h-4 w-4 accent-black"
        id="checkbox"
        role="checkbox"
        checked={checked}
        readOnly
        aria-checked={checked}
        onClick={onChange}
        name={name}
        data-testid={dataTestId}
      />
      <Label
        htmlFor="checkbox"
        className="!transform-none text-label font-normal"
      >
        {label}
      </Label>
    </div>
  )
}

export default CheckboxWithLabel
