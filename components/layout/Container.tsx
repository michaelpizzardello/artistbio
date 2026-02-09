import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type ContainerProps = HTMLAttributes<HTMLDivElement>

export default function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1540px] px-4 sm:px-6 lg:px-10", className)}
      {...props}
    />
  )
}
