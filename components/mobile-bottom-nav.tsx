"use client"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Logo } from "@/components/logo"

// Este componente ya no se usa, la funcionalidad se ha movido al layout
export function MobileBottomNav() {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background">
      <div className="flex h-14 items-center justify-around">
        <Logo showText={false} size={24} className="md:hidden" />
        {/* Resto del contenido */}
      </div>
    </div>
  )
}
