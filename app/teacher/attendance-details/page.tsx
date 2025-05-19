"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Calendar, Clock, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchAPI } from "@/lib/api/config"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function AttendanceDetails() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseId, setCourseId] = useState<number | null>(null)
  const [courseData, setCourseData] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [attendanceByDate, setAttendanceByDate] = useState<{ [key: string]: any[] }>({})

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = () => {
      try {
        const selectedCourseId = localStorage.getItem("selectedCourseId")

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

    loadInitialData()
  }, [])

  // Cargar datos del curso y asistencias
  useEffect(() => {
    const loadCourseData = async () => {
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
          `inscripciones_cursos?curso_id=eq.${courseId}&select=*,estudiante:estudiantes(id,usuario:usuarios(id,first_name,last_name))`,
        )

        // Obtener registros de asistencia para este curso
        const asistencias = await fetchAPI(`asistencia?curso_id=eq.${courseId}&select=*&order=fecha.desc,hora.desc`)

        // Enriquecer los registros de asistencia con información del estudiante
        const registrosEnriquecidos = asistencias.map((asistencia: any) => {
          const inscripcion = inscripciones.find((i: any) => i.estudiante_id === asistencia.estudiante_id)
          return {
            ...asistencia,
            nombre_estudiante: inscripcion?.estudiante?.usuario
              ? `${inscripcion.estudiante.usuario.first_name} ${inscripcion.estudiante.usuario.last_name}`
              : `Estudiante ${asistencia.estudiante_id}`,
          }
        })

        setAttendanceRecords(registrosEnriquecidos)

        // Agrupar por fecha
        const porFecha: { [key: string]: any[] } = {}
        registrosEnriquecidos.forEach((registro: any) => {
          if (!porFecha[registro.fecha]) {
            porFecha[registro.fecha] = []
          }
          porFecha[registro.fecha].push(registro)
        })

        setAttendanceByDate(porFecha)
        setError(null)
      } catch (err) {
        console.error("Error al cargar datos del curso:", err)
        setError("Error al cargar datos del curso y asistencias")
      } finally {
        setLoading(false)
      }
    }

    loadCourseData()
  }, [courseId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "presente":
        return <Badge className="bg-green-500 text-xs">Presente</Badge>
      case "ausente":
        return <Badge className="bg-red-500 text-xs">Ausente</Badge>
      case "tarde":
        return <Badge className="bg-yellow-500 text-xs">Tarde</Badge>
      case "justificado":
        return <Badge className="bg-blue-500 text-xs">Justificado</Badge>
      default:
        return <Badge className="text-xs">{status}</Badge>
    }
  }

  const handleBack = () => {
    router.push("/teacher/attendance")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
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
        <h2 className="text-lg font-bold tracking-tight">Detalles</h2>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{courseData?.materia?.nombre || "Curso"}</CardTitle>
          <div className="flex flex-wrap gap-2 text-xs mt-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{courseData?.horario || ""}</span>
            </div>
            <div className="text-muted-foreground">{courseData?.aula?.nombre || `Aula ${courseData?.aula_id}`}</div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(attendanceByDate).length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs">Sin registros</AlertTitle>
              <AlertDescription className="text-xs">No hay registros de asistencia para este curso.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {Object.entries(attendanceByDate).map(([fecha, registros]) => (
                <div key={fecha} className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">{format(new Date(fecha), "PPP", { locale: es })}</h3>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs py-1">Alumno</TableHead>
                          <TableHead className="text-xs py-1">Estado</TableHead>
                          <TableHead className="text-xs py-1">Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registros.map((registro) => (
                          <TableRow key={registro.id}>
                            <TableCell className="text-xs py-1">{registro.nombre_estudiante}</TableCell>
                            <TableCell className="text-xs py-1">{getStatusBadge(registro.estado)}</TableCell>
                            <TableCell className="text-xs py-1">
                              {registro.hora ? registro.hora.substring(0, 5) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
