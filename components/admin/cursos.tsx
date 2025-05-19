"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMediaQuery } from "@/hooks/use-media-query"
import { MobileCardView } from "@/components/mobile-card-view"

import {
  getCursos,
  createCurso,
  updateCurso,
  deleteCurso,
  verificarConflictoHorarioProfesor,
  verificarConflictoHorarioAula,
  type Curso,
} from "@/lib/api/cursos"
import { getProfesores, type Profesor } from "@/lib/api/profesores"
import { getMaterias, type Materia } from "@/lib/api/materias"
import { getAulas, type Aula } from "@/lib/api/aulas"
import { getPeriodosAcademicos, type PeriodoAcademico } from "@/lib/api/periodos"

export function Cursos() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCursos, setTotalCursos] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // Días de la semana disponibles
  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  // Formulario
  const [formData, setFormData] = useState<{
    tutor_id: number | null
    subject_id: number | null
    horario_inicio: string
    horario_fin: string
    dias_semana: string[]
    aula_id: number | null
    periodo_id: number | null
    capacidad_maxima: number
    estado: string
  }>({
    tutor_id: null,
    subject_id: null,
    horario_inicio: "",
    horario_fin: "",
    dias_semana: [],
    aula_id: null,
    periodo_id: null,
    capacidad_maxima: 30,
    estado: "activo",
  })

  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [currentPage, pageSize])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [cursosData, profesoresData, materiasData, aulasData, periodosData] = await Promise.all([
        getCursos(),
        getProfesores(),
        getMaterias(),
        getAulas(),
        getPeriodosAcademicos(),
      ])

      setTotalCursos(cursosData.length)
      setTotalPages(Math.ceil(cursosData.length / pageSize))

      // Simulamos la paginación en el cliente
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedData = cursosData.slice(startIndex, endIndex)

      setCursos(paginatedData)
      setProfesores(profesoresData)
      setMaterias(materiasData)
      setAulas(aulasData)
      setPeriodos(periodosData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar los datos"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: id === "capacidad_maxima" ? Number.parseInt(value, 10) : value,
    }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value === "" ? null : Number.parseInt(value, 10),
    }))
  }

  const handleDiaChange = (dia: string, isChecked: boolean) => {
    setFormData((prev) => {
      if (isChecked) {
        return {
          ...prev,
          dias_semana: [...prev.dias_semana, dia],
        }
      } else {
        return {
          ...prev,
          dias_semana: prev.dias_semana.filter((d) => d !== dia),
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      // Validar datos
      if (
        !formData.tutor_id ||
        !formData.subject_id ||
        !formData.horario_inicio ||
        !formData.horario_fin ||
        formData.dias_semana.length === 0
      ) {
        setFormError("Por favor complete todos los campos obligatorios")
        setIsSubmitting(false)
        return
      }

      // Validar que la hora de fin sea posterior a la hora de inicio
      const inicioTime = new Date(`2000-01-01T${formData.horario_inicio}`)
      const finTime = new Date(`2000-01-01T${formData.horario_fin}`)
      if (finTime <= inicioTime) {
        setFormError("La hora de fin debe ser posterior a la hora de inicio")
        setIsSubmitting(false)
        return
      }

      // Verificar conflictos de horario para el profesor
      const conflictoProfesor = await verificarConflictoHorarioProfesor(
        formData.tutor_id,
        formData.horario_inicio,
        formData.horario_fin,
        formData.dias_semana,
        editingId || undefined,
      )

      if (conflictoProfesor) {
        setFormError("El profesor ya tiene un curso asignado en ese horario")
        setIsSubmitting(false)
        return
      }

      // Verificar conflictos de horario para el aula (si se seleccionó una)
      if (formData.aula_id) {
        const conflictoAula = await verificarConflictoHorarioAula(
          formData.aula_id,
          formData.horario_inicio,
          formData.horario_fin,
          formData.dias_semana,
          editingId || undefined,
        )

        if (conflictoAula) {
          setFormError("El aula ya está ocupada en ese horario")
          setIsSubmitting(false)
          return
        }
      }

      // Preparar datos para enviar
      const cursoData = {
        tutor_id: formData.tutor_id,
        subject_id: formData.subject_id,
        horario_inicio: formData.horario_inicio,
        horario_fin: formData.horario_fin,
        dias_semana: formData.dias_semana,
        aula_id: formData.aula_id,
        periodo_id: formData.periodo_id,
        capacidad_maxima: formData.capacidad_maxima,
        estado: formData.estado,
      }

      if (editingId) {
        // Actualizar curso existente
        await updateCurso(editingId, cursoData)
        toast({
          title: "Éxito",
          description: "Curso actualizado correctamente",
        })
      } else {
        // Crear nuevo curso
        await createCurso(cursoData)
        toast({
          title: "Éxito",
          description: "Curso creado correctamente",
        })
      }

      // Recargar datos y cerrar diálogo
      await loadData()
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      console.error("Error al guardar curso:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al guardar curso"
      setFormError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este curso?")) return

    try {
      await deleteCurso(id)
      toast({
        title: "Éxito",
        description: "Curso eliminado correctamente",
      })

      // Si estamos en la última página y eliminamos el único elemento, volvemos a la página anterior
      if (currentPage > 1 && cursos.length === 1) {
        setCurrentPage(currentPage - 1)
      } else {
        await loadData()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar curso"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (curso: Curso) => {
    setEditingId(curso.id)
    setFormData({
      tutor_id: curso.tutor_id,
      subject_id: curso.subject_id,
      horario_inicio: curso.horario_inicio,
      horario_fin: curso.horario_fin,
      dias_semana: curso.dias_semana,
      aula_id: curso.aula_id || null,
      periodo_id: curso.periodo_id || null,
      capacidad_maxima: curso.capacidad_maxima || 30,
      estado: curso.estado || "activo",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      tutor_id: null,
      subject_id: null,
      horario_inicio: "",
      horario_fin: "",
      dias_semana: [],
      aula_id: null,
      periodo_id: null,
      capacidad_maxima: 30,
      estado: "activo",
    })
    setEditingId(null)
    setFormError(null)
  }

  const handleOpenDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handlePageSizeChange = (value: string) => {
    const newSize = Number.parseInt(value, 10)
    setPageSize(newSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Filtrar cursos según término de búsqueda
  const filteredCursos = cursos.filter((curso) => {
    if (!searchTerm) return true

    const profesorNombre =
      `${curso.profesores?.usuarios?.first_name || ""} ${curso.profesores?.usuarios?.last_name || ""}`.toLowerCase()
    const materiaNombre = curso.materias?.name?.toLowerCase() || ""
    const aulaNombre = curso.aulas?.name?.toLowerCase() || ""
    const searchTermLower = searchTerm.toLowerCase()

    return (
      profesorNombre.includes(searchTermLower) ||
      materiaNombre.includes(searchTermLower) ||
      aulaNombre.includes(searchTermLower)
    )
  })

  // Función para obtener el nombre del profesor
  const getProfesorNombre = (curso: Curso) => {
    return (
      `${curso.profesores?.usuarios?.first_name || ""} ${curso.profesores?.usuarios?.last_name || ""}`.trim() ||
      "Sin asignar"
    )
  }

  // Función para formatear los días de la semana
  const formatDiasSemana = (dias: string[]) => {
    if (dias.length === 0) return "No especificado"
    if (dias.length > 3) return `${dias.length} días`
    return dias.join(", ")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando cursos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <h2 className="font-bold">Error al cargar cursos</h2>
        <p>{error}</p>
        <Button onClick={loadData} variant="outline" className="mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cursos</h1>
          <p className="text-muted-foreground">Gestiona los cursos del centro educativo</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cursos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar cursos"
            />
          </div>
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir Curso
          </Button>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {filteredCursos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron cursos</p>
          ) : (
            filteredCursos.map((curso) => (
              <MobileCardView
                key={curso.id}
                title={curso.materias?.name || "Sin materia"}
                subtitle={getProfesorNombre(curso)}
                items={[
                  { label: "Horario", value: `${curso.horario_inicio} - ${curso.horario_fin}` },
                  { label: "Días", value: formatDiasSemana(curso.dias_semana) },
                  { label: "Aula", value: curso.aulas?.name || "Sin asignar" },
                  {
                    label: "Estado",
                    value: (
                      <Badge
                        variant={curso.estado === "activo" ? "default" : "secondary"}
                        className={curso.estado === "activo" ? "bg-green-500" : "bg-gray-500"}
                      >
                        {curso.estado === "activo" ? "Activo" : curso.estado}
                      </Badge>
                    ),
                  },
                ]}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(curso)}
                      aria-label={`Editar curso ${curso.materias?.name}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(curso.id)}
                      aria-label={`Eliminar curso ${curso.materias?.name}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </>
                }
              />
            ))
          )}

          {/* Paginación móvil */}
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className="px-4 py-2">
                    {currentPage} / {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cursos</CardTitle>
            <CardDescription>
              Mostrando {filteredCursos.length} de {totalCursos} cursos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Lista de cursos del centro</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Materia</TableHead>
                  <TableHead>Profesor</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead>Aula</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCursos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      No se encontraron cursos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCursos.map((curso) => (
                    <TableRow key={curso.id}>
                      <TableCell className="font-medium">{curso.materias?.name || "Sin materia"}</TableCell>
                      <TableCell>{getProfesorNombre(curso)}</TableCell>
                      <TableCell>{`${curso.horario_inicio} - ${curso.horario_fin}`}</TableCell>
                      <TableCell>{formatDiasSemana(curso.dias_semana)}</TableCell>
                      <TableCell>{curso.aulas?.name || "Sin asignar"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={curso.estado === "activo" ? "default" : "secondary"}
                          className={curso.estado === "activo" ? "bg-green-500" : "bg-gray-500"}
                        >
                          {curso.estado === "activo" ? "Activo" : curso.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(curso)}
                            aria-label={`Editar curso ${curso.materias?.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(curso.id)}
                            aria-label={`Eliminar curso ${curso.materias?.name}`}
                          >
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
          <CardFooter className="flex flex-col gap-4">
            <div className="flex items-center justify-center w-full gap-2">
              <span className="text-sm text-muted-foreground">Mostrar</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">por página</span>
            </div>

            <div className="flex justify-center w-full">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>

                  {/* Números de página */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Mostrar 5 páginas centradas en la página actual
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <PaginationItem key={pageNum}>
                          <Button
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="icon"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        </PaginationItem>
                      )
                    }
                    return null
                  })}

                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardFooter>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Curso" : "Añadir Curso"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos del curso" : "Introduce los datos del nuevo curso"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4">
              <h3 className="text-lg font-medium">Datos básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tutor_id">Profesor</Label>
                  <Select
                    value={formData.tutor_id?.toString() || "0"}
                    onValueChange={(value) => handleSelectChange("tutor_id", value)}
                  >
                    <SelectTrigger id="tutor_id">
                      <SelectValue placeholder="Selecciona un profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {profesores.map((profesor) => (
                        <SelectItem key={profesor.id} value={profesor.id.toString()}>
                          {`${profesor.usuarios?.first_name || ""} ${profesor.usuarios?.last_name || ""}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject_id">Materia</Label>
                  <Select
                    value={formData.subject_id?.toString() || "0"}
                    onValueChange={(value) => handleSelectChange("subject_id", value)}
                  >
                    <SelectTrigger id="subject_id">
                      <SelectValue placeholder="Selecciona una materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {materias.map((materia) => (
                        <SelectItem key={materia.id} value={materia.id.toString()}>
                          {materia.name} ({materia.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-4">Horario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="horario_inicio">Hora de inicio</Label>
                  <Input
                    id="horario_inicio"
                    type="time"
                    value={formData.horario_inicio}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="horario_fin">Hora de fin</Label>
                  <Input
                    id="horario_fin"
                    type="time"
                    value={formData.horario_fin}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Días de la semana</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border p-4 rounded-md">
                  {diasSemana.map((dia) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dia-${dia}`}
                        checked={formData.dias_semana.includes(dia)}
                        onCheckedChange={(checked) => handleDiaChange(dia, checked === true)}
                      />
                      <Label htmlFor={`dia-${dia}`} className="cursor-pointer">
                        {dia}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-lg font-medium mt-4">Ubicación y periodo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="aula_id">Aula</Label>
                  <Select
                    value={formData.aula_id?.toString() || "0"}
                    onValueChange={(value) => handleSelectChange("aula_id", value)}
                  >
                    <SelectTrigger id="aula_id">
                      <SelectValue placeholder="Selecciona un aula" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin asignar</SelectItem>
                      {aulas.map((aula) => (
                        <SelectItem key={aula.id} value={aula.id.toString()}>
                          {aula.name} (Cap: {aula.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="periodo_id">Periodo académico</Label>
                  <Select
                    value={formData.periodo_id?.toString() || "0"}
                    onValueChange={(value) => handleSelectChange("periodo_id", value)}
                  >
                    <SelectTrigger id="periodo_id">
                      <SelectValue placeholder="Selecciona un periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin asignar</SelectItem>
                      {periodos.map((periodo) => (
                        <SelectItem key={periodo.id} value={periodo.id.toString()}>
                          {periodo.name} ({periodo.academic_year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacidad_maxima">Capacidad máxima</Label>
                  <Input
                    id="capacidad_maxima"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacidad_maxima}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, estado: value }))}
                  >
                    <SelectTrigger id="estado">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
