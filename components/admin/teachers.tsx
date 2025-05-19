"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Plus,
  Pencil,
  Trash,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useToast } from "@/hooks/use-toast"
import { getProfesores, createProfesor, updateProfesor, deleteProfesor, type Profesor } from "@/lib/api/profesores"
import { createUsuario, updateUsuario, deleteUsuario } from "@/lib/api/usuarios"
import { getMaterias, type Materia } from "@/lib/api/materias"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"

export function Teachers() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [expandedTeachers, setExpandedTeachers] = useState<Record<number, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Datos de usuario
    email: "",
    username: "",
    password: "",
    role: "profesor", // Cambiado de 'teacher' a 'profesor'
    // Datos de profesor
    cedula: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    especialidad: "",
    titulo: "",
    fecha_contratacion: "",
    estado: "active",
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProfesores, setTotalProfesores] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [currentPage, pageSize])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [profesoresData, materiasData] = await Promise.all([getProfesores(), getMaterias()])

      setTotalProfesores(profesoresData.length)
      setTotalPages(Math.ceil(profesoresData.length / pageSize))

      // Simulamos la paginación en el cliente
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedData = profesoresData.slice(startIndex, endIndex)

      setProfesores(paginatedData)
      setMaterias(materiasData)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  // Función para generar un nombre de usuario único basado en el nombre y apellido
  const generateUniqueUsername = (firstName: string, lastName: string) => {
    const base = `${firstName.toLowerCase().replace(/\s+/g, "")}.${lastName.toLowerCase().replace(/\s+/g, "")}`
    // Añadir un timestamp para garantizar unicidad
    const timestamp = new Date().getTime().toString().slice(-4)
    return `${base}${timestamp}`
  }

  // Simplificar la interfaz de añadir docentes para que sea similar a la de añadir alumnos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Valores automáticos para los campos ocultos
      const especialidadAutomatica = "Educación General"
      const tituloAutomatico = "Licenciado en Educación"

      if (editingId) {
        // Actualizar profesor existente
        const profesorData = {
          cedula: formData.cedula,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          especialidad: especialidadAutomatica, // Valor automático
          titulo: tituloAutomatico, // Valor automático
          fecha_contratacion: formData.fecha_contratacion,
          estado: formData.estado,
        }

        // Actualizar datos del profesor
        await updateProfesor(editingId, profesorData)

        // Actualizar datos del usuario si hay un userId
        if (editingUserId) {
          const usuarioData = {
            email: formData.email,
            // No actualizamos username ni password a menos que se proporcionen nuevos valores
            ...(formData.password ? { password: formData.password } : {}),
          }
          await updateUsuario(editingUserId, usuarioData)
        }

        toast({
          title: "Éxito",
          description: "Profesor actualizado correctamente",
        })
      } else {
        // Crear nuevo usuario primero
        // Generar un nombre de usuario único basado en nombre y apellido
        const uniqueUsername = generateUniqueUsername(formData.nombres, formData.apellidos)

        const usuarioData = {
          username: formData.username || uniqueUsername,
          password: formData.password || "password123", // En producción, generar una contraseña segura
          email: formData.email,
          role: "profesor", // Usar 'profesor' en lugar de 'teacher'
        }

        console.log("Creando usuario con datos:", usuarioData)
        const nuevoUsuarioResponse = await createUsuario(usuarioData)
        console.log("Nuevo usuario creado:", nuevoUsuarioResponse)

        // Verificar si la respuesta es un array y extraer el primer elemento
        const nuevoUsuario = Array.isArray(nuevoUsuarioResponse) ? nuevoUsuarioResponse[0] : nuevoUsuarioResponse

        if (!nuevoUsuario || !nuevoUsuario.id) {
          throw new Error("No se pudo crear el usuario correctamente")
        }

        // Generar ID automático para el profesor
        const teacherId = `TCH${nuevoUsuario.id.toString().padStart(5, "0")}`

        const profesorData = {
          usuario_id: nuevoUsuario.id,
          cedula: formData.cedula || teacherId,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          especialidad: especialidadAutomatica, // Valor automático
          titulo: tituloAutomatico, // Valor automático
          fecha_contratacion: formData.fecha_contratacion,
          estado: formData.estado,
        }

        console.log("Creando profesor con datos:", profesorData)
        await createProfesor(profesorData)

        toast({
          title: "Éxito",
          description: "Profesor creado correctamente",
        })
      }

      // Recargar datos y cerrar diálogo
      await loadData()
      setIsAddOpen(false)
      setIsEditOpen(false)
      resetForm()
    } catch (err) {
      console.error("Error al guardar profesor:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al guardar profesor"

      // Verificar si es un error de duplicado
      if (errorMessage.includes("duplicate key") || errorMessage.includes("already exists")) {
        toast({
          title: "Error",
          description: "Ya existe un usuario con ese nombre de usuario o correo electrónico",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProfesor = async (id: number, userId?: number) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este profesor? Esta acción no se puede deshacer.")) return

    try {
      // Primero intentamos eliminar el profesor
      await deleteProfesor(id)

      // Si hay un userId asociado, intentamos eliminar el usuario también
      if (userId) {
        try {
          await deleteUsuario(userId)
        } catch (userErr) {
          // Si falla la eliminación del usuario, lo registramos pero no interrumpimos el flujo
          console.error("No se pudo eliminar el usuario asociado:", userErr)
        }
      }

      // Si estamos en la última página y eliminamos el único elemento, volvemos a la página anterior
      if (currentPage > 1 && profesores.length === 1) {
        setCurrentPage(currentPage - 1)
      } else {
        await loadData()
      }

      toast({
        title: "Éxito",
        description: "Profesor eliminado correctamente",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar profesor"

      // Verificar si es un error de restricción de clave foránea
      if (errorMessage.includes("foreign key constraint") || errorMessage.includes("referenced")) {
        toast({
          title: "Error",
          description:
            "No se puede eliminar este profesor porque tiene registros asociados (horarios, asistencias, etc.)",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const openEditDialog = async (profesor: Profesor) => {
    setEditingId(profesor.id)
    setEditingUserId(profesor.usuario_id || null)

    // Inicializar con datos del profesor
    setFormData({
      email: profesor.email || "",
      username: "", // No mostramos el username actual por seguridad
      password: "", // No mostramos la contraseña actual por seguridad
      role: "profesor",
      cedula: profesor.cedula || "",
      nombres: profesor.nombres || "",
      apellidos: profesor.apellidos || "",
      telefono: profesor.telefono || "",
      especialidad: profesor.especialidad || "",
      titulo: profesor.titulo || "",
      fecha_contratacion: profesor.fecha_contratacion || "",
      estado: profesor.estado || "active",
    })

    setIsEditOpen(true)
  }

  const resetForm = () => {
    setFormData({
      email: "",
      username: "",
      password: "",
      role: "profesor",
      cedula: "",
      nombres: "",
      apellidos: "",
      telefono: "",
      especialidad: "",
      titulo: "",
      fecha_contratacion: "",
      estado: "active",
    })
    setEditingId(null)
    setEditingUserId(null)
  }

  const toggleExpand = (teacherId: number) => {
    setExpandedTeachers((prev) => ({
      ...prev,
      [teacherId]: !prev[teacherId],
    }))
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

  // Filtrar profesores
  const filteredProfesores = profesores.filter((profesor) => {
    const fullName = `${profesor.nombres || ""} ${profesor.apellidos || ""}`.toLowerCase()
    const email = profesor.email?.toLowerCase() || ""
    const especialidad = profesor.especialidad?.toLowerCase() || ""

    const matchesSearch =
      !searchTerm ||
      fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      especialidad.includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && profesor.estado === "active") ||
      (statusFilter === "inactive" && profesor.estado === "inactive")

    return matchesSearch && matchesStatus
  })

  // Función para obtener el nombre completo
  const getFullName = (profesor: Profesor) => {
    return `${profesor.nombres || ""} ${profesor.apellidos || ""}`.trim() || "Sin nombre"
  }

  // Simplificar el formulario de añadir/editar docente
  const formContent = (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nombres">Nombre</Label>
          <Input id="nombres" value={formData.nombres} onChange={handleInputChange} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="apellidos">Apellidos</Label>
          <Input id="apellidos" value={formData.apellidos} onChange={handleInputChange} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" type="tel" value={formData.telefono} onChange={handleInputChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cedula">Cédula</Label>
          <Input id="cedula" value={formData.cedula} onChange={handleInputChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fecha_contratacion">Fecha de contratación</Label>
          <Input id="fecha_contratacion" type="date" value={formData.fecha_contratacion} onChange={handleInputChange} />
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
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!editingId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="username">Nombre de usuario (opcional)</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Se generará automáticamente si se deja en blanco"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Dejar en blanco para usar contraseña por defecto"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando profesores...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <h2 className="font-bold">Error al cargar profesores</h2>
        <p>{error}</p>
        <Button onClick={loadData} variant="outline" className="mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profesores</h1>
          <p className="text-muted-foreground">Gestiona los profesores del centro educativo</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar docentes..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Button className="whitespace-nowrap" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Agregar Docente</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          </div>
        </div>
      </div>

      {isDesktop ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Profesores</CardTitle>
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredProfesores.length} de {totalProfesores} profesores
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Especialización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfesores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No se encontraron profesores
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfesores.map((profesor) => (
                    <React.Fragment key={profesor.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleExpand(profesor.id)}
                          >
                            {expandedTeachers[profesor.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>{getFullName(profesor)}</TableCell>
                        <TableCell>{profesor.email || "Sin email"}</TableCell>
                        <TableCell>{profesor.especialidad || "No especificada"}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              profesor.estado === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }
                          >
                            {profesor.estado === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(profesor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProfesor(profesor.id, profesor.usuario_id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedTeachers[profesor.id] && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            <Card className="m-2 border-0 shadow-none">
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium">Título:</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {profesor.titulo || "No especificado"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium">Cédula:</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {profesor.cedula || "No especificada"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium">Teléfono:</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {profesor.telefono || "No especificado"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium">Fecha de contratación:</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {profesor.fecha_contratacion || "No especificada"}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
      ) : (
        <div className="space-y-4">
          {filteredProfesores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron profesores</p>
          ) : (
            filteredProfesores.map((profesor) => (
              <Card key={profesor.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{getFullName(profesor)}</CardTitle>
                    <Badge
                      className={
                        profesor.estado === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {profesor.estado === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">{profesor.email || "Sin email"}</p>
                    <p>{profesor.especialidad || "Sin especialización"}</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-xs"
                    onClick={() => toggleExpand(profesor.id)}
                  >
                    {expandedTeachers[profesor.id] ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" /> Mostrar menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" /> Mostrar más
                      </>
                    )}
                  </Button>

                  {expandedTeachers[profesor.id] && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div>
                        <h4 className="text-sm font-medium">Título:</h4>
                        <p className="text-sm text-muted-foreground">{profesor.titulo || "No especificado"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Cédula:</h4>
                        <p className="text-sm text-muted-foreground">{profesor.cedula || "No especificada"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Teléfono:</h4>
                        <p className="text-sm text-muted-foreground">{profesor.telefono || "No especificado"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Fecha de contratación:</h4>
                        <p className="text-sm text-muted-foreground">
                          {profesor.fecha_contratacion || "No especificada"}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(profesor)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProfesor(profesor.id, profesor.usuario_id)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </CardFooter>
              </Card>
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
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Docente" : "Agregar Nuevo Docente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formContent}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? (editingId ? "Actualizando..." : "Guardando...") : editingId ? "Actualizar" : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Editar Docente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formContent}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
