"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, ClipboardList, Home, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  // Verificar autenticación y rol
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem("user")
        if (!userData) {
          console.log("No hay sesión de usuario")
          router.push("/login")
          return
        }

        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        if (parsedUser.role !== "teacher") {
          console.log("Usuario no es docente:", parsedUser.role)
          router.push("/login")
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  // Si no hay usuario o está verificando, mostrar pantalla de carga
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/teacher/dashboard" },
    { id: "subjects", label: "Mis Materias", icon: BookOpen, path: "/teacher/subjects" },
    { id: "attendance", label: "Asistencias", icon: ClipboardList, path: "/teacher/attendance" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Enlace para saltar al contenido principal (accesibilidad) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Saltar al contenido principal
      </a>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 z-[80] bg-background border-r">
        <div className="flex flex-col flex-grow pt-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-4">
            <Logo href="/teacher/dashboard" showText={true} size={28} />
          </div>
          <nav className="flex-1 px-2 pb-4 space-y-1" aria-label="Navegación principal">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path

              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                    isActive ? "bg-primary/10 text-primary" : "text-foreground/60 hover:bg-accent hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center p-3 border-t">
            <Button
              variant="ghost"
              className="flex items-center text-xs text-foreground/60 hover:text-foreground w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header and Content */}
      <div className="flex flex-1 flex-col md:pl-56">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background px-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="mobile-sidebar"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <div className="flex-1 flex items-center">
            <Logo showText={false} size={24} className="md:hidden" />
            <h1 className="text-sm font-medium truncate ml-2">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : "Docente"}
            </h1>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              aria-label="Cerrar sesión"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </div>
        </header>
        <main id="main-content" className="flex-1 p-3 pb-6 sm:p-4">
          {children}
        </main>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[240px] p-0" id="mobile-sidebar" aria-label="Menú de navegación">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-3 border-b">
                <Logo href="/teacher/dashboard" showText={true} size={24} onClick={() => setOpen(false)} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3" aria-label="Navegación móvil">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.path

                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      className={`flex items-center gap-2 mx-2 px-3 py-2 rounded-md ${
                        isActive ? "bg-primary/10 text-primary" : "text-foreground/60 hover:bg-accent"
                      }`}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              <div className="border-t p-3">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground w-full justify-start"
                  onClick={() => {
                    handleLogout()
                    setOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
