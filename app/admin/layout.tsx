"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/students",
      label: "Alumnos",
      icon: Users,
    },
    {
      href: "/admin/teachers",
      label: "Docentes",
      icon: UserPlus,
    },
    {
      href: "/admin/subjects",
      label: "Materias",
      icon: BookOpen,
    },
    {
      href: "/admin/classrooms",
      label: "Salones",
      icon: School,
    },
    {
      href: "/admin/sessions",
      label: "Sesiones",
      icon: Calendar,
    },
    {
      href: "/admin/attendance",
      label: "Asistencias",
      icon: ClipboardList,
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80] bg-background border-r">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <Logo href="/admin/dashboard" showText={true} size={32} />
          </div>
          <nav className="flex-1 px-2 pb-4 space-y-1" aria-label="Navegación principal">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive ? "bg-primary/10 text-primary" : "text-foreground/60 hover:bg-accent hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center p-4 border-t">
            <Link href="/login" className="flex items-center text-sm text-foreground/60 hover:text-foreground">
              <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
              Cerrar sesión
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Header and Content */}
      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="mobile-sidebar"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <div className="flex-1 flex items-center">
            <Logo showText={true} size={24} className="md:hidden" />
            <h1 className="text-lg font-semibold ml-2">Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </Link>
          </div>
        </header>
        <main id="main-content" className="flex-1 p-4 pb-6 sm:p-6">
          {children}
        </main>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            className="w-[240px] sm:w-[300px] pr-0 p-0"
            id="mobile-sidebar"
            aria-label="Menú de navegación"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <Logo href="/admin/dashboard" showText={true} size={28} onClick={() => setOpen(false)} />
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar menú">
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto py-4" aria-label="Navegación móvil">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 mx-2 px-3 py-3 rounded-md ${
                        isActive ? "bg-primary/10 text-primary" : "text-foreground/60 hover:bg-accent"
                      }`}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
              <div className="border-t p-4">
                <Link
                  href="/login"
                  className="flex items-center gap-3 text-sm text-foreground/60 hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                  Cerrar sesión
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
