"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, ClipboardList, Loader2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchAPI } from "@/lib/api/config"

interface Profesor {
  id: number
  usuario_id: number
  nombres: string
  apellidos: string
  email: string
  especialidad?: string
}

interface Materia {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  creditos: number
}

interface Curso {
  id: number
  profesor_id: number
  materia_id: number
  periodo_id: number
  horario: string
  dias_semana: string
  aula_id: number
  materia?: Materia
}

interface Asistencia {
  id: number
  curso_id: number
  estudiante_id: number
  fecha: string
  estado: string
}

export default function TeacherDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profesor, setProfesor] = useState<Profesor | null>(null)
  const [dashboardData, setDashboardData] = useState({
    materiasCount: 0,
    alumnosCount: 0,
    clasesSemanales: 0,
    asistenciasPendientes: 0,
    proximasClases: [] as any[],
    actividadesPendientes: [] as any[],
  })
  const { toast } = useToast()

  // Cargar datos del usuario desde localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error)
      }
    }

    loadUserData()
  }, [])

  // Cargar datos del profesor y del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // 1. Obtener el profesor asociado al usuario actual
        const profesores = await fetchAPI(`profesores?usuario_id=eq.${user.id}&select=*`)

        if (!profesores || profesores.length === 0) {
          throw new Error(`No se encontró el profesor asociado al usuario con ID ${user.id}`)
        }

        const profesorData = profesores[0]
        setProfesor(profesorData)

        // 2. Obtener los cursos asignados al profesor
        const cursos = await fetchAPI(`cursos?profesor_id=eq.${profesorData.id}&select=*,materia:materias(*)`)

        // 3. Obtener las inscripciones de estudiantes en estos cursos
        const cursosIds = cursos.map((c: Curso) => c.id)
        let inscripciones: any[] = []

        if (cursosIds.length > 0) {
          // Construir la consulta para obtener inscripciones de todos los cursos del profesor
          const cursosQuery = cursosIds.map((id: number) => `curso_id.eq.${id}`).join(",")
          inscripciones = await fetchAPI(`inscripciones_cursos?or=(${cursosQuery})&select=*`)
        }

        // Contar estudiantes únicos
        const estudiantesUnicos = new Set(inscripciones.map((i: any) => i.estudiante_id))
        const totalEstudiantes = estudiantesUnicos.size

        // 3. Obtener las asistencias
        const today = new Date().toISOString().split("T")[0]
        const asistencias = await fetchAPI(`asistencia?fecha=eq.${today}&select=*`)

        // Calcular asistencias pendientes
        // Asumimos que cada curso para hoy debería tener una asistencia registrada
        const diaSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][
          new Date().getDay()
        ]
        const cursosHoy = cursos.filter((c: Curso) => c.dias_semana.includes(diaSemana))

        // Verificar cuáles no tienen asistencia registrada
        const asistenciasPendientes = cursosHoy.filter((curso: Curso) => {
          return !asistencias.some((a: Asistencia) => a.curso_id === curso.id)
        })

        // Preparar próximas clases para hoy
        const proximasClases = cursosHoy
          .sort((a: Curso, b: Curso) => a.horario.localeCompare(b.horario))
          .slice(0, 3)
          .map((c: Curso) => {
            return {
              materia: c.materia?.nombre || "Desconocida",
              aula: `Aula ${c.aula_id}`,
              horario: c.horario,
              grupo: "Grupo A", // En una aplicación real, esto vendría de la API
            }
          })

        // Actividades pendientes
        const actividadesPendientes = [
          {
            tipo: "danger",
            nombre: "Registrar asistencia",
            materia:
              asistenciasPendientes.length > 0 ? asistenciasPendientes[0].materia?.nombre || "Pendiente" : "Pendiente",
          },
          {
            tipo: "warning",
            nombre: "Calificar exámenes",
            materia: cursos.length > 0 ? cursos[0].materia?.nombre || "Pendiente" : "Pendiente",
          },
          {
            tipo: "success",
            nombre: "Preparar material",
            materia: cursos.length > 1 ? cursos[1].materia?.nombre || "Pendiente" : "Pendiente",
          },
        ]

        setDashboardData({
          materiasCount: cursos.length,
          alumnosCount: totalEstudiantes,
          clasesSemanales: cursos.reduce((total: number, curso: Curso) => {
            // Contar cuántos días a la semana tiene clases
            const diasArray = curso.dias_semana.split(",").map((d) => d.trim())
            return total + diasArray.length
          }, 0),
          asistenciasPendientes: asistenciasPendientes.length,
          proximasClases,
          actividadesPendientes,
        })

        setError(null)
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err)
        setError("Error al cargar los datos del dashboard")
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del dashboard",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadDashboardData()
    }
  }, [user, toast])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <h2 className="font-bold">Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Docente</h2>
        <p className="text-muted-foreground">
          Bienvenido, {profesor?.nombres || "Docente"} {profesor?.apellidos || ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materias Asignadas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.materiasCount}</div>
            <p className="text-xs text-muted-foreground">Materias activas este semestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumnos Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.alumnosCount}</div>
            <p className="text-xs text-muted-foreground">Alumnos en todas tus clases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clases Semanales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.clasesSemanales}</div>
            <p className="text-xs text-muted-foreground">Horas de clase programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencias Pendientes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.asistenciasPendientes}</div>
            <p className="text-xs text-muted-foreground">Registros por completar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Próximas Clases</CardTitle>
            <CardDescription>Tus clases programadas para hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.proximasClases.length > 0 ? (
                dashboardData.proximasClases.map((clase, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{clase.materia}</p>
                      <p className="text-sm text-muted-foreground">{clase.aula}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{clase.horario}</p>
                      <p className="text-sm text-muted-foreground">{clase.grupo}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No hay clases programadas para hoy</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Actividades Pendientes</CardTitle>
            <CardDescription>Tareas que requieren tu atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.actividadesPendientes.map((actividad, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        actividad.tipo === "danger"
                          ? "bg-red-500"
                          : actividad.tipo === "warning"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                    ></div>
                    <p className="font-medium">{actividad.nombre}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{actividad.materia}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
