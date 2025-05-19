"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Save, Clock, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getMaterias,
  getAulas,
  getHorariosByProfesor,
  getInscripcionesByMateria,
  saveAsistencias,
  getPeriodoAcademicoActual,
  type Materia,
  type Aula,
  type Horario,
  type Inscripcion,
  type PeriodoAcademico,
} from "@/lib/api"

// Definición de tipos
interface Asistencia {
  [key: number]: string
}

export default function TeacherAttendance() {
  const { toast } = useToast()
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [periodoActual, setPeriodoActual] = useState<PeriodoAcademico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTeacher, setCurrentTeacher] = useState<{ id: number; name: string } | null>(null)

  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [classroomId, setClassroomId] = useState<number | null>(null)
  const [scheduleId, setScheduleId] = useState<number | null>(null)
  const [attendance, setAttendance] = useState<Asistencia>({})
  const [isFormComplete, setIsFormComplete] = useState(false)
  const [filteredStudents, setFilteredStudents] = useState<Inscripcion[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<Materia[]>([])
  const [availableClassrooms, setAvailableClassrooms] = useState<Aula[]>([])
  const [availableSchedules, setAvailableSchedules] = useState<Horario[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null)
  const [savingAttendance, setSavingAttendance] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)

        // Obtener el ID del profesor actual (en una aplicación real vendría de la autenticación)
        // Por ahora, simulamos que es el profesor con ID 1
        setCurrentTeacher({ id: 1, name: "Profesor Actual" })

        // Obtener periodo académico actual
        const periodoData = await getPeriodoAcademicoActual()
        setPeriodoActual(periodoData)

        // Obtener materias y aulas
        const [materiasData, aulasData] = await Promise.all([getMaterias(), getAulas()])

        setMaterias(materiasData)
        setAulas(aulasData)

        // Obtener horarios del profesor actual
        const horariosData = await getHorariosByProfesor(1) // Usamos ID 1 por ahora
        setHorarios(horariosData)

        // Filtrar materias que el docente puede enseñar
        const docenteMaterias = materiasData.filter((materia) =>
          horariosData.some((horario) => horario.subject_id === materia.id),
        )

        setAvailableSubjects(docenteMaterias)
        setError(null)
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err)
        setError("Error al cargar datos. Por favor, intente nuevamente.")
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Actualizar aulas disponibles cuando se selecciona una materia
  useEffect(() => {
    if (subjectId && currentTeacher) {
      const fetchClassrooms = async () => {
        try {
          setLoading(true)

          // Encontrar todos los horarios para esta materia
          const subjectSchedules = horarios.filter(
            (horario) => horario.subject_id === subjectId && horario.teacher_id === currentTeacher.id,
          )

          // Obtener las aulas únicas de estos horarios
          const uniqueClassroomIds = [...new Set(subjectSchedules.map((schedule) => schedule.classroom_id))]

          // Filtrar las aulas disponibles
          const filtered = aulas.filter((aula) => uniqueClassroomIds.includes(aula.id))

          setAvailableClassrooms(filtered)
          setClassroomId(null)
          setScheduleId(null)
          setError(null)
        } catch (err) {
          console.error("Error al cargar aulas:", err)
          setError("Error al cargar aulas. Por favor, intente nuevamente.")
        } finally {
          setLoading(false)
        }
      }

      fetchClassrooms()
    } else {
      setAvailableClassrooms([])
    }
  }, [subjectId, horarios, aulas, currentTeacher])

  // Actualizar horarios disponibles cuando se selecciona un aula
  useEffect(() => {
    if (subjectId && classroomId && currentTeacher) {
      const filtered = horarios.filter(
        (horario) =>
          horario.subject_id === subjectId &&
          horario.classroom_id === classroomId &&
          horario.teacher_id === currentTeacher.id,
      )
      setAvailableSchedules(filtered)
      setScheduleId(null)
    } else {
      setAvailableSchedules([])
    }
  }, [subjectId, classroomId, horarios, currentTeacher])

  // Filtrar estudiantes según la materia seleccionada
  useEffect(() => {
    if (subjectId) {
      const fetchStudents = async () => {
        try {
          setLoading(true)
          const inscripciones = await getInscripcionesByMateria(subjectId)
          setFilteredStudents(inscripciones)

          // Reiniciar la asistencia
          setAttendance({})
          setError(null)
        } catch (err) {
          console.error("Error al cargar estudiantes:", err)
          setError("Error al cargar estudiantes. Por favor, intente nuevamente.")
        } finally {
          setLoading(false)
        }
      }

      fetchStudents()
    } else {
      setFilteredStudents([])
    }
  }, [subjectId])

  // Verificar si el formulario está completo
  useEffect(() => {
    setIsFormComplete(!!subjectId && !!classroomId && !!scheduleId)
  }, [subjectId, classroomId, scheduleId])

  const handleSubjectChange = (value: string) => {
    const id = Number.parseInt(value)
    setSubjectId(id)
  }

  const handleClassroomChange = (value: string) => {
    const id = Number.parseInt(value)
    setClassroomId(id)
  }

  const handleScheduleChange = (value: string) => {
    const id = Number.parseInt(value)
    setScheduleId(id)
  }

  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendance({
      ...attendance,
      [studentId]: status,
    })
  }

  const handleSaveAttendance = () => {
    // Verificar que todos los estudiantes tengan asistencia registrada
    const allStudentsHaveAttendance = filteredStudents.every((student) => attendance[student.student_id!] !== undefined)

    if (!allStudentsHaveAttendance) {
      toast({
        title: "Registro incompleto",
        description: "Debe registrar la asistencia de todos los alumnos",
        variant: "destructive",
      })
      return
    }

    // Preparar el resumen de asistencia
    const selectedSubject = materias.find((s) => s.id === subjectId)
    const selectedClassroom = aulas.find((c) => c.id === classroomId)
    const selectedSchedule = horarios.find((s) => s.id === scheduleId)

    const summary = {
      date: format(new Date(), "yyyy-MM-dd"),
      subject: selectedSubject?.name || "",
      subject_id: subjectId,
      classroom: selectedClassroom?.name || "",
      classroom_id: classroomId,
      schedule: selectedSchedule ? `${selectedSchedule.start_time} - ${selectedSchedule.end_time}` : "",
      schedule_id: scheduleId,
      teacher: currentTeacher?.name || "",
      teacher_id: currentTeacher?.id,
      students: filteredStudents.map((student) => ({
        id: student.student_id,
        name: student.estudiantes?.usuarios
          ? `${student.estudiantes.usuarios.first_name} ${student.estudiantes.usuarios.last_name}`
          : student.estudiantes?.student_id || `Estudiante ${student.student_id}`,
        status: attendance[student.student_id!] || "",
        time:
          attendance[student.student_id!] === "present"
            ? format(new Date(), "HH:mm")
            : attendance[student.student_id!] === "late"
              ? format(new Date(), "HH:mm")
              : "",
      })),
    }

    setAttendanceSummary(summary)
    setShowSummary(true)
  }

  const confirmSaveAttendance = async () => {
    if (!currentTeacher) return

    try {
      setSavingAttendance(true)

      // Preparar los datos para guardar en la API
      const attendanceRecords = attendanceSummary.students.map((student: any) => ({
        schedule_id: attendanceSummary.schedule_id,
        student_id: student.id,
        date: attendanceSummary.date,
        status: student.status,
        arrival_time: student.time || null,
        recorded_by: currentTeacher.id,
      }))

      // Guardar los registros de asistencia
      await saveAsistencias(attendanceRecords)

      toast({
        title: "Asistencia guardada",
        description: `Asistencia registrada para ${attendanceSummary.subject} en ${attendanceSummary.classroom}`,
      })

      // Reiniciar el formulario
      setSubjectId(null)
      setClassroomId(null)
      setScheduleId(null)
      setAttendance({})
      setShowSummary(false)
    } catch (err) {
      console.error("Error al guardar asistencia:", err)
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la asistencia. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSavingAttendance(false)
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

  const getStudentName = (student: Inscripcion) => {
    if (student.estudiantes?.usuarios) {
      return `${student.estudiantes.usuarios.first_name} ${student.estudiantes.usuarios.last_name}`
    }
    return student.estudiantes?.student_id || `Estudiante ${student.student_id}`
  }

  if (loading && !subjectId && !classroomId && !scheduleId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    )
  }

  if (error && !subjectId && !classroomId && !scheduleId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Bienvenido, {currentTeacher?.name || "Profesor"}</CardTitle>
          {periodoActual && (
            <p className="text-sm text-muted-foreground">
              Periodo actual: {periodoActual.name} ({periodoActual.academic_year})
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="subject">Materia</Label>
              <Select value={subjectId?.toString() || ""} onValueChange={handleSubjectChange}>
                <SelectTrigger id="subject" className="w-full">
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] overflow-y-auto">
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classroom">Salón</Label>
              <Select value={classroomId?.toString() || ""} onValueChange={handleClassroomChange} disabled={!subjectId}>
                <SelectTrigger id="classroom" className="w-full">
                  <SelectValue
                    placeholder={
                      subjectId
                        ? availableClassrooms.length > 0
                          ? "Seleccionar salón"
                          : "No hay salones disponibles"
                        : "Primero seleccione una materia"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] overflow-y-auto">
                  {availableClassrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id.toString()}>
                      {classroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Horario</Label>
              <Select
                value={scheduleId?.toString() || ""}
                onValueChange={handleScheduleChange}
                disabled={!subjectId || !classroomId}
              >
                <SelectTrigger id="schedule" className="w-full">
                  <SelectValue
                    placeholder={
                      subjectId && classroomId
                        ? availableSchedules.length > 0
                          ? "Seleccionar horario"
                          : "No hay horarios disponibles"
                        : "Primero seleccione materia y salón"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] overflow-y-auto">
                  {availableSchedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id.toString()}>
                      {schedule.day_of_week}: {schedule.start_time} - {schedule.end_time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm text-slate-500">
            <Clock className="h-4 w-4 mr-1" />
            Fecha: {format(new Date(), "PPP", { locale: es })}
          </div>
        </CardContent>
      </Card>

      {loading && (subjectId || classroomId || scheduleId) && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Cargando datos...</span>
        </div>
      )}

      {error && (subjectId || classroomId || scheduleId) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isFormComplete && !loading && !error && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-medium">Lista de Alumnos</h3>
            <Button onClick={handleSaveAttendance}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Asistencia
            </Button>
          </div>

          {filteredStudents.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sin alumnos</AlertTitle>
              <AlertDescription>No hay alumnos registrados para esta materia.</AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="whitespace-nowrap">{getStudentName(student)}</TableCell>
                      <TableCell>
                        <RadioGroup
                          value={attendance[student.student_id!] || ""}
                          onValueChange={(value) => handleAttendanceChange(student.student_id!, value)}
                          className="flex flex-wrap justify-center gap-4"
                        >
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="Presente" id={`present-${student.student_id}`} />
                            <Label
                              htmlFor={`present-${student.student_id}`}
                              className="text-green-600 whitespace-nowrap"
                            >
                              Presente
                            </Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="Tardanza" id={`late-${student.student_id}`} />
                            <Label htmlFor={`late-${student.student_id}`} className="text-yellow-600 whitespace-nowrap">
                              Tardanza
                            </Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="Ausente" id={`absent-${student.student_id}`} />
                            <Label htmlFor={`absent-${student.student_id}`} className="text-red-600 whitespace-nowrap">
                              Ausente
                            </Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="Justificado" id={`justified-${student.student_id}`} />
                            <Label
                              htmlFor={`justified-${student.student_id}`}
                              className="text-blue-600 whitespace-nowrap"
                            >
                              Justificado
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
      )}

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Registro de Asistencia</DialogTitle>
          </DialogHeader>
          {attendanceSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Fecha:</p>
                  <p>{format(new Date(attendanceSummary.date), "PPP", { locale: es })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Materia:</p>
                  <p>{attendanceSummary.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Salón:</p>
                  <p>{attendanceSummary.classroom}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Horario:</p>
                  <p>{attendanceSummary.schedule}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Docente:</p>
                  <p>{attendanceSummary.teacher}</p>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceSummary.students.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{getStatusBadge(student.status)}</TableCell>
                        <TableCell>{student.time || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSummary(false)} disabled={savingAttendance}>
                  Cancelar
                </Button>
                <Button onClick={confirmSaveAttendance} disabled={savingAttendance}>
                  {savingAttendance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {savingAttendance ? "Guardando..." : "Confirmar y Guardar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
