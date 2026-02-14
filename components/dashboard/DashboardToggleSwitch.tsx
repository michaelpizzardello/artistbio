type DashboardToggleSwitchProps = {
  checked: boolean
  onToggle: () => void
  size?: "sm" | "md"
  ariaLabel: string
  disabled?: boolean
}

const sizeClassMap = {
  sm: {
    button: "h-8 w-12 p-0.5",
    thumb: "size-6",
  },
  md: {
    button: "h-9 w-14 p-0.5",
    thumb: "size-7",
  },
}

export default function DashboardToggleSwitch({
  checked,
  onToggle,
  size = "md",
  ariaLabel,
  disabled = false,
}: DashboardToggleSwitchProps) {
  const style = sizeClassMap[size]

  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`${style.button} inline-flex items-center rounded-full border transition ${
        checked ? "border-green-700 bg-green-700" : "border-[#c7ccbf] bg-[#cfd4c7]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span className={`block rounded-full bg-white transition ${style.thumb} ${checked ? "translate-x-full" : "translate-x-0"}`} />
    </button>
  )
}
