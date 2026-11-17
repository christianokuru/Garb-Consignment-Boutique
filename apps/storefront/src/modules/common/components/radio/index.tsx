const Radio = ({ checked, "data-testid": dataTestId }: { checked: boolean; "data-testid"?: string }) => {
  return (
    <span
      aria-hidden
      data-state={checked ? "checked" : "unchecked"}
      className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
        checked ? "border-ink bg-ink" : "border-[#bdbdbd] bg-white"
      }`}
      data-testid={dataTestId || "radio-button"}
    >
      {checked && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
  )
}

export default Radio
