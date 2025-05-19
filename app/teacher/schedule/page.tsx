"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchAPI } from "@/lib/api/config"

interface Profesor {
  id: number
  usuario_id: number
  nombres: string
  apellidos: string
}

interface Materia {
  id: number
  codigo: string
  nombre: string
}

interface Aula {
  id: number
  codigo: string
  nombre: string
  ubicacion?: string
}

interface Curso {
  id: number
  profesor_id: number
  materia_id: number
  periodo_id: number
  horario: string
  dias_semana: string
  aula_id: number
  materia?: {
    id: number
    codigo: string
    nombre: string
  }
  aula?: {
    id: number
    codigo: string
    nombre: string
  }
}

interface ScheduleClass {
  day: string
  time: string
  subject: string
  group: string
  room: string
  curso_id: number
}

export default function TeacherSchedule() {
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

  // Definir franjas horarias que coincidan con los datos de la BD
  const timeSlots = [
    "07:00 - 08:30",
    "08:30 - 10:00",
    "10:00 - 11:30",
    "11:30 - 13:00",
    "13:00 - 14:30",
    "14:30 - 16:00",
    "16:00 - 17:30",
  ]

  const [schedule, setSchedule] = useState<ScheduleClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const [aulas, setAulas] = useState<Aula[]>([])

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

  useEffect(() => {
    const loadAulas = async () => {
      try {
        const aulasData = await fetchAPI("aulas?select=*")
        setAulas(aulasData)
      } catch (error) {
        console.error("Error al cargar aulas:", error)
      }
    }

    loadAulas()
  }, [])

  // Cargar datos del horario
  useEffect(() => {
    const loadSchedule = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // 1. Obtener el profesor asociado al usuario actual
        const profesores = await fetchAPI(`profesores?usuario_id=eq.${user.id}&select=*`)

        if (!profesores || profesores.length === 0) {
          throw new Error(`No se encontró el profesor asociado al usuario con ID ${user.id}`)
        }

        const profesor = profesores[0]
        console.log("Profesor encontrado:", profesor)

        // 2. Obtener los cursos asignados al profesor
        const cursos = await fetchAPI(`cursos?profesor_id=eq.${profesor.id}&select=*,materia:materias(*),aula:aulas(*)`)
        console.log("Cursos del profesor:", cursos)

        if (!cursos || cursos.length === 0) {
          console.log("No se encontraron cursos para este profesor")
          setSchedule([])
          setError(null)
          setIsLoading(false)
          return
        }

        // 3. Construir el horario
        const scheduleData: ScheduleClass[] = []

        cursos.forEach((curso: any) => {
          if (!curso.materia) {
            console.log(`Curso ${curso.id} no tiene materia asociada`)
            return
          }

          // Dividir los días de la semana (convertir a minúsculas para comparación)
          const diasArray = curso.dias_semana
            .toLowerCase()
            .split(",")
            .map((d: string) => {
              // Capitalizar primera letra para mostrar
              const day = d.trim()
              return day.charAt(0).toUpperCase() + day.slice(1)
            })

          console.log(`Curso ${curso.id} - Días: ${diasArray.join(", ")}`)

          // Encontrar el aula correspondiente
          const aula = aulas.find((a: Aula) => a.id === curso.aula_id)

          // Para cada día, crear una entrada en el horario
          diasArray.forEach((dia: string) => {
            scheduleData.push({
              day: dia,
              time: curso.horario,
              subject: curso.materia.nombre,
              group: `Grupo ${curso.id}`,
              room: aula ? `${aula.codigo} - ${aula.nombre}` : `Aula ${curso.aula_id}`,
              curso_id: curso.id,
            })
          })
        })

        console.log("Datos del horario:", scheduleData)
        setSchedule(scheduleData)
        setError(null)
      } catch (err) {
        console.error("Error al cargar horario:", err)
        setError("Error al cargar el horario")
        toast({
          title: "Error",
          description: "No se pudo cargar el horario",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadSchedule()
    }
  }, [user, toast, aulas])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando horario...</span>
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
        <h2 className="text-2xl font-bold tracking-tight">Mi Horario</h2>
        <p className="text-muted-foreground">Consulta tu horario de clases para la semana.</p>
      </div>

      {schedule.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No tienes clases asignadas en este periodo.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Schedule View */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Horario Semanal</CardTitle>
              <CardDescription>Semestre Actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                <div className="font-medium"></div>
                {days.map((day) => (
                  <div key={day} className="font-medium text-center">
                    {day}
                  </div>
                ))}

                {timeSlots.map((time) => (
                  <React.Fragment key={time}>
                    <div className="text-sm py-2 border-t">{time}</div>
                    {days.map((day) => {
                      // Buscar clases que coincidan con este día y horario
                      const cls = schedule.find((c) => c.day === day && c.time === time)
                      return (
                        <div key={`${day}-${time}`} className="border-t p-1">
                          {cls ? (
                            <div className="bg-primary/10 rounded p-1 h-full flex flex-col justify-between text-xs">
                              <div className="font-medium">{cls.subject}</div>
                              <div className="flex justify-between mt-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {cls.group}
                                </Badge>
                                <span className="text-muted-foreground">{cls.room}</span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mobile Schedule View */}
          <div className="md:hidden space-y-4">
            {days.map((day) => {
              const dayClasses = schedule.filter((cls) => cls.day === day)

              return (
                <Card key={day}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dayClasses.length > 0 ? (
                      dayClasses
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((cls, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-start border-b pb-2 last:border-0 last:pb-0"
                          >
                            <div>
                              <p className="font-medium">{cls.subject}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {cls.group}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{cls.room}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{cls.time}</p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay clases programadas</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
