"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Pencil,
  Trash,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useToast } from "@/hooks/use-toast"
import { getAulas, createAula, updateAula, deleteAula, type Aula } from "@/lib/api/aulas"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"

export function Classrooms() {
  const [classrooms, setClassrooms] = useState<Aula[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentClassroom, setCurrentClassroom] = useState<Partial<Aula>>({
    codigo: "",
    nombre: "",
    capacidad: 0,
    ubicacion: "",
    tipo: "",
    disponible: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalClassrooms, setTotalClassrooms] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { toast } = useToast()

  useEffect(() => {
    loadClassrooms()
  }, [currentPage, pageSize])

  const loadClassrooms = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAulas()
      setTotalClassrooms(data.length)
      setTotalPages(Math.ceil(data.length / pageSize))

      // Simulamos la paginación en el cliente
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedData = data.slice(startIndex, endIndex)

      setClassrooms(paginatedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar los salones"
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

  const handleAddClassroom = async () => {
    setIsSubmitting(true)
    try {
      // Generar código automático para el salón
      const codigoGenerado = `S-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`

      // Ubicación generada automáticamente
      const ubicacionGenerada = "Edificio Principal"

      // Tipo por defecto
      const tipoGenerado = "Estándar"

      // Crear un objeto con la estructura correcta para la API
      const aulaData: Omit<Aula, "id" | "created_at" | "updated_at"> = {
        codigo: codigoGenerado,
        nombre: currentClassroom.nombre || "",
        capacidad: currentClassroom.capacidad || 0,
        ubicacion: ubicacionGenerada,
        tipo: tipoGenerado,
        disponible: currentClassroom.disponible !== undefined ? currentClassroom.disponible : true,
      }

      await createAula(aulaData)
      await loadClassrooms()
      setCurrentClassroom({
        codigo: "",
        nombre: "",
        capacidad: 0,
        ubicacion: "",
        tipo: "",
        disponible: true,
      })
      setIsAddOpen(false)
      toast({
        title: "Éxito",
        description: "Salón añadido correctamente",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al añadir salón",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClassroom = async () => {
    if (!currentClassroom.id) return

    setIsSubmitting(true)
    try {
      // Generar ubicación si se edita (mantener la misma lógica)
      const ubicacionGenerada = "Edificio Principal"
      const tipoGenerado = "Estándar"

      // Crear un objeto con los campos correctos para actualizar
      const aulaToUpdate: Partial<Omit<Aula, "id" | "created_at" | "updated_at">> = {
        codigo: currentClassroom.codigo,
        nombre: currentClassroom.nombre,
        capacidad: currentClassroom.capacidad,
        ubicacion: ubicacionGenerada,
        tipo: tipoGenerado,
        disponible: currentClassroom.disponible,
      }

      await updateAula(currentClassroom.id, aulaToUpdate)
      await loadClassrooms()
      setIsEditOpen(false)
      toast({
        title: "Éxito",
        description: "Salón actualizado correctamente",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al actualizar salón",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClassroom = async (id: number) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este salón? Esta acción no se puede deshacer.")) return

    try {
      await deleteAula(id)

      // Si estamos en la última página y eliminamos el único elemento, volvemos a la página anterior
      if (currentPage > 1 && classrooms.length === 1) {
        setCurrentPage(currentPage - 1)
      } else {
        await loadClassrooms()
      }

      toast({
        title: "Éxito",
        description: "Salón eliminado correctamente",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar salón"

      // Verificar si es un error de restricción de clave foránea
      if (errorMessage.includes("foreign key constraint") || errorMessage.includes("referenced")) {
        toast({
          title: "Error",
          description: "No se puede eliminar este salón porque está siendo utilizado en horarios",
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

  const openEditDialog = (classroom: Aula) => {
    setCurrentClassroom(classroom)
    setIsEditOpen(true)
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

  // Filtrar salones según término de búsqueda
  const filteredClassrooms = classrooms.filter((classroom) => {
    if (!searchTerm) return true

    const nombre = classroom.nombre.toLowerCase()
    const ubicacion = classroom.ubicacion?.toLowerCase() || ""
    const tipo = classroom.tipo?.toLowerCase() || ""
    const searchTermLower = searchTerm.toLowerCase()

    return nombre.includes(searchTermLower) || ubicacion.includes(searchTermLower) || tipo.includes(searchTermLower)
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando salones...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <h2 className="font-bold">Error al cargar salones</h2>
        <p>{error}</p>
        <Button onClick={loadClassrooms} variant="outline" className="mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Gestión de Salones</h2>
          <p className="text-muted-foreground">Administra los salones del centro educativo</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar salones..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Agregar Salón</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto p-4 w-[95vw] sm:w-auto">
              <DialogHeader>
                <DialogTitle>{isEditOpen ? "Editar Salón" : "Agregar Nuevo Salón"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {!isEditOpen && (
                  <div className="text-sm text-muted-foreground mb-2">
                    El código del salón se generará automáticamente al guardar.
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={currentClassroom.nombre || ""}
                    onChange={(e) => setCurrentClassroom({ ...currentClassroom, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidad">Capacidad</Label>
                  <Input
                    id="capacidad"
                    type="number"
                    value={currentClassroom.capacidad?.toString() || "0"}
                    onChange={(e) =>
                      setCurrentClassroom({ ...currentClassroom, capacidad: Number.parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="disponible"
                    checked={currentClassroom.disponible || false}
                    onChange={(e) => setCurrentClassroom({ ...currentClassroom, disponible: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="disponible">Disponible</Label>
                </div>
                <Button
                  className="w-full"
                  onClick={isEditOpen ? handleEditClassroom : handleAddClassroom}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting
                    ? isEditOpen
                      ? "Actualizando..."
                      : "Guardando..."
                    : isEditOpen
                      ? "Actualizar"
                      : "Guardar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isDesktop ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Salones</CardTitle>
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredClassrooms.length} de {totalClassrooms} salones
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClassrooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No se encontraron salones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClassrooms.map((classroom) => (
                    <TableRow key={classroom.id}>
                      <TableCell>{classroom.codigo}</TableCell>
                      <TableCell>{classroom.nombre}</TableCell>
                      <TableCell>{classroom.capacidad}</TableCell>
                      <TableCell>{classroom.ubicacion || "-"}</TableCell>
                      <TableCell>{classroom.disponible ? "Sí" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(classroom)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClassroom(classroom.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
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
      ) : (
        <div className="grid gap-4">
          {filteredClassrooms.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron salones</p>
          ) : (
            filteredClassrooms.map((classroom) => (
              <Card key={classroom.id}>
                <CardHeader className="pb-2">
                  <div className="font-medium">{classroom.nombre}</div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Código:</span> {classroom.codigo}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Capacidad:</span> {classroom.capacidad}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ubicación:</span> {classroom.ubicacion || "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Disponible:</span> {classroom.disponible ? "Sí" : "No"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(classroom)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteClassroom(classroom.id)}>
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto p-4 w-[95vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Editar Salón" : "Agregar Nuevo Salón"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!isEditOpen && (
              <div className="text-sm text-muted-foreground mb-2">
                El código del salón se generará automáticamente al guardar.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={currentClassroom.nombre || ""}
                onChange={(e) => setCurrentClassroom({ ...currentClassroom, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacidad">Capacidad</Label>
              <Input
                id="capacidad"
                type="number"
                value={currentClassroom.capacidad?.toString() || "0"}
                onChange={(e) =>
                  setCurrentClassroom({ ...currentClassroom, capacidad: Number.parseInt(e.target.value) || 0 })
                }
                required
              />
            </div>
            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="disponible"
                checked={currentClassroom.disponible || false}
                onChange={(e) => setCurrentClassroom({ ...currentClassroom, disponible: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="disponible">Disponible</Label>
            </div>
            <Button
              className="w-full"
              onClick={isEditOpen ? handleEditClassroom : handleAddClassroom}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? (isEditOpen ? "Actualizando..." : "Guardando...") : isEditOpen ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
