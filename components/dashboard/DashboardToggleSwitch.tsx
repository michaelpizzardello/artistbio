type DashboardToggleSwitchProps = {
  checked: boolean
  onToggle: () => void
  size?: "xs" | "sm" | "md"
  ariaLabel: string
  disabled?: boolean
}

const sizeClassMap = {
  xs: {
    button: "h-7 w-11 p-0.5",
    thumb: "size-4",
  },
  sm: {
    button: "h-8 w-12 p-0.5",
    thumb: "size-5",
  },
  md: {
    button: "h-9 w-14 p-0.5",
    thumb: "size-6",
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
      className={`${style.button} inline-flex items-center rounded-full border transition focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] ${
        checked ? "border-primary bg-primary" : "border-border bg-muted"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span className={`block rounded-full bg-white transition ${style.thumb} ${checked ? "translate-x-full" : "translate-x-0"}`} />
    </button>
  )
}
