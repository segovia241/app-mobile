"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ChevronRight, Loader2, UserCheck, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchAPI } from "@/lib/api/config"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Profesor } from "@/lib/api/profesores"

interface Curso {
  id: number
  profesor_id?: number
  materia_id?: number
  periodo_id?: number
  horario: string
  dias_semana: string
  aula_id?: number
  cupo_maximo?: number
  cupo_actual?: number
  estado?: string
  created_at?: string
  updated_at?: string
  profesores?: {
    id: number
    nombres: string
    apellidos: string
    email: string
    usuario_id?: number
    usuarios?: {
      id: number
      first_name?: string
      last_name?: string
      email?: string
    }
  }
  materias?: {
    id: number
    codigo: string
    nombre: string
    descripcion?: string
  }
  aulas?: {
    id: number
    codigo: string
    nombre: string
  }
}

interface Asistencia {
  id: number
  curso_id?: number
  estudiante_id?: number
  fecha: string
  estado: string
  hora_llegada?: string
  comentario?: string
  registrado_por?: number
  created_at?: string
  updated_at?: string
  estudiantes?: {
    id: number
    matricula: string
    nombres: string
    apellidos: string
    usuario_id?: number
    usuarios?: {
      id: number
      first_name?: string
      last_name?: string
      email?: string
    }
  }
  cursos?: Curso
}

// Agrupar asistencias por fecha, curso y profesor
interface AsistenciaAgrupada {
  fecha: string
  curso_id: number
  profesor_id: number
  curso_nombre: string
  profesor_nombre: string
  total_estudiantes: number
  presentes: number
  ausentes: number
  tarde: number
  registros: Asistencia[]
}

