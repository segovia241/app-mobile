"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CalendarPlus, History, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchAPI } from "@/lib/api/config"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Curso {
  id: number
  materia_id: number
  profesor_id: number
  horario: string
  dias_semana: string
  aula_id: number
  materia?: {
    id: number
    nombre: string
    codigo: string
  }
  aula?: {
    id: number
    nombre: string
    codigo: string
  }
}

interface Asistencia {
  id: number
  curso_id: number
  estudiante_id: number
  fecha: string
  estado: string
  comentario?: string
  estudiante?: {
    id: number
    nombres: string
    apellidos: string
  }
}

export default function TeacherAttendance() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<Curso[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<{ [key: number]: { [key: string]: Asistencia[] } }>({})
  const [selectedCourse, setSelectedCourse] = useState<Curso | null>(null)
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [attendanceDetails, setAttendanceDetails] = useState<Asistencia[]>([])
  const isMobile = window.innerWidth < 768

  // Cargar datos iniciales
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error)
        setError("Error al cargar datos del usuario")
      }
    }

    loadUserData()
  }, [])

  // Cargar cursos del profesor
  useEffect(() => {
    const loadCourses = async () => {
      if (!user || !user.id) return

      try {
        setLoading(true)

        // Obtener el ID del profesor basado en el usuario
        const profesores = await fetchAPI(`profesores?usuario_id=eq.${user.id}`)

        if (!profesores || profesores.length === 0) {
          throw new Error("No se encontró el perfil de profesor para este usuario")
        }

        const profesorId = profesores[0].id

        // Obtener cursos asignados al profesor
        const cursos = await fetchAPI(`cursos?profesor_id=eq.${profesorId}&select=*,materia:materias(*),aula:aulas(*)`)

        setCourses(cursos || [])

        // Cargar historial de asistencia para cada curso
        const historialPorCurso: { [key: number]: { [key: string]: Asistencia[] } } = {}

        for (const curso of cursos) {
          const asistencias = await fetchAPI(
            `asistencia?curso_id=eq.${curso.id}&select=*,estudiante:estudiantes(id,nombres,apellidos)&order=fecha.desc`,
          )

          // Agrupar por fecha
          const asistenciasPorFecha: { [key: string]: Asistencia[] } = {}
          asistencias.forEach((asistencia: Asistencia) => {
            if (!asistenciasPorFecha[asistencia.fecha]) {
              asistenciasPorFecha[asistencia.fecha] = []
            }
            asistenciasPorFecha[asistencia.fecha].push(asistencia)
          })

          historialPorCurso[curso.id] = asistenciasPorFecha
        }

        setAttendanceHistory(historialPorCurso)
        setError(null)
      } catch (err) {
        console.error("Error al cargar cursos:", err)
        setError("Error al cargar los cursos asignados")
        toast({
          title: "Error",
          description: "No se pudieron cargar los cursos asignados",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadCourses()
    }
  }, [user, toast])

  const handleRegisterAttendance = (course: Curso) => {
    try {
      // Guardar el ID del curso seleccionado en localStorage
      localStorage.setItem("selectedCourseId", course.id.toString())

      // Navegar a la página de registro de asistencia
      router.push("/teacher/register-attendance")
    } catch (error) {
      console.error("Error al seleccionar curso:", error)
      toast({
        title: "Error",
        description: "No se pudo seleccionar el curso",
        variant: "destructive",
      })
    }
  }

  const handleViewHistory = (course: Curso) => {
    try {
      // Guardar el ID del curso seleccionado en localStorage
      localStorage.setItem("selectedCourseId", course.id.toString())

      // Navegar a la página de historial de asistencia
      router.push("/teacher/attendance-history")
    } catch (error) {
      console.error("Error al seleccionar curso:", error)
      toast({
        title: "Error",
        description: "No se pudo seleccionar el curso",
        variant: "destructive",
      })
    }
  }

  const handleViewAttendanceDetails = (course: Curso, date: string) => {
    setSelectedCourse(course)
    setSelectedDate(date)

    // Obtener los detalles de asistencia para esta fecha y curso
    const attendanceForDate = attendanceHistory[course.id]?.[date] || []
    setAttendanceDetails(attendanceForDate)

    setShowAttendanceDetails(true)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Presente":
        return <Badge className="bg-green-500">Presente</Badge>
      case "Ausente":
        return <Badge className="bg-red-500">Ausente</Badge>
      case "Tardanza":
        return <Badge className="bg-yellow-500">Tardanza</Badge>
      case "Justificado":
        return <Badge className="bg-blue-500">Justificado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getHoraFromComentario = (comentario: string | undefined) => {
    if (!comentario) return "N/A"

    const match = comentario.match(/Hora: (\d{2}:\d{2}(?::\d{2})?)/)
    return match ? match[1] : "N/A"
  }

  const getAttendanceStats = (asistencias: Asistencia[]) => {
    const total = asistencias.length
    const presentes = asistencias.filter((a) => a.estado === "Presente").length
    const ausentes = asistencias.filter((a) => a.estado === "Ausente").length
    const tardanzas = asistencias.filter((a) => a.estado === "Tardanza").length
    const justificados = asistencias.filter((a) => a.estado === "Justificado").length

    return {
      total,
      presentes,
      ausentes,
      tardanzas,
      justificados,
      porcentajePresentes: total > 0 ? Math.round((presentes / total) * 100) : 0,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando cursos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight">Asistencia</h2>

      {courses.length === 0 ? (
        <Alert>
          <AlertTitle>Sin cursos asignados</AlertTitle>
          <AlertDescription>No tiene cursos asignados para registrar asistencia.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{course.materia?.nombre || `Curso ${course.id}`}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  <div className="whitespace-normal break-words">
                    {course.horario} - {course.dias_semana}
                  </div>
                  <div>{course.aula?.nombre || `Aula ${course.aula_id}`}</div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => handleRegisterAttendance(course)} className="w-full text-sm py-1.5">
                      <CalendarPlus className="h-4 w-4 mr-1.5" />
                      Registrar Asistencia
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleViewHistory(course)}
                      className="w-full text-sm py-1.5"
                    >
                      <History className="h-4 w-4 mr-1.5" />
                      Ver Historial
                    </Button>
                  </div>

                  {/* Mostrar últimas asistencias registradas */}
                  {attendanceHistory[course.id] && Object.keys(attendanceHistory[course.id]).length > 0 ? (
                    <div>
                      <h4 className="text-xs font-medium mb-1.5">Últimas asistencias:</h4>
                      <div className="border rounded-md overflow-hidden">
                        <div className="divide-y">
                          {Object.keys(attendanceHistory[course.id])
                            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                            .slice(0, 3)
                            .map((fecha) => {
                              const asistencias = attendanceHistory[course.id][fecha]
                              const stats = getAttendanceStats(asistencias)

                              return (
                                <div key={fecha} className="p-2 flex justify-between items-center">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium">
                                      {format(new Date(fecha), "dd/MM/yy", { locale: es })}
                                    </span>
                                    <div className="flex items-center space-x-1 text-xs">
                                      <span className="text-green-600">{stats.presentes}</span>
                                      <span className="text-yellow-600">{stats.tardanzas}</span>
                                      <span className="text-red-600">{stats.ausentes}</span>
                                      <span className="text-blue-600">{stats.justificados}</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleViewAttendanceDetails(course, fecha)}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No hay registros de asistencia para este curso.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para ver detalles de asistencia */}
      <Dialog open={showAttendanceDetails} onOpenChange={setShowAttendanceDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedCourse?.materia?.nombre || "Curso"} -{" "}
              {selectedDate ? format(new Date(selectedDate), "dd/MM/yyyy", { locale: es }) : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Estudiante</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs text-right">Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceDetails
                    .sort((a, b) => {
                      const nombreA = a.estudiante ? `${a.estudiante.apellidos} ${a.estudiante.nombres}` : ""
                      const nombreB = b.estudiante ? `${b.estudiante.apellidos} ${b.estudiante.nombres}` : ""
                      return nombreA.localeCompare(nombreB)
                    })
                    .map((asistencia) => (
                      <TableRow key={asistencia.id}>
                        <TableCell className="text-xs py-2">
                          {asistencia.estudiante
                            ? `${asistencia.estudiante.nombres} ${asistencia.estudiante.apellidos}`
                            : `Estudiante ${asistencia.estudiante_id}`}
                        </TableCell>
                        <TableCell className="text-xs py-2">{getEstadoBadge(asistencia.estado)}</TableCell>
                        <TableCell className="text-xs py-2 text-right">
                          {getHoraFromComentario(asistencia.comentario)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowAttendanceDetails(false)}>
                Cerrar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedCourse) {
                    handleRegisterAttendance(selectedCourse)
                  }
                }}
              >
                Editar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
