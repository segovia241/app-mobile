"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Calendar, Clock, Loader2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchAPI } from "@/lib/api/config"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Asistencia {
  id: number
  curso_id: number
  estudiante_id: number
  fecha: string
  estado: string
  hora?: string
  estudiante?: {
    id: number
    nombres: string
    apellidos: string
  }
  comentario?: string
}

interface EstadisticaEstudiante {
  id: number
  nombre: string
  presente: number
  ausente: number
  tarde: number
  total: number
  porcentajeAsistencia: number
}

export default function AttendanceHistory() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [courseId, setCourseId] = useState<number | null>(null)
  const [courseData, setCourseData] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: Asistencia[] }>({})
  const [students, setStudents] = useState<any[]>([])
  const [statistics, setStatistics] = useState<{
    totalClases: number
    porPresente: number
    porAusente: number
    porTarde: number
    porEstudiante: EstadisticaEstudiante[]
  }>({
    totalClases: 0,
    porPresente: 0,
    porAusente: 0,
    porTarde: 0,
    porEstudiante: [],
  })

  // Cargar datos iniciales
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem("user")
        const selectedCourseId = localStorage.getItem("selectedCourseId")

        if (userData) {
          setUser(JSON.parse(userData))
        }

        if (selectedCourseId) {
          setCourseId(Number.parseInt(selectedCourseId))
        } else {
          setError("No se ha seleccionado ningún curso")
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError("Error al cargar datos iniciales")
      }
    }

    loadUserData()
  }, [])

  // Cargar datos del curso y asistencias
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!courseId) return

      try {
        setLoading(true)

        // Obtener datos del curso
        const curso = await fetchAPI(`cursos?id=eq.${courseId}&select=*,materia:materias(*),aula:aulas(*)`)

        if (!curso || curso.length === 0) {
          throw new Error(`No se encontró el curso con ID ${courseId}`)
        }

        setCourseData(curso[0])

        // Obtener estudiantes inscritos en el curso
        const inscripciones = await fetchAPI(
          `inscripciones_cursos?curso_id=eq.${courseId}&select=*,estudiante:estudiantes(id,nombres,apellidos)`,
        )

        const estudiantesData = inscripciones.map((inscripcion: any) => ({
          id: inscripcion.estudiante_id,
          nombre: inscripcion.estudiante
            ? `${inscripcion.estudiante.nombres} ${inscripcion.estudiante.apellidos}`
            : `Estudiante ${inscripcion.estudiante_id}`,
          estudiante: inscripcion.estudiante,
        }))

        setStudents(estudiantesData)

        // Obtener registros de asistencia
        const asistencias = await fetchAPI(
          `asistencia?curso_id=eq.${courseId}&select=*,estudiante:estudiantes(id,nombres,apellidos)&order=fecha.desc,estudiante_id.asc`,
        )

        // Agrupar asistencias por fecha
        const asistenciasPorFecha: { [key: string]: Asistencia[] } = {}

        asistencias.forEach((asistencia: Asistencia) => {
          if (!asistenciasPorFecha[asistencia.fecha]) {
            asistenciasPorFecha[asistencia.fecha] = []
          }
          asistenciasPorFecha[asistencia.fecha].push(asistencia)
        })

        setAttendanceRecords(asistenciasPorFecha)

        // Calcular estadísticas
        const totalClases = Object.keys(asistenciasPorFecha).length

        // Contar estados
        let totalPresente = 0
        let totalAusente = 0
        let totalTarde = 0
        let totalRegistros = 0

        // Estadísticas por estudiante
        const estadisticasPorEstudiante: { [key: number]: { presente: number; ausente: number; tarde: number } } = {}

        // Inicializar contadores para cada estudiante
        estudiantesData.forEach((est) => {
          estadisticasPorEstudiante[est.id] = { presente: 0, ausente: 0, tarde: 0 }
        })

        // Contar asistencias
        Object.values(asistenciasPorFecha).forEach((asistenciasDia) => {
          asistenciasDia.forEach((asistencia) => {
            totalRegistros++

            if (asistencia.estado === "Presente") {
              totalPresente++
              if (estadisticasPorEstudiante[asistencia.estudiante_id]) {
                estadisticasPorEstudiante[asistencia.estudiante_id].presente++
              }
            } else if (asistencia.estado === "Ausente") {
              totalAusente++
              if (estadisticasPorEstudiante[asistencia.estudiante_id]) {
                estadisticasPorEstudiante[asistencia.estudiante_id].ausente++
              }
            } else if (asistencia.estado === "Tardanza") {
              totalTarde++
              if (estadisticasPorEstudiante[asistencia.estudiante_id]) {
                estadisticasPorEstudiante[asistencia.estudiante_id].tarde++
              }
            } else if (asistencia.estado === "Justificado") {
              // Consideramos justificado como presente para las estadísticas
              totalPresente++
              if (estadisticasPorEstudiante[asistencia.estudiante_id]) {
                estadisticasPorEstudiante[asistencia.estudiante_id].presente++
              }
            }
          })
        })

        // Calcular porcentajes
        const porPresente = totalRegistros > 0 ? (totalPresente / totalRegistros) * 100 : 0
        const porAusente = totalRegistros > 0 ? (totalAusente / totalRegistros) * 100 : 0
        const porTarde = totalRegistros > 0 ? (totalTarde / totalRegistros) * 100 : 0

        // Calcular estadísticas por estudiante
        const estPorEstudiante: EstadisticaEstudiante[] = estudiantesData.map((est) => {
          const stats = estadisticasPorEstudiante[est.id]
          const total = stats.presente + stats.ausente + stats.tarde
          return {
            id: est.id,
            nombre: est.nombre,
            presente: stats.presente,
            ausente: stats.ausente,
            tarde: stats.tarde,
            total,
            porcentajeAsistencia: total > 0 ? ((stats.presente + stats.tarde) / total) * 100 : 0,
          }
        })

        setStatistics({
          totalClases,
          porPresente,
          porAusente,
          porTarde,
          porEstudiante: estPorEstudiante,
        })

        setError(null)
      } catch (err) {
        console.error("Error al cargar datos de asistencia:", err)
        setError("Error al cargar el historial de asistencia")
        toast({
          title: "Error",
          description: "No se pudo cargar el historial de asistencia",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      loadAttendanceData()
    }
  }, [courseId, toast])

  const handleBack = () => {
    router.push("/teacher/attendance")
  }

  // Modificar la función que extrae la hora del comentario
  const getHoraFromComentario = (comentario: string | undefined) => {
    if (!comentario) return "N/A"

    const match = comentario.match(/Hora: (\d{2}:\d{2}(?::\d{2})?)/)
    return match ? match[1] : "N/A"
  }

  // Actualizar la función que muestra los estados de asistencia
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Presente":
        return <Badge className="bg-green-500 text-xs">P</Badge>
      case "Ausente":
        return <Badge className="bg-red-500 text-xs">A</Badge>
      case "Tardanza":
        return <Badge className="bg-yellow-500 text-xs">T</Badge>
      case "Justificado":
        return <Badge className="bg-blue-500 text-xs">J</Badge>
      default:
        return <Badge className="bg-gray-500 text-xs">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando historial...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" className="mt-4" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Button variant="outline" size="sm" className="mr-2" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h2 className="text-lg font-bold tracking-tight">Historial</h2>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{courseData?.materia?.nombre || "Curso"}</CardTitle>
          <div className="flex flex-wrap gap-2 text-xs mt-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{courseData?.horario || ""}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{courseData?.dias_semana || ""}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{students.length} alumnos</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history">
            <TabsList className="mb-3 w-full">
              <TabsTrigger value="history" className="text-xs flex-1">
                Historial
              </TabsTrigger>
              <TabsTrigger value="statistics" className="text-xs flex-1">
                Estadísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              {Object.keys(attendanceRecords).length === 0 ? (
                <Alert>
                  <AlertTitle className="text-xs">Sin registros</AlertTitle>
                  <AlertDescription className="text-xs">
                    No hay registros de asistencia para este curso.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {Object.keys(attendanceRecords)
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .map((fecha) => (
                      <Card key={fecha} className="overflow-hidden">
                        <CardHeader className="pb-1 bg-muted/50">
                          <CardTitle className="text-sm">
                            {format(new Date(fecha), "EEEE, d 'de' MMMM", { locale: es })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs py-1">Alumno</TableHead>
                                <TableHead className="text-xs py-1">Estado</TableHead>
                                <TableHead className="text-xs py-1 text-right">Hora</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {attendanceRecords[fecha]
                                .sort((a, b) => {
                                  const nombreA = a.estudiante
                                    ? `${a.estudiante.nombres} ${a.estudiante.apellidos}`
                                    : ""
                                  const nombreB = b.estudiante
                                    ? `${b.estudiante.nombres} ${b.estudiante.apellidos}`
                                    : ""
                                  return nombreA.localeCompare(nombreB)
                                })
                                .map((asistencia) => {
                                  const nombreEstudiante = asistencia.estudiante
                                    ? `${asistencia.estudiante.nombres} ${asistencia.estudiante.apellidos}`
                                    : students.find((s) => s.id === asistencia.estudiante_id)?.nombre ||
                                      `Estudiante ${asistencia.estudiante_id}`

                                  return (
                                    <TableRow key={asistencia.id}>
                                      <TableCell className="text-xs py-1">{nombreEstudiante}</TableCell>
                                      <TableCell className="text-xs py-1">
                                        {getStatusBadge(asistencia.estado)}
                                      </TableCell>
                                      <TableCell className="text-xs py-1 text-right">
                                        {getHoraFromComentario(asistencia.comentario)}
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="statistics">
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Resumen General</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">Total Clases</p>
                        <p className="text-lg font-bold">{statistics.totalClases}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-green-600">Presentes</p>
                        <p className="text-lg font-bold text-green-700">{statistics.porPresente.toFixed(1)}%</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-yellow-600">Tardanzas</p>
                        <p className="text-lg font-bold text-yellow-700">{statistics.porTarde.toFixed(1)}%</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-red-600">Ausencias</p>
                        <p className="text-lg font-bold text-red-700">{statistics.porAusente.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Asistencia por Estudiante</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {statistics.porEstudiante
                        .sort((a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia)
                        .map((est) => (
                          <div key={est.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium line-clamp-1">{est.nombre}</span>
                              <span
                                className={`text-xs font-medium ${
                                  est.porcentajeAsistencia >= 80
                                    ? "text-green-600"
                                    : est.porcentajeAsistencia >= 60
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }`}
                              >
                                {est.porcentajeAsistencia.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={est.porcentajeAsistencia}
                              className={`h-1.5 ${
                                est.porcentajeAsistencia >= 80
                                  ? "bg-green-100"
                                  : est.porcentajeAsistencia >= 60
                                    ? "bg-yellow-100"
                                    : "bg-red-100"
                              }`}
                              indicatorClassName={
                                est.porcentajeAsistencia >= 80
                                  ? "bg-green-500"
                                  : est.porcentajeAsistencia >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }
                            />
                            <div className="flex text-[10px] text-muted-foreground justify-between">
                              <span>P: {est.presente}</span>
                              <span>T: {est.tarde}</span>
                              <span>A: {est.ausente}</span>
                              <span>Total: {est.total}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