export function Attendance() {
  const isMobile = window.innerWidth < 768
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [asistenciasAgrupadas, setAsistenciasAgrupadas] = useState<AsistenciaAgrupada[]>([])
  const [selectedProfesor, setSelectedProfesor] = useState<string>("")
  const [selectedCurso, setSelectedCurso] = useState<string>("")
  const [detalleAsistencia, setDetalleAsistencia] = useState<AsistenciaAgrupada | null>(null)
  const [showDetalleDialog, setShowDetalleDialog] = useState(false)

  // Función para obtener asistencias con datos relacionados
  const getAsistenciasDetalladas = async () => {
    try {
      return await fetchAPI(
        "asistencia?select=*,estudiantes(*,usuarios(*)),cursos(*,profesores(*,usuarios(*)),materias(*),aulas(*))",
      )
    } catch (error) {
      console.error("Error fetching attendance:", error)
      throw new Error("Error al obtener asistencias")
    }
  }

  // Función para obtener profesores
  const getProfesores = async () => {
    try {
      return await fetchAPI("profesores?select=*,usuarios(*)")
    } catch (error) {
      console.error("Error fetching teachers:", error)
      throw new Error("Error al obtener profesores")
    }
  }

  // Función para obtener cursos
  const getCursos = async () => {
    try {
      return await fetchAPI("cursos?select=*,profesores(*,usuarios(*)),materias(*),aulas(*)")
    } catch (error) {
      console.error("Error fetching courses:", error)
      throw new Error("Error al obtener cursos")
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Cargar datos principales
        const [asistenciasData, profesoresData, cursosData] = await Promise.all([
          getAsistenciasDetalladas(),
          getProfesores(),
          getCursos(),
        ])

        setAsistencias(asistenciasData)
        setProfesores(profesoresData)
        setCursos(cursosData)
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("Error al cargar los datos de asistencia. Por favor, intente nuevamente.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Agrupar asistencias por fecha, curso y profesor
  useEffect(() => {
    if (asistencias.length === 0) return

    // Crear un mapa para agrupar asistencias
    const asistenciasMap = new Map<string, AsistenciaAgrupada>()

    asistencias.forEach((asistencia) => {
      // Obtener información del curso y profesor
      const curso = asistencia.cursos || cursos.find((c) => c.id === asistencia.curso_id)
      if (!curso) return

      const profesor = curso.profesores || profesores.find((p) => p.id === curso.profesor_id)
      if (!profesor) return

      // Crear clave única para este grupo
      const key = `${asistencia.fecha}-${curso.id}-${profesor.id}`

      // Si no existe el grupo, crearlo
      if (!asistenciasMap.has(key)) {
        asistenciasMap.set(key, {
          fecha: asistencia.fecha,
          curso_id: curso.id,
          profesor_id: profesor.id,
          curso_nombre: curso.materias?.nombre || `Curso ${curso.id}`,
          profesor_nombre: `${profesor.nombres} ${profesor.apellidos}`,
          total_estudiantes: 0,
          presentes: 0,
          ausentes: 0,
          tarde: 0,
          registros: [],
        })
      }

      // Obtener el grupo y actualizar contadores
      const grupo = asistenciasMap.get(key)!
      grupo.total_estudiantes++

      if (asistencia.estado === "Presente") {
        grupo.presentes++
      } else if (asistencia.estado === "Ausente") {
        grupo.ausentes++
      } else if (asistencia.estado === "Tardanza") {
        grupo.tarde++
      } else if (asistencia.estado === "Justificado") {
        // Consideramos justificado como presente para las estadísticas
        grupo.presentes++
      }

      // Añadir el registro al grupo
      grupo.registros.push(asistencia)
    })

    // Convertir el mapa a array y ordenar por fecha (más reciente primero)
    const grupos = Array.from(asistenciasMap.values()).sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    )

    setAsistenciasAgrupadas(grupos)
  }, [asistencias, cursos, profesores])

  // Filtrar asistencias agrupadas según selecciones
  const asistenciasFiltradas = asistenciasAgrupadas.filter((grupo) => {
    if (selectedProfesor && selectedProfesor !== "all") {
      if (grupo.profesor_id.toString() !== selectedProfesor) return false
    }

    if (selectedCurso && selectedCurso !== "all") {
      if (grupo.curso_id.toString() !== selectedCurso) return false
    }

    return true
  })

  const handleVerDetalle = (grupo: AsistenciaAgrupada) => {
    setDetalleAsistencia(grupo)
    setShowDetalleDialog(true)
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
        return <Badge className="bg-gray-500">{estado}</Badge>
    }
  }

  const getEstudianteNombre = (asistencia: Asistencia) => {
    if (asistencia.estudiantes) {
      if (asistencia.estudiantes.usuarios) {
        return `${asistencia.estudiantes.usuarios.first_name || ""} ${asistencia.estudiantes.usuarios.last_name || ""}`
      }
      return `${asistencia.estudiantes.nombres || ""} ${asistencia.estudiantes.apellidos || ""}`
    }

    return "No disponible"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos de asistencia...</span>
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Registros de Asistencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <Select value={selectedProfesor} onValueChange={setSelectedProfesor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por profesor" />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] overflow-y-auto">
                  <SelectItem value="all">Todos los profesores</SelectItem>
                  {profesores.map((profesor) => (
                    <SelectItem key={profesor.id} value={profesor.id.toString()}>
                      {profesor.nombres} {profesor.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por curso" />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] overflow-y-auto">
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id.toString()}>
                      {curso.materias?.nombre || `Curso ${curso.id}`} - {curso.horario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {asistenciasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
              <p>No se encontraron registros de asistencia.</p>
            </div>
          ) : isMobile ? (
            <div className="space-y-4">
              {asistenciasFiltradas.map((grupo, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>{format(new Date(grupo.fecha), "dd/MM/yyyy")}</span>
                      <Badge variant="outline">{grupo.total_estudiantes} alumnos</Badge>
                    </CardTitle>
                    <p className="text-sm">{grupo.curso_nombre}</p>
                    <p className="text-sm text-muted-foreground">{grupo.profesor_nombre}</p>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between mb-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                        {grupo.presentes} presentes
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        {grupo.tarde} tarde
                      </Badge>
                      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                        {grupo.ausentes} ausentes
                      </Badge>
                    </div>
                  </CardContent>
                  <div className="bg-muted px-4 py-2">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => handleVerDetalle(grupo)}>
                      Ver detalle
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Profesor</TableHead>
                    <TableHead className="text-center">Presentes</TableHead>
                    <TableHead className="text-center">Ausentes</TableHead>
                    <TableHead className="text-center">Tarde</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asistenciasFiltradas.map((grupo, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(grupo.fecha), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{grupo.curso_nombre}</TableCell>
                      <TableCell>{grupo.profesor_nombre}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          {grupo.presentes}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                          {grupo.ausentes}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          {grupo.tarde}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{grupo.total_estudiantes}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(grupo)}>
                          Ver detalle
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para mostrar detalle de asistencia */}
      <Dialog open={showDetalleDialog} onOpenChange={setShowDetalleDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Asistencia</DialogTitle>
            {detalleAsistencia && (
              <DialogDescription>
                Curso: {detalleAsistencia.curso_nombre} | Profesor: {detalleAsistencia.profesor_nombre} | Fecha:{" "}
                {format(new Date(detalleAsistencia.fecha), "dd/MM/yyyy")}
              </DialogDescription>
            )}
          </DialogHeader>

          {detalleAsistencia && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Lista de estudiantes</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Presentes: {detalleAsistencia.presentes}
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    Tarde: {detalleAsistencia.tarde}
                  </Badge>
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    Ausentes: {detalleAsistencia.ausentes}
                  </Badge>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Comentario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalleAsistencia.registros.map((registro) => (
                      <TableRow key={registro.id}>
                        <TableCell>{getEstudianteNombre(registro)}</TableCell>
                        <TableCell>{registro.estudiantes?.matricula || "N/A"}</TableCell>
                        <TableCell>{getEstadoBadge(registro.estado)}</TableCell>
                        <TableCell>{registro.comentario || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Attendance
