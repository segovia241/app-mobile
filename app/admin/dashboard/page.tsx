"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, BookOpen, School, Loader2 } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { getEstudiantes } from "@/lib/api/estudiantes"
import { getProfesores } from "@/lib/api/profesores"
import { getMaterias } from "@/lib/api/materias"
import { getAulas } from "@/lib/api/aulas"

export default function AdminDashboard() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    estudiantes: 0,
    profesores: 0,
    materias: 0,
    aulas: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const [estudiantes, profesores, materias, aulas] = await Promise.all([
          getEstudiantes(),
          getProfesores(),
          getMaterias(),
          getAulas(),
        ])

        setStats({
          estudiantes: estudiantes.length,
          profesores: profesores.length,
          materias: materias.length,
          aulas: aulas.length,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar estadísticas")
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando estadísticas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <h2 className="font-bold">Error al cargar estadísticas</h2>
        <p>{error}</p>
      </div>
    )
  }

  const statsData = [
    {
      title: "Total Alumnos",
      value: stats.estudiantes.toString(),
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Total Docentes",
      value: stats.profesores.toString(),
      icon: <UserPlus className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Materias",
      value: stats.materias.toString(),
      icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Salones",
      value: stats.aulas.toString(),
      icon: <School className="h-4 w-4 text-muted-foreground" />,
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Panel de Control</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del Sistema</CardTitle>
          <CardDescription>Bienvenido al panel de administración de Emoggy!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            Utilice la navegación {isMobile ? "inferior" : "lateral"} para acceder a las diferentes secciones del
            sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
