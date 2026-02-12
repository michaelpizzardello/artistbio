type DashboardToggleSwitchProps = {
  checked: boolean
  onToggle: () => void
  size?: "sm" | "md"
}

const sizeClassMap = {
  sm: {
    button: "h-7 w-11",
    thumb: "size-5",
  },
  md: {
    button: "h-9 w-14",
    thumb: "size-6",
  },
}

export default function DashboardToggleSwitch({ checked, onToggle, size = "md" }: DashboardToggleSwitchProps) {
  const style = sizeClassMap[size]

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${style.button} rounded-full border px-1 transition ${
        checked ? "border-green-700 bg-green-700" : "border-[#c7ccbf] bg-[#cfd4c7]"
      }`}
    >
      <span className={`block rounded-full bg-white transition ${style.thumb} ${checked ? "ml-auto" : ""}`} />
    </button>
  )
}
