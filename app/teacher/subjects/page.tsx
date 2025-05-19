"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Loader2, Users } from "lucide-react"
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

interface Subject {
  id: number
  name: string
  code: string
  description?: string
  credits: number
  students: number
  hoursPerWeek: number
  groups: string[]
  cursoIds: number[]
}

export default function TeacherSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
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

  // Cargar datos de materias
  useEffect(() => {
    const loadSubjects = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // 1. Obtener el profesor asociado al usuario actual
        const profesores = await fetchAPI(`profesores?usuario_id=eq.${user.id}&select=*`)

        if (!profesores || profesores.length === 0) {
          throw new Error(`No se encontró el profesor asociado al usuario con ID ${user.id}`)
        }

        const profesor = profesores[0]

        // 2. Obtener los cursos asignados al profesor con información de materias
        const cursos = await fetchAPI(`cursos?profesor_id=eq.${profesor.id}&select=*,materia:materias(*)`)

        // 3. Obtener las inscripciones para contar estudiantes
        const cursosIds = cursos.map((c: Curso) => c.id)
        let inscripciones: any[] = []

        if (cursosIds.length > 0) {
          // Construir la consulta para obtener inscripciones de todos los cursos del profesor
          const cursosQuery = cursosIds.map((id: number) => `curso_id.eq.${id}`).join(",")
          inscripciones = await fetchAPI(`inscripciones_cursos?or=(${cursosQuery})&select=*`)
        }

        // 4. Agrupar cursos por materia
        const materiaMap = new Map<number, Subject>()

        cursos.forEach((curso: Curso) => {
          if (!curso.materia) return

          const materiaId = curso.materia.id
          const diasArray = curso.dias_semana.split(",").map((d) => d.trim())
          const hoursPerDay = 1.5 // Estimado de horas por clase

          // Contar estudiantes inscritos en este curso
          const estudiantesEnCurso = inscripciones.filter((i) => i.curso_id === curso.id).length

          if (materiaMap.has(materiaId)) {
            // Actualizar materia existente
            const subject = materiaMap.get(materiaId)!
            subject.students += estudiantesEnCurso
            subject.hoursPerWeek += diasArray.length * hoursPerDay
            subject.groups = [
              ...new Set([...subject.groups, ...diasArray.map((d) => d.charAt(0) + curso.horario.split(":")[0])]),
            ]
            subject.cursoIds.push(curso.id)
          } else {
            // Crear nueva materia
            materiaMap.set(materiaId, {
              id: materiaId,
              name: curso.materia.nombre,
              code: curso.materia.codigo,
              description: curso.materia.descripcion,
              credits: curso.materia.creditos,
              students: estudiantesEnCurso,
              hoursPerWeek: diasArray.length * hoursPerDay,
              groups: diasArray.map((d) => d.charAt(0) + curso.horario.split(":")[0]),
              cursoIds: [curso.id],
            })
          }
        })

        // Convertir el mapa a un array
        const subjectsData = Array.from(materiaMap.values())

        setSubjects(subjectsData)
        setError(null)
      } catch (err) {
        console.error("Error al cargar materias:", err)
        setError("Error al cargar las materias")
        toast({
          title: "Error",
          description: "No se pudieron cargar las materias",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadSubjects()
    }
  }, [user, toast])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando materias...</span>
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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Mis Materias</h2>
        <p className="text-sm text-muted-foreground">Materias asignadas para el semestre actual.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {subjects.length > 0 ? (
          subjects.map((subject) => (
            <Card key={subject.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{subject.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {subject.code}
                  </Badge>
                </div>
                <CardDescription className="mt-1 text-xs line-clamp-2">
                  {subject.description || "Sin descripción disponible"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{subject.students} estudiantes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{subject.hoursPerWeek} hrs/semana</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{subject.credits} créditos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No tienes materias asignadas para este semestre.
          </p>
        )}
      </div>
    </div>
  )
}
