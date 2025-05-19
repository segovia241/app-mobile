"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/hooks/use-toast"
import {
  type Estudiante,
  getEstudiantes,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante,
} from "@/lib/api/estudiantes"
import { createUsuario } from "@/lib/api/usuarios"
import { getCursos } from "@/lib/api/cursos"
import { createInscripcionCurso } from "@/lib/api/inscripciones-cursos"
import { Pencil, Trash2, UserPlus, Search, X, BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { fetchAPI } from "@/lib/api/config"

// Esquema de validación para el formulario de estudiante
const studentFormSchema = z.object({
  cedula: z.string().min(1, "La cédula es requerida"),
  nombres: z.string().min(1, "Los nombres son requeridos"),
  apellidos: z.string().min(1, "Los apellidos son requeridos"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.string().optional(),
  estado: z.string().optional(),
})

interface InscripcionCurso {
  id: number
  estudiante_id: number
  curso_id: number
  estado: string
  curso?: {
    id: number
    materia_id: number
    profesor_id: number
    horario: string
    dias_semana: string
    materia?: {
      id: number
      nombre: string
      codigo: string
    }
  }
}

export function Students() {
  const [students, setStudents] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState<Estudiante | null>(null)
  const [cursos, setCursos] = useState<any[]>([])
  const [selectedCursos, setSelectedCursos] = useState<number[]>([])
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [enrollStudentId, setEnrollStudentId] = useState<number | null>(null)
  const [inscripcionesExistentes, setInscripcionesExistentes] = useState<{ [key: number]: number[] }>({})
  const [inscripcionesDetalle, setInscripcionesDetalle] = useState<{ [key: number]: InscripcionCurso[] }>({})
  const [isViewEnrollmentsDialogOpen, setIsViewEnrollmentsDialogOpen] = useState(false)
  const [viewEnrollmentsStudentId, setViewEnrollmentsStudentId] = useState<number | null>(null)
  const isMobile = useMobile()
  // Añadir estado para expandir estudiantes
  const [expandedStudents, setExpandedStudents] = useState<Record<number, boolean>>({})

  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      cedula: "",
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      direccion: "",
      fecha_nacimiento: "",
      genero: "",
      estado: "Activo",
    },
  })

  const editForm = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      cedula: "",
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      direccion: "",
      fecha_nacimiento: "",
      genero: "",
      estado: "Activo",
    },
  })

  useEffect(() => {
    loadStudents()
    loadCursos()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const data = await getEstudiantes()
      setStudents(data)
    } catch (error) {
      console.error("Error al cargar estudiantes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCursos = async () => {
    try {
      const data = await getCursos()
      // Cargar información de materias para cada curso
      const cursosConMaterias = await Promise.all(
        data.map(async (curso) => {
          if (curso.materia_id) {
            const materias = await fetchAPI(`materias?id=eq.${curso.materia_id}&select=*`)
            if (materias && materias.length > 0) {
              return { ...curso, materia: materias[0] }
            }
          }
          return curso
        }),
      )
      setCursos(cursosConMaterias)
    } catch (error) {
      console.error("Error al cargar cursos:", error)
    }
  }

  const handleAddStudent = async (data: z.infer<typeof studentFormSchema>) => {
    try {
      // Generar matrícula automáticamente
      const matriculaGenerada = `EST${Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0")}`

      // Autogenerar username basado en cédula
      const username = `A${data.cedula}`

      // Generar valores para campos ocultos
      const mockPassword = "password123"
      const mockCarrera = "Ingeniería Informática"
      const mockSemestre = 1

      // Primero crear el usuario
      const usuario = await createUsuario({
        username: username,
        password: mockPassword,
        email: data.email,
        role: "estudiante",
      })

      // Luego crear el estudiante
      const newStudent = await createEstudiante({
        usuario_id: usuario.id,
        matricula: matriculaGenerada,
        cedula: data.cedula,
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        fecha_nacimiento: data.fecha_nacimiento,
        genero: data.genero,
        carrera: mockCarrera,
        semestre: mockSemestre,
        estado: data.estado,
      })

      setStudents([...students, newStudent])
      setIsAddDialogOpen(false)
      form.reset()
      toast({
        title: "Éxito",
        description: "Estudiante creado correctamente",
      })
    } catch (error) {
      console.error("Error al crear estudiante:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el estudiante",
        variant: "destructive",
      })
    }
  }

  const handleEditStudent = async (data: z.infer<typeof studentFormSchema>) => {
    if (!currentStudent) return

    try {
      // Mantener la matrícula existente
      const updatedStudent = await updateEstudiante(currentStudent.id, {
        matricula: currentStudent.matricula, // Mantener la matrícula existente
        cedula: data.cedula,
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        fecha_nacimiento: data.fecha_nacimiento,
        genero: data.genero,
        carrera: currentStudent.carrera, // Mantener la carrera existente
        semestre: currentStudent.semestre, // Mantener el semestre existente
        estado: data.estado,
      })

      setStudents(students.map((s) => (s.id === currentStudent.id ? updatedStudent : s)))
      setIsEditDialogOpen(false)
      setCurrentStudent(null)
      toast({
        title: "Éxito",
        description: "Estudiante actualizado correctamente",
      })
    } catch (error) {
      console.error("Error al actualizar estudiante:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estudiante",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStudent = async (id: number) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este estudiante? Esta acción no se puede deshacer.")) return

    try {
      await deleteEstudiante(id)
      setStudents(students.filter((s) => s.id !== id))
      toast({
        title: "Éxito",
        description: "Estudiante eliminado correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar estudiante:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el estudiante",
        variant: "destructive",
      })
    }
  }

  const loadInscripcionesEstudiante = async (estudianteId: number) => {
    try {
      // Cargar las inscripciones existentes para este estudiante con información de cursos y materias
      const inscripciones = await fetchAPI(
        `inscripciones_cursos?estudiante_id=eq.${estudianteId}&select=*,curso:cursos(id,materia_id,profesor_id,horario,dias_semana,materia:materias(id,nombre,codigo))`,
      )

      const cursosInscritos = inscripciones.map((i: InscripcionCurso) => i.curso_id)

      // Actualizar el estado con los cursos en los que ya está inscrito
      setInscripcionesExistentes({
        ...inscripcionesExistentes,
        [estudianteId]: cursosInscritos,
      })

      // Guardar los detalles de las inscripciones
      setInscripcionesDetalle({
        ...inscripcionesDetalle,
        [estudianteId]: inscripciones,
      })

      return cursosInscritos
    } catch (error) {
      console.error("Error al cargar inscripciones:", error)
      return []
    }
  }

  const handleEnrollStudent = async () => {
    if (!enrollStudentId || selectedCursos.length === 0) return

    try {
      // Obtener los cursos en los que ya está inscrito el estudiante
      const cursosInscritos =
        inscripcionesExistentes[enrollStudentId] || (await loadInscripcionesEstudiante(enrollStudentId))

      // Filtrar solo los cursos que no están ya inscritos
      const cursosPorInscribir = selectedCursos.filter((cursoId) => !cursosInscritos.includes(cursoId))

      if (cursosPorInscribir.length === 0) {
        toast({
          title: "Información",
          description: "El estudiante ya está inscrito en todos los cursos seleccionados",
        })
        setIsEnrollDialogOpen(false)
        setSelectedCursos([])
        return
      }

      // Inscribir al estudiante en cada curso seleccionado que no esté ya inscrito
      for (const cursoId of cursosPorInscribir) {
        await createInscripcionCurso({
          estudiante_id: enrollStudentId,
          curso_id: cursoId,
          estado: "Inscrito",
        })
      }

      setIsEnrollDialogOpen(false)
      setSelectedCursos([])
      setEnrollStudentId(null)

      // Actualizar las inscripciones existentes
      if (enrollStudentId) {
        await loadInscripcionesEstudiante(enrollStudentId)
      }

      toast({
        title: "Éxito",
        description: `Estudiante inscrito correctamente en ${cursosPorInscribir.length} curso(s)`,
      })
    } catch (error) {
      console.error("Error al inscribir estudiante:", error)
      toast({
        title: "Error",
        description: "No se pudo inscribir al estudiante en los cursos",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEnrollment = async (inscripcionId: number, estudianteId: number) => {
    if (!confirm("¿Está seguro de eliminar esta inscripción? Esta acción no se puede deshacer.")) return

    try {
      // Eliminar la inscripción
      await fetchAPI(`inscripciones_cursos?id=eq.${inscripcionId}`, {
        method: "DELETE",
      })

      // Actualizar el estado local
      if (inscripcionesDetalle[estudianteId]) {
        const updatedInscripciones = inscripcionesDetalle[estudianteId].filter(
          (inscripcion) => inscripcion.id !== inscripcionId,
        )

        setInscripcionesDetalle({
          ...inscripcionesDetalle,
          [estudianteId]: updatedInscripciones,
        })

        // Actualizar también el array de IDs de cursos inscritos
        setInscripcionesExistentes({
          ...inscripcionesExistentes,
          [estudianteId]: updatedInscripciones.map((i) => i.curso_id),
        })
      }

      toast({
        title: "Éxito",
        description: "Inscripción eliminada correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar inscripción:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la inscripción",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (student: Estudiante) => {
    setCurrentStudent(student)
    editForm.reset({
      cedula: student.cedula,
      nombres: student.nombres,
      apellidos: student.apellidos,
      email: student.email,
      telefono: student.telefono || "",
      direccion: student.direccion || "",
      fecha_nacimiento: student.fecha_nacimiento || "",
      genero: student.genero || "",
      estado: student.estado || "Activo",
    })
    setIsEditDialogOpen(true)
  }

  const openEnrollDialog = async (studentId: number) => {
    setEnrollStudentId(studentId)
    setSelectedCursos([])

    // Cargar las inscripciones existentes para este estudiante
    await loadInscripcionesEstudiante(studentId)

    setIsEnrollDialogOpen(true)
  }

  const openViewEnrollmentsDialog = async (studentId: number) => {
    setViewEnrollmentsStudentId(studentId)

    // Cargar las inscripciones existentes para este estudiante si no están cargadas
    if (!inscripcionesDetalle[studentId] || inscripcionesDetalle[studentId].length === 0) {
      await loadInscripcionesEstudiante(studentId)
    }

    setIsViewEnrollmentsDialogOpen(true)
  }

  const filteredStudents = students.filter(
    (student) =>
      student.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.cedula.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleCursoSelection = (cursoId: number) => {
    if (selectedCursos.includes(cursoId)) {
      setSelectedCursos(selectedCursos.filter((id) => id !== cursoId))
    } else {
      setSelectedCursos([...selectedCursos, cursoId])
    }
  }

  const isCursoInscrito = (cursoId: number) => {
    return (
      enrollStudentId &&
      inscripcionesExistentes[enrollStudentId] &&
      inscripcionesExistentes[enrollStudentId].includes(cursoId)
    )
  }

  // Añadir función para alternar la expansión
  const toggleExpand = (studentId: number) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  if (loading) {
    return <div className="flex justify-center p-4">Cargando estudiantes...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estudiantes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-2.5"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Estudiante</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4">
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Estudiante</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddStudent)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cedula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cédula</FormLabel>
                        <FormControl>
                          <Input placeholder="Cédula" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nombres"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombres</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombres" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apellidos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellidos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Teléfono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fecha_nacimiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="genero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Género</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar género" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Femenino</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "Activo"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Activo">Activo</SelectItem>
                            <SelectItem value="Inactivo">Inactivo</SelectItem>
                            <SelectItem value="Egresado">Egresado</SelectItem>
                            <SelectItem value="Suspendido">Suspendido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="direccion"
                    render={({ field }) => (
                      <FormItem className="col-span-1 sm:col-span-2">
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Dirección" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {filteredStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron estudiantes</p>
          ) : (
            filteredStudents.map((student) => (
              <Card key={student.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <span>
                      {student.nombres} {student.apellidos}
                    </span>
                    <Badge variant="outline">{student.matricula}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </CardHeader>
                <CardContent className="pb-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => toggleExpand(student.id)}>
                    {expandedStudents[student.id] ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" /> Mostrar menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" /> Mostrar más
                      </>
                    )}
                  </Button>

                  {expandedStudents[student.id] && (
                    <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Cédula:</span>
                        <span>{student.cedula}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Teléfono:</span>
                        <span>{student.telefono || "No especificado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Estado:</span>
                        <span>{student.estado || "Activo"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Género:</span>
                        <span>{student.genero || "No especificado"}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 pt-0 justify-end">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(student)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEnrollDialog(student.id)}>
                    Inscribir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openViewEnrollmentsDialog(student.id)}>
                    <BookOpen className="h-4 w-4 mr-1" />
                    Cursos
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Estudiantes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nombres</TableHead>
                  <TableHead>Apellidos</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Carrera</TableHead>
                  <TableHead>Semestre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No hay estudiantes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.matricula}</TableCell>
                      <TableCell>{student.nombres}</TableCell>
                      <TableCell>{student.apellidos}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.carrera || "-"}</TableCell>
                      <TableCell>{student.semestre || "-"}</TableCell>
                      <TableCell>{student.estado || "Activo"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(student)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEnrollDialog(student.id)}>
                            Inscribir
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openViewEnrollmentsDialog(student.id)}>
                            <BookOpen className="h-4 w-4" title="Ver inscripciones" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteStudent(student.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Editar Estudiante</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditStudent)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="cedula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cédula</FormLabel>
                      <FormControl>
                        <Input placeholder="Cédula" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellidos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem className="col-span-1 sm:col-span-2">
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="fecha_nacimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="genero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Inactivo">Inactivo</SelectItem>
                          <SelectItem value="Egresado">Egresado</SelectItem>
                          <SelectItem value="Suspendido">Suspendido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Actualizar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de inscripción a cursos */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader className="pb-2">
            <DialogTitle>Inscribir Estudiante en Cursos</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Seleccione los cursos:</h3>
              <div className="grid grid-cols-1 gap-2 max-h-[calc(60vh-100px)] overflow-y-auto border rounded-md p-2">
                {cursos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay cursos disponibles</p>
                ) : (
                  cursos.map((curso) => {
                    const yaInscrito = isCursoInscrito(curso.id)
                    return (
                      <div key={curso.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`curso-${curso.id}`}
                          checked={selectedCursos.includes(curso.id) || yaInscrito}
                          onChange={() => toggleCursoSelection(curso.id)}
                          disabled={yaInscrito}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`curso-${curso.id}`}
                          className={`text-sm ${yaInscrito ? "text-muted-foreground" : ""}`}
                        >
                          {curso.materia?.nombre || `Curso ${curso.id}`} - {curso.horario} ({curso.dias_semana})
                          {yaInscrito && " (Ya inscrito)"}
                        </label>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleEnrollStudent}
                disabled={
                  selectedCursos.length === 0 ||
                  (enrollStudentId &&
                    selectedCursos.every((id) => inscripcionesExistentes[enrollStudentId]?.includes(id)))
                }
              >
                Inscribir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver y gestionar inscripciones */}
      <Dialog open={isViewEnrollmentsDialogOpen} onOpenChange={setIsViewEnrollmentsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Inscripciones del Estudiante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewEnrollmentsStudentId && inscripcionesDetalle[viewEnrollmentsStudentId]?.length > 0 ? (
              <div className="space-y-4">
                {isMobile ? (
                  <div className="space-y-3">
                    {inscripcionesDetalle[viewEnrollmentsStudentId].map((inscripcion) => (
                      <Card key={inscripcion.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">
                                {inscripcion.curso?.materia?.nombre || `Curso ${inscripcion.curso_id}`}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {inscripcion.curso?.horario} ({inscripcion.curso?.dias_semana})
                              </p>
                            </div>
                            <Badge>{inscripcion.estado}</Badge>
                          </div>
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEnrollment(inscripcion.id, viewEnrollmentsStudentId)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Materia</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inscripcionesDetalle[viewEnrollmentsStudentId].map((inscripcion) => (
                        <TableRow key={inscripcion.id}>
                          <TableCell>{inscripcion.curso?.materia?.nombre || `Curso ${inscripcion.curso_id}`}</TableCell>
                          <TableCell>
                            {inscripcion.curso?.horario} ({inscripcion.curso?.dias_semana})
                          </TableCell>
                          <TableCell>{inscripcion.estado}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEnrollment(inscripcion.id, viewEnrollmentsStudentId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Este estudiante no está inscrito en ningún curso</p>
            )}
            <div className="flex justify-end">
              <Button type="button" onClick={() => setIsViewEnrollmentsDialogOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
