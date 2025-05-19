"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import { fetchAPI } from "@/lib/api/config"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState("admin")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // ✔️ Acceso especial para admin/admin
      if (username === "admin" && password === "admin" && userType === "admin") {
        const adminUser = {
          id: 0,
          username: "admin",
          role: "admin",
          firstName: "Super",
          lastName: "Admin",
        }

        localStorage.setItem("user", JSON.stringify(adminUser))

        router.push("/admin/dashboard")

        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido, Super Admin`,
        })

        return // Importante: detener el flujo aquí
      }

      // ✔️ Acceso especial para profesor/profesor
      if (username === "profesor" && password === "profesor" && userType === "teacher") {
        const teacherUser = {
          id: 1,
          username: "profesor",
          role: "teacher", // Mantener "teacher" para consistencia interna
          firstName: "Profesor",
          lastName: "Demo",
        }

        localStorage.setItem("user", JSON.stringify(teacherUser))

        router.push("/teacher/dashboard")

        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido, Profesor Demo`,
        })

        return // Importante: detener el flujo aquí
      }

      // Verificar credenciales contra la API
      const response = await fetchAPI(
        `usuarios?username=eq.${encodeURIComponent(username)}&select=id,username,password,role,email`,
      )

      if (response.length === 0) {
        setError("Usuario no encontrado")
        toast({
          title: "Error",
          description: "Usuario no encontrado",
          variant: "destructive",
        })
        return
      }

      const user = response[0]

      // Validar contraseña (solo texto plano en este ejemplo)
      if (user.password !== password) {
        setError("Contraseña incorrecta")
        toast({
          title: "Error",
          description: "Contraseña incorrecta",
          variant: "destructive",
        })
        return
      }

      // Verificar el rol según la pestaña seleccionada
      // Importante: Manejar tanto "teacher" como "profesor" para compatibilidad
      const isTeacher = user.role === "teacher" || user.role === "profesor"

      if (userType === "admin" && user.role !== "admin") {
        setError("No tienes permisos de administrador")
        toast({
          title: "Error",
          description: "No tienes permisos de administrador",
          variant: "destructive",
        })
        return
      }

      if (userType === "teacher" && !isTeacher) {
        setError("No tienes permisos de docente")
        toast({
          title: "Error",
          description: "No tienes permisos de docente",
          variant: "destructive",
        })
        return
      }

      // Actualizar la última fecha de inicio de sesión
      try {
        await fetchAPI(`usuarios?id=eq.${user.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            updated_at: new Date().toISOString(),
          }),
        })
      } catch (updateErr) {
        console.error("Error al actualizar la fecha de último inicio de sesión:", updateErr)
      }

      // Si es un docente, obtener información adicional
      let firstName = ""
      let lastName = ""

      if (isTeacher) {
        try {
          const profesorData = await fetchAPI(`profesores?usuario_id=eq.${user.id}`)
          if (profesorData && profesorData.length > 0) {
            firstName = profesorData[0].nombres || ""
            lastName = profesorData[0].apellidos || ""
          }
        } catch (err) {
          console.error("Error al obtener datos del profesor:", err)
          // Si no se pueden obtener los datos del profesor, usar valores por defecto
          firstName = "Docente"
          lastName = user.username
        }
      }

      // Guardar sesión del usuario con role normalizado a "teacher" para profesores
      const userData = {
        id: user.id,
        username: user.username,
        // Normalizar el rol para uso interno: siempre usar "admin" o "teacher"
        role: isTeacher ? "teacher" : user.role,
        firstName: firstName,
        lastName: lastName,
        email: user.email,
      }

      localStorage.setItem("user", JSON.stringify(userData))

      // Redirigir según el rol
      if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else if (isTeacher) {
        // Asegurarse de que la redirección funcione para profesores
        console.log("Redirigiendo a profesor:", userData)
        router.push("/teacher/dashboard")
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${firstName || user.username} ${lastName || ""}`,
      })
    } catch (err) {
      console.error("Error durante el inicio de sesión:", err)
      setError("Error al conectar con el servidor")
      toast({
        title: "Error",
        description: "Error al conectar con el servidor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
          <ThemeToggle />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col items-center justify-center">
              <Logo size={60} className="mb-4" />
              <CardTitle className="text-center text-2xl">Iniciar Sesión</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" onValueChange={setUserType}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="admin">Administrativo</TabsTrigger>
                <TabsTrigger value="teacher">Docente</TabsTrigger>
              </TabsList>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
