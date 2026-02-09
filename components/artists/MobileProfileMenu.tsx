"use client"

import { useEffect, useRef, useState } from "react"

const MENU_ITEMS = [
  { key: "home", label: "Home" },
  { key: "bio", label: "Bio" },
  { key: "works", label: "Works" },
  { key: "exhibitions", label: "Exhibitions" },
  { key: "contact", label: "Contact" },
] as const

export default function MobileProfileMenu() {
  const [activeKey, setActiveKey] = useState<(typeof MENU_ITEMS)[number]["key"]>("home")
  const [selectorStyle, setSelectorStyle] = useState<{ left: number; width: number }>({
    left: 2,
    width: 64,
  })
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const updateSelector = () => {
      const activeButton = buttonRefs.current[activeKey]
      const menu = menuRef.current
      if (!activeButton || !menu) return
      setSelectorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      })
    }

    updateSelector()
    window.addEventListener("resize", updateSelector)
    return () => window.removeEventListener("resize", updateSelector)
  }, [activeKey])

  const handlePress = (key: (typeof MENU_ITEMS)[number]["key"]) => {
    setActiveKey(key)
    const target = document.getElementById(key)
    if (!target) return
    target.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="sticky top-0 z-40 w-full bg-transparent px-2 py-1 md:hidden">
      <div
        ref={menuRef}
        className="relative flex h-8 w-full items-center justify-between rounded-full border border-black/30 bg-white p-0.5"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 rounded-full bg-black transition-[left,width] duration-250 ease-out"
          style={{
            left: selectorStyle.left,
            width: selectorStyle.width,
          }}
        />
        {MENU_ITEMS.map((item) => (
          <button
            key={item.key}
            ref={(element) => {
              buttonRefs.current[item.key] = element
            }}
            type="button"
            onClick={() => handlePress(item.key)}
            className={`relative z-10 h-full shrink-0 px-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors ${
              activeKey === item.key ? "text-white" : "text-black"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
