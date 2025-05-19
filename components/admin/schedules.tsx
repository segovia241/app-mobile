"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Datos de prueba de materias
const subjects = [
  { id: 1, name: "Inglés" },
  { id: 2, name: "Matemáticas" },
  { id: 3, name: "Ciencias" },
  { id: 4, name: "Historia" },
  { id: 5, name: "Programación" },
  { id: 6, name: "Arte" },
]

// Datos de prueba de docentes
const teachers = [
  { id: 1, name: "Juan Pérez", subjects: [1, 5] },
  { id: 2, name: "Laura Martínez", subjects: [2, 3] },
  { id: 3, name: "Roberto Sánchez", subjects: [3, 4, 6] },
]

// Datos de prueba de salones
const classrooms = [
  { id: 1, name: "Aula 101", capacity: 25 },
  { id: 2, name: "Aula 202", capacity: 30 },
  { id: 3, name: "Laboratorio 1", capacity: 20 },
]

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

// Datos de prueba de horarios
const initialSchedules = [
  {
    id: 1,
    subjectId: 1,
    teacherId: 1,
    classroomId: 1,
    day: "Lunes",
    startTime: "09:00",
    endTime: "11:00",
  },
  {
    id: 2,
    subjectId: 2,
    teacherId: 2,
    classroomId: 2,
    day: "Martes",
    startTime: "14:00",
    endTime: "16:00",
  },
  {
    id: 3,
    subjectId: 3,
    teacherId: 3,
    classroomId: 3,
    day: "Miércoles",
    startTime: "10:00",
    endTime: "12:00",
  },
]

