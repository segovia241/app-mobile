"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Loader2, ArrowLeft, AlertCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchAPI } from "@/lib/api/config"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, isAfter } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DatePicker } from "@/components/ui/date-picker"

// Definición de tipos
interface Asistencia {
  [key: number]: string
}

interface Estudiante {
  id: number
  nombre: string
}

export default function RegisterAttendance() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [courseId, setCourseId] = useState<number | null>(null)
  const [courseData, setCourseData] = useState<any>(null)
  const [students, setStudents] = useState<Estudiante[]>([])
  const [attendance, setAttendance] = useState<Asistencia>({})
  const [showSummary, setShowSummary] = useState(false)
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null)
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [existingAttendance, setExistingAttendance] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [canEdit, setCanEdit] = useState(true)
  const [showEditWarning, setShowEditWarning] = useState(false)

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

  // Cargar datos del curso y estudiantes
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
        console.log("Datos del curso:", curso[0])

        // Obtener estudiantes inscritos en el curso
        const inscripciones = await fetchAPI(
          `inscripciones_cursos?curso_id=eq.${courseId}&select=*,estudiante:estudiantes(id,nombres,apellidos)`,
        )
        console.log("Inscripciones:", inscripciones)

        const estudiantesData = inscripciones.map((inscripcion: any) => ({
          id: inscripcion.estudiante_id,
          nombre: inscripcion.estudiante
            ? `${inscripcion.estudiante.nombres} ${inscripcion.estudiante.apellidos}`
            : `Estudiante ${inscripcion.estudiante_id}`,
        }))

        setStudents(estudiantesData)

        // Verificar si ya existe un registro de asistencia para este curso y fecha
        checkExistingAttendance(courseId, format(selectedDate, "yyyy-MM-dd"))

        setError(null)
      } catch (err) {
        console.error("Error al cargar datos del curso:", err)
        setError("Error al cargar datos del curso y estudiantes")
      } finally {
        setLoading(false)
      }
    }

    loadCourseData()
  }, [courseId, selectedDate])

  // Verificar si existe un registro de asistencia para la fecha seleccionada
  const checkExistingAttendance = async (cursoId: number, fecha: string) => {
    try {
      // Buscar registros de asistencia para este curso y fecha
      const asistencias = await fetchAPI(`asistencia?curso_id=eq.${cursoId}&fecha=eq.${fecha}&select=*`)

      if (asistencias && asistencias.length > 0) {
        console.log("Registros de asistencia existentes:", asistencias)

        // Agrupar por estudiante_id
        const asistenciasPorEstudiante: Record<number, string> = {}
        asistencias.forEach((asistencia: any) => {
          asistenciasPorEstudiante[asistencia.estudiante_id] = asistencia.estado
        })

        setAttendance(asistenciasPorEstudiante)
        setExistingAttendance(asistencias)
        setIsEditing(true)

        // Verificar si se puede editar (clase aún no termina)
        checkIfCanEdit(cursoId)
      } else {
        // No hay registros existentes, resetear el estado
        setAttendance({})
        setExistingAttendance(null)
        setIsEditing(false)
        setCanEdit(true)
      }
    } catch (err) {
      console.error("Error al verificar registros de asistencia existentes:", err)
    }
  }

  // Verificar si la clase ya terminó para determinar si se puede editar
  const checkIfCanEdit = (cursoId: number) => {
    if (!courseData) return

    try {
      // Extraer la hora de fin de la clase del horario (formato "08:00-10:00")
      const horario = courseData.horario
      if (!horario || !horario.includes("-")) {
        setCanEdit(true) // Si no hay formato válido, permitir edición por defecto
        return
      }

      const horaFin = horario.split("-")[1].trim()

      // Crear una fecha con la hora de fin para hoy
      const fechaActual = new Date()
      const [horaFinHoras, horaFinMinutos] = horaFin.split(":").map(Number)

      const fechaFinClase = new Date()
      fechaFinClase.setHours(horaFinHoras, horaFinMinutos, 0)

      // Si la fecha actual es después de la hora de fin, no se puede editar
      const puedeEditar = !isAfter(fechaActual, fechaFinClase)
      setCanEdit(puedeEditar)

      if (!puedeEditar) {
        setShowEditWarning(true)
      }
    } catch (err) {
      console.error("Error al verificar si se puede editar:", err)
      setCanEdit(true) // En caso de error, permitir edición por defecto
    }
  }

  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendance({
      ...attendance,
      [studentId]: status,
    })
  }

  const handleSaveAttendance = () => {
    // Verificar que todos los estudiantes tengan asistencia registrada
    const allStudentsHaveAttendance = students.every((student) => attendance[student.id] !== undefined)

    if (!allStudentsHaveAttendance) {
      toast({
        title: "Registro incompleto",
        description: "Debe registrar la asistencia de todos los alumnos",
        variant: "destructive",
      })
      return
    }

    // Preparar el resumen de asistencia
    const summary = {
      date: format(selectedDate, "yyyy-MM-dd"),
      subject: courseData?.materia?.nombre || "",
      subject_id: courseData?.materia_id,
      classroom: courseData?.aula?.nombre || `Aula ${courseData?.aula_id}`,
      classroom_id: courseData?.aula_id,
      schedule: courseData?.horario || "",
      course_id: courseId,
      teacher: user?.name || "",
      teacher_id: user?.id,
      students: students.map((student) => ({
        id: student.id,
        name: student.nombre,
        status: attendance[student.id] || "",
        time: format(new Date(), "HH:mm"),
      })),
      isEditing: isEditing,
    }

    setAttendanceSummary(summary)
    setShowSummary(true)
  }

  // Actualizar la función confirmSaveAttendance para incluir hora_llegada
  const confirmSaveAttendance = async () => {
    if (!user || !courseId) return

    try {
      setSavingAttendance(true)

      // Preparar los datos para guardar en la API
      const currentDate = format(selectedDate, "yyyy-MM-dd")
      const currentTime = format(new Date(), "HH:mm:ss")

      if (isEditing && existingAttendance) {
        // Actualizar registros existentes
        for (const student of attendanceSummary.students) {
          const existingRecord = existingAttendance.find((record: any) => record.estudiante_id === student.id)
          const horaComentario =
            student.status === "Tardanza" || student.status === "Presente" ? `Hora: ${student.time || currentTime}` : ""

          if (existingRecord) {
            // Actualizar registro existente
            await fetchAPI(`asistencia?id=eq.${existingRecord.id}`, {
              method: "PATCH",
              body: JSON.stringify({
                estado: student.status,
                comentario: horaComentario,
                updated_at: new Date().toISOString(),
              }),
            })
          } else {
            // Crear nuevo registro para este estudiante
            await fetchAPI("asistencia", {
              method: "POST",
              body: JSON.stringify({
                curso_id: courseId,
                estudiante_id: student.id,
                fecha: currentDate,
                estado: student.status,
                comentario: horaComentario,
              }),
            })
          }
        }
      } else {
        // Crear nuevos registros de asistencia
        for (const student of attendanceSummary.students) {
          const horaComentario =
            student.status === "Tardanza" || student.status === "Presente" ? `Hora: ${student.time || currentTime}` : ""

          await fetchAPI("asistencia", {
            method: "POST",
            body: JSON.stringify({
              curso_id: courseId,
              estudiante_id: student.id,
              fecha: currentDate,
              estado: student.status,
              comentario: horaComentario,
            }),
          })
        }
      }

      toast({
        title: isEditing ? "Asistencia actualizada" : "Asistencia guardada",
        description: `Asistencia ${isEditing ? "actualizada" : "registrada"} para ${attendanceSummary.subject}`,
      })

      // Redirigir a la página de asistencias
      router.push("/teacher/attendance")
    } catch (err) {
      console.error("Error al guardar asistencia:", err)
      toast({
        title: "Error al guardar",
        description: `No se pudo ${isEditing ? "actualizar" : "guardar"} la asistencia: ${err instanceof Error ? err.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setSavingAttendance(false)
      setShowSummary(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Presente":
        return <span className="text-green-600 font-medium">Presente</span>
      case "Ausente":
        return <span className="text-red-600 font-medium">Ausente</span>
      case "Tardanza":
        return <span className="text-yellow-600 font-medium">Tardanza</span>
      case "Justificado":
        return <span className="text-blue-600 font-medium">Justificado</span>
      default:
        return null
    }
  }

  const handleBack = () => {
    router.push("/teacher/attendance")
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-8" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h2 className="text-lg font-bold tracking-tight">{isEditing ? "Editar Asistencia" : "Registrar Asistencia"}</h2>
        <DatePicker date={selectedDate} onSelect={handleDateChange} disabled={false} />
      </div>

      {isEditing && !canEdit && (
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-xs">Advertencia</AlertTitle>
          <AlertDescription className="text-xs">
            La clase ya ha terminado. Los cambios serán registrados como modificaciones posteriores.
          </AlertDescription>
        </Alert>
      )}

      {isEditing && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="text-xs">Editando registro existente</AlertTitle>
          <AlertDescription className="text-xs">
            Está editando un registro para {format(selectedDate, "PPP", { locale: es })}.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{courseData?.materia?.nombre || "Curso"}</CardTitle>
          <div className="flex flex-wrap gap-2 text-xs mt-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{courseData?.horario || ""}</span>
            </div>
            <div className="text-muted-foreground">{courseData?.aula?.nombre || `Aula ${courseData?.aula_id}`}</div>
            <div className="text-muted-foreground">Fecha: {format(selectedDate, "dd/MM/yyyy", { locale: es })}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Lista de Alumnos</h3>
              <Button size="sm" onClick={handleSaveAttendance} disabled={!canEdit && !isEditing}>
                {isEditing ? "Actualizar" : "Guardar"}
              </Button>
            </div>

            {students.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs">Sin alumnos</AlertTitle>
                <AlertDescription className="text-xs">No hay alumnos registrados para este curso.</AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs py-2">Alumno</TableHead>
                      <TableHead className="text-xs py-2 text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="text-xs py-2">{student.nombre}</TableCell>
                        <TableCell className="py-1">
                          <RadioGroup
                            value={attendance[student.id] || ""}
                            onValueChange={(value) => handleAttendanceChange(student.id, value)}
                            className="flex flex-wrap justify-center gap-2"
                            disabled={!canEdit && !isEditing}
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Presente" id={`present-${student.id}`} className="h-3 w-3" />
                              <Label
                                htmlFor={`present-${student.id}`}
                                className="text-green-600 text-xs whitespace-nowrap"
                              >
                                P
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Tardanza" id={`late-${student.id}`} className="h-3 w-3" />
                              <Label
                                htmlFor={`late-${student.id}`}
                                className="text-yellow-600 text-xs whitespace-nowrap"
                              >
                                T
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Ausente" id={`absent-${student.id}`} className="h-3 w-3" />
                              <Label
                                htmlFor={`absent-${student.id}`}
                                className="text-red-600 text-xs whitespace-nowrap"
                              >
                                A
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Justificado" id={`justified-${student.id}`} className="h-3 w-3" />
                              <Label
                                htmlFor={`justified-${student.id}`}
                                className="text-blue-600 text-xs whitespace-nowrap"
                              >
                                J
                              </Label>
                            </div>
                          </RadioGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-base">
              {isEditing ? "Confirmar Actualización" : "Confirmar Registro"}
            </DialogTitle>
          </DialogHeader>
          {attendanceSummary && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-medium">Fecha:</p>
                  <p>{format(new Date(attendanceSummary.date), "dd/MM/yyyy", { locale: es })}</p>
                </div>
                <div>
                  <p className="font-medium">Materia:</p>
                  <p>{attendanceSummary.subject}</p>
                </div>
                <div>
                  <p className="font-medium">Salón:</p>
                  <p>{attendanceSummary.classroom}</p>
                </div>
                <div>
                  <p className="font-medium">Horario:</p>
                  <p>{attendanceSummary.schedule}</p>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs py-1">Alumno</TableHead>
                      <TableHead className="text-xs py-1">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceSummary.students.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="text-xs py-1">{student.name}</TableCell>
                        <TableCell className="text-xs py-1">{getStatusBadge(student.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setShowSummary(false)} disabled={savingAttendance}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={confirmSaveAttendance} disabled={savingAttendance}>
                  {savingAttendance && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  {savingAttendance ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditWarning} onOpenChange={setShowEditWarning}>
        <DialogContent className="max-w-[95vw] sm:max-w-[400px] p-4">
          <DialogHeader>
            <DialogTitle className="text-base">Advertencia - Clase finalizada</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm">
            <p>
              La clase ya ha terminado según el horario registrado ({courseData?.horario}). Los cambios que realice
              serán registrados como modificaciones posteriores.
            </p>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowEditWarning(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
