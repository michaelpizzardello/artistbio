'use client'

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SegmentToggle() {
  const [activeTab, setActiveTab] = useState<"info" | "work" | "moodboards" | "appreciations">("info")

  return (
    <div className="mx-auto mt-8 w-full">
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "info" | "work" | "moodboards" | "appreciations")
        }
        className="w-full"
      >
        <TabsList
          data-testid="TabNav"
          variant="line"
          className="h-auto w-full justify-start gap-0 rounded-none border-b border-white/20 bg-transparent px-0 pb-0"
        >
          <TabsTrigger
            value="info"
            data-testid="TabNav-Info"
            className="h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent px-1 text-sm font-semibold tracking-tight text-white/55 shadow-none transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:after:opacity-100 after:-bottom-[1px] after:h-[3px] after:bg-white md:h-14 md:px-2 md:text-base"
          >
            Info
          </TabsTrigger>
          <TabsTrigger
            value="work"
            data-testid="TabNav-Work"
            className="h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent px-1 text-sm font-semibold tracking-tight text-white/55 shadow-none transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:after:opacity-100 after:-bottom-[1px] after:h-[3px] after:bg-white md:h-14 md:px-2 md:text-base"
          >
            Work
          </TabsTrigger>
          <TabsTrigger
            value="moodboards"
            data-testid="TabNav-Moodboards"
            className="h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent px-1 text-sm font-semibold tracking-tight text-white/55 shadow-none transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:after:opacity-100 after:-bottom-[1px] after:h-[3px] after:bg-white md:h-14 md:px-2 md:text-base"
          >
            Moodboards
          </TabsTrigger>
          <TabsTrigger
            value="appreciations"
            data-testid="TabNav-Appreciations"
            className="h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent px-1 text-sm font-semibold tracking-tight text-white/55 shadow-none transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:after:opacity-100 after:-bottom-[1px] after:h-[3px] after:bg-white md:h-14 md:px-2 md:text-base"
          >
            Appreciations
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
