import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative h-28 w-28 mb-4 flex items-center justify-center">
            <Logo showText={false} size={100} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Emoggy<span className="text-primary">!</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Gestión administrativa para academias</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Link href="/login" className="w-full">
                <Button className="w-full" size="lg">
                  Iniciar Sesión
                </Button>
              </Link>
              <div className="text-center text-sm text-muted-foreground">
                <p>© 2025 Emoggy! Todos los derechos reservados.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
