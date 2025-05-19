"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Users, UserPlus, Home, Clock, ClipboardList, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setOpen(false)
  }

  const navItems = [
    { id: "students", label: "Alumnos", icon: Users },
    { id: "teachers", label: "Docentes", icon: UserPlus },
    { id: "subjects", label: "Materias", icon: BookOpen },
    { id: "classrooms", label: "Salones", icon: Home },
    { id: "schedules", label: "Horarios", icon: Clock },
    { id: "attendance", label: "Asistencias", icon: ClipboardList },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 sm:w-72">
        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center gap-2">
            <Logo showText={true} size={28} />
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn("justify-start", activeTab === item.id && "bg-muted font-medium")}
                  onClick={() => handleTabChange(item.id)}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