export function Schedules() {
  const [schedules, setSchedules] = useState(initialSchedules)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState({
    id: 0,
    subjectId: 0,
    teacherId: 0,
    classroomId: 0,
    day: "",
    startTime: "",
    endTime: "",
  })
  const [filteredTeachers, setFilteredTeachers] = useState(teachers)
  const [scheduleError, setScheduleError] = useState("")

  // Filtrar docentes según la materia seleccionada
  useEffect(() => {
    if (currentSchedule.subjectId) {
      const filtered = teachers.filter((teacher) => teacher.subjects.includes(currentSchedule.subjectId))
      setFilteredTeachers(filtered)

      // Si el docente actual no enseña la materia seleccionada, resetear el docente
      if (currentSchedule.teacherId && !filtered.some((t) => t.id === currentSchedule.teacherId)) {
        setCurrentSchedule({
          ...currentSchedule,
          teacherId: 0,
        })
      }
    } else {
      setFilteredTeachers(teachers)
    }
  }, [currentSchedule, currentSchedule.subjectId])

  // Verificar si hay conflictos de horario
  const checkScheduleConflicts = (schedule: any) => {
    // Excluir el horario actual en caso de edición
    const otherSchedules = schedules.filter((s) => s.id !== schedule.id)

    // Verificar conflictos de aula
    const classroomConflict = otherSchedules.find(
      (s) =>
        s.classroomId === schedule.classroomId &&
        s.day === schedule.day &&
        ((s.startTime <= schedule.startTime && s.endTime > schedule.startTime) ||
          (s.startTime < schedule.endTime && s.endTime >= schedule.endTime) ||
          (s.startTime >= schedule.startTime && s.endTime <= schedule.endTime)),
    )

    if (classroomConflict) {
      const conflictSubject = subjects.find((s) => s.id === classroomConflict.subjectId)?.name
      return `El aula ya está ocupada en ese horario por la materia ${conflictSubject}`
    }

    // Verificar conflictos de docente
    const teacherConflict = otherSchedules.find(
      (s) =>
        s.teacherId === schedule.teacherId &&
        s.day === schedule.day &&
        ((s.startTime <= schedule.startTime && s.endTime > schedule.startTime) ||
          (s.startTime < schedule.endTime && s.endTime >= schedule.endTime) ||
          (s.startTime >= schedule.startTime && s.endTime <= schedule.endTime)),
    )

    if (teacherConflict) {
      const conflictSubject = subjects.find((s) => s.id === teacherConflict.subjectId)?.name
      return `El docente ya tiene asignada la materia ${conflictSubject} en ese horario`
    }

    return ""
  }

  const handleAddSchedule = () => {
    // Verificar que todos los campos estén completos
    if (
      !currentSchedule.subjectId ||
      !currentSchedule.teacherId ||
      !currentSchedule.classroomId ||
      !currentSchedule.day ||
      !currentSchedule.startTime ||
      !currentSchedule.endTime
    ) {
      setScheduleError("Por favor complete todos los campos")
      return
    }

    // Verificar conflictos de horario
    const conflict = checkScheduleConflicts(currentSchedule)
    if (conflict) {
      setScheduleError(conflict)
      return
    }

    const newId = schedules.length > 0 ? Math.max(...schedules.map((s) => s.id)) + 1 : 1
    setSchedules([...schedules, { ...currentSchedule, id: newId }])
    setCurrentSchedule({ id: 0, subjectId: 0, teacherId: 0, classroomId: 0, day: "", startTime: "", endTime: "" })
    setScheduleError("")
    setIsAddOpen(false)
  }

  const handleEditSchedule = () => {
    // Verificar que todos los campos estén completos
    if (
      !currentSchedule.subjectId ||
      !currentSchedule.teacherId ||
      !currentSchedule.classroomId ||
      !currentSchedule.day ||
      !currentSchedule.startTime ||
      !currentSchedule.endTime
    ) {
      setScheduleError("Por favor complete todos los campos")
      return
    }

    // Verificar conflictos de horario
    const conflict = checkScheduleConflicts(currentSchedule)
    if (conflict) {
      setScheduleError(conflict)
      return
    }

    setSchedules(schedules.map((schedule) => (schedule.id === currentSchedule.id ? currentSchedule : schedule)))
    setScheduleError("")
    setIsEditOpen(false)
  }

  const handleDeleteSchedule = (id: number) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id))
  }

  const openEditDialog = (schedule: any) => {
    setCurrentSchedule(schedule)
    setScheduleError("")
    setIsEditOpen(true)
  }

  const getSubjectName = (id: number) => {
    return subjects.find((s) => s.id === id)?.name || ""
  }

  const getTeacherName = (id: number) => {
    return teachers.find((t) => t.id === id)?.name || ""
  }

  const getClassroomName = (id: number) => {
    return classrooms.find((c) => c.id === id)?.name || ""
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Horarios</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Horario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Horario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {scheduleError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{scheduleError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="subject">Materia</Label>
                <Select
                  value={currentSchedule.subjectId ? currentSchedule.subjectId.toString() : ""}
                  onValueChange={(value) =>
                    setCurrentSchedule({
                      ...currentSchedule,
                      subjectId: Number.parseInt(value),
                      teacherId: 0, // Resetear el docente al cambiar la materia
                    })
                  }
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacher">Docente</Label>
                <Select
                  value={currentSchedule.teacherId ? currentSchedule.teacherId.toString() : ""}
                  onValueChange={(value) =>
                    setCurrentSchedule({ ...currentSchedule, teacherId: Number.parseInt(value) })
                  }
                  disabled={!currentSchedule.subjectId}
                >
                  <SelectTrigger id="teacher">
                    <SelectValue
                      placeholder={
                        currentSchedule.subjectId
                          ? filteredTeachers.length > 0
                            ? "Seleccionar docente"
                            : "No hay docentes para esta materia"
                          : "Primero seleccione una materia"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classroom">Salón</Label>
                <Select
                  value={currentSchedule.classroomId ? currentSchedule.classroomId.toString() : ""}
                  onValueChange={(value) =>
                    setCurrentSchedule({ ...currentSchedule, classroomId: Number.parseInt(value) })
                  }
                >
                  <SelectTrigger id="classroom">
                    <SelectValue placeholder="Seleccionar salón" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id.toString()}>
                        {classroom.name} (Cap: {classroom.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="day">Día</Label>
                <Select
                  value={currentSchedule.day}
                  onValueChange={(value) => setCurrentSchedule({ ...currentSchedule, day: value })}
                >
                  <SelectTrigger id="day">
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora Inicio</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={currentSchedule.startTime}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora Fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={currentSchedule.endTime}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, endTime: e.target.value })}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleAddSchedule}>
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Materia</TableHead>
              <TableHead className="hidden md:table-cell">Docente</TableHead>
              <TableHead>Salón</TableHead>
              <TableHead className="hidden sm:table-cell">Día</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell>{getSubjectName(schedule.subjectId)}</TableCell>
                <TableCell className="hidden md:table-cell">{getTeacherName(schedule.teacherId)}</TableCell>
                <TableCell>{getClassroomName(schedule.classroomId)}</TableCell>
                <TableCell className="hidden sm:table-cell">{schedule.day}</TableCell>
                <TableCell>{`${schedule.startTime} - ${schedule.endTime}`}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(schedule)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(schedule.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Horario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {scheduleError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{scheduleError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-subject">Materia</Label>
              <Select
                value={currentSchedule.subjectId ? currentSchedule.subjectId.toString() : ""}
                onValueChange={(value) =>
                  setCurrentSchedule({
                    ...currentSchedule,
                    subjectId: Number.parseInt(value),
                    teacherId: 0, // Resetear el docente al cambiar la materia
                  })
                }
              >
                <SelectTrigger id="edit-subject">
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-teacher">Docente</Label>
              <Select
                value={currentSchedule.teacherId ? currentSchedule.teacherId.toString() : ""}
                onValueChange={(value) => setCurrentSchedule({ ...currentSchedule, teacherId: Number.parseInt(value) })}
                disabled={!currentSchedule.subjectId}
              >
                <SelectTrigger id="edit-teacher">
                  <SelectValue
                    placeholder={
                      currentSchedule.subjectId
                        ? filteredTeachers.length > 0
                          ? "Seleccionar docente"
                          : "No hay docentes para esta materia"
                        : "Primero seleccione una materia"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-classroom">Salón</Label>
              <Select
                value={currentSchedule.classroomId ? currentSchedule.classroomId.toString() : ""}
                onValueChange={(value) =>
                  setCurrentSchedule({ ...currentSchedule, classroomId: Number.parseInt(value) })
                }
              >
                <SelectTrigger id="edit-classroom">
                  <SelectValue placeholder="Seleccionar salón" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id.toString()}>
                      {classroom.name} (Cap: {classroom.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-day">Día</Label>
              <Select
                value={currentSchedule.day}
                onValueChange={(value) => setCurrentSchedule({ ...currentSchedule, day: value })}
              >
                <SelectTrigger id="edit-day">
                  <SelectValue placeholder="Seleccionar día" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Hora Inicio</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={currentSchedule.startTime}
                  onChange={(e) => setCurrentSchedule({ ...currentSchedule, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">Hora Fin</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={currentSchedule.endTime}
                  onChange={(e) => setCurrentSchedule({ ...currentSchedule, endTime: e.target.value })}
                />
              </div>
            </div>

            <Button className="w-full" onClick={handleEditSchedule}>
              Actualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
