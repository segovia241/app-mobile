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
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getMaterias, createMateria, updateMateria, deleteMateria, type Materia } from "@/lib/api/materias"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"

export function Subjects() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentMateria, setCurrentMateria] = useState<Partial<Materia>>({
    codigo: "",
    nombre: "",
    descripcion: "",
    creditos: 0,
    nivel: "1",
  })

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalMaterias, setTotalMaterias] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { toast } = useToast()

  useEffect(() => {
    loadMaterias()
  }, [currentPage, pageSize])

  const loadMaterias = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getMaterias()
      setTotalMaterias(data.length)
      setTotalPages(Math.ceil(data.length / pageSize))

      // Simulamos la paginación en el cliente
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedData = data.slice(startIndex, endIndex)

      setMaterias(paginatedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar materias"
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

  const handleAddMateria = async () => {
    setIsSubmitting(true)
    try {
      // Ensure the currentMateria object has the correct type before sending it to the API
      const materiaToCreate: Omit<Materia, "id" | "created_at" | "updated_at"> = {
        codigo: currentMateria.codigo || "",
        nombre: currentMateria.nombre || "",
        descripcion: currentMateria.descripcion || "",
        creditos: currentMateria.creditos || 0,
        nivel: currentMateria.nivel || "1",
      }

      await createMateria(materiaToCreate)
      await loadMaterias() // Recargar datos para mantener la paginación correcta
      setCurrentMateria({
        codigo: "",
        nombre: "",
        descripcion: "",
        creditos: 0,
        nivel: "1",
      })
      setIsAddOpen(false)
      toast({
        title: "Éxito",
        description: "Materia añadida correctamente",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al añadir materia",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditMateria = async () => {
    if (!currentMateria.id) return

    setIsSubmitting(true)
    try {
      // Crear un objeto con los campos correctos para actualizar
      const materiaToUpdate: Partial<Omit<Materia, "id" | "created_at" | "updated_at">> = {
        codigo: currentMateria.codigo,
        nombre: currentMateria.nombre,
        descripcion: currentMateria.descripcion,
        creditos: currentMateria.creditos,
        nivel: currentMateria.nivel,
      }

      await updateMateria(currentMateria.id, materiaToUpdate)
      await loadMaterias() // Recargar datos para mantener la paginación correcta
      setIsEditOpen(false)
      toast({
        title: "Éxito",
        description: "Materia actualizada correctamente",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al actualizar materia",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMateria = async (id: number) => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta materia? Esta acción no se puede deshacer.")) return

    try {
      await deleteMateria(id)

      // Si estamos en la última página y eliminamos el único elemento, volvemos a la página anterior
      if (currentPage > 1 && materias.length === 1) {
        setCurrentPage(currentPage - 1)
      } else {
        await loadMaterias()
      }

      toast({
        title: "Éxito",
        description: "Materia eliminada correctamente",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al eliminar materia",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (materia: Materia) => {
    setCurrentMateria(materia)
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

  // Filtrar materias según término de búsqueda
  const filteredMaterias = materias.filter((materia) => {
    if (!searchTerm) return true

    const nombre = materia.nombre.toLowerCase()
    const codigo = materia.codigo.toLowerCase()
    const descripcion = materia.descripcion?.toLowerCase() || ""
    const searchTermLower = searchTerm.toLowerCase()

    return nombre.includes(searchTermLower) || codigo.includes(searchTermLower) || descripcion.includes(searchTermLower)
  })

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
        <h2 className="font-bold">Error al cargar materias</h2>
        <p>{error}</p>
        <Button onClick={loadMaterias} variant="outline" className="mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Gestión de Materias
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar materias..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Agregar Materia</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto p-4 w-[95vw] sm:w-auto">
              <DialogHeader>
                <DialogTitle>{isEditOpen ? "Editar Materia" : "Agregar Nueva Materia"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={currentMateria.codigo || ""}
                    onChange={(e) => setCurrentMateria({ ...currentMateria, codigo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Materia</Label>
                  <Input
                    id="nombre"
                    value={currentMateria.nombre || ""}
                    onChange={(e) => setCurrentMateria({ ...currentMateria, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={currentMateria.descripcion || ""}
                    onChange={(e) => setCurrentMateria({ ...currentMateria, descripcion: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditos">Créditos</Label>
                  <Input
                    id="creditos"
                    type="number"
                    value={currentMateria.creditos?.toString() || "0"}
                    onChange={(e) =>
                      setCurrentMateria({ ...currentMateria, creditos: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nivel">Nivel de Grado</Label>
                  <Select
                    value={currentMateria.nivel || "1"}
                    onValueChange={(value) => setCurrentMateria({ ...currentMateria, nivel: value })}
                  >
                    <SelectTrigger id="nivel">
                      <SelectValue placeholder="Selecciona un nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1º ESO</SelectItem>
                      <SelectItem value="2">2º ESO</SelectItem>
                      <SelectItem value="3">3º ESO</SelectItem>
                      <SelectItem value="4">4º ESO</SelectItem>
                      <SelectItem value="5">1º Bachillerato</SelectItem>
                      <SelectItem value="6">2º Bachillerato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={isEditOpen ? handleEditMateria : handleAddMateria}
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
            <CardTitle>Lista de Materias</CardTitle>
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredMaterias.length} de {totalMaterias} materias
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No se encontraron materias
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterias.map((materia) => (
                    <TableRow key={materia.id}>
                      <TableCell>{materia.codigo}</TableCell>
                      <TableCell className="font-medium">{materia.nombre}</TableCell>
                      <TableCell>
                        {materia.descripcion && materia.descripcion.length > 60
                          ? `${materia.descripcion.substring(0, 60)}...`
                          : materia.descripcion}
                      </TableCell>
                      <TableCell>{materia.creditos}</TableCell>
                      <TableCell>{`Nivel ${materia.nivel}`}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(materia)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMateria(materia.id)}>
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
          {filteredMaterias.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron materias</p>
          ) : (
            filteredMaterias.map((materia) => (
              <Card key={materia.id}>
                <CardHeader>
                  <CardTitle>{materia.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Código:</span>
                      <span className="text-sm">{materia.codigo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Créditos:</span>
                      <span className="text-sm">{materia.creditos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Nivel:</span>
                      <span className="text-sm">{`Nivel ${materia.nivel}`}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Descripción:</span>
                      <p className="text-sm text-muted-foreground mt-1">{materia.descripcion}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(materia)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteMateria(materia.id)}>
                    <Trash className="h-4 w-4 mr-2" />
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
            <DialogTitle>{isEditOpen ? "Editar Materia" : "Agregar Nueva Materia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={currentMateria.codigo || ""}
                onChange={(e) => setCurrentMateria({ ...currentMateria, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Materia</Label>
              <Input
                id="nombre"
                value={currentMateria.nombre || ""}
                onChange={(e) => setCurrentMateria({ ...currentMateria, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={currentMateria.descripcion || ""}
                onChange={(e) => setCurrentMateria({ ...currentMateria, descripcion: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditos">Créditos</Label>
              <Input
                id="creditos"
                type="number"
                value={currentMateria.creditos?.toString() || "0"}
                onChange={(e) =>
                  setCurrentMateria({ ...currentMateria, creditos: Number.parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nivel">Nivel de Grado</Label>
              <Select
                value={currentMateria.nivel || "1"}
                onValueChange={(value) => setCurrentMateria({ ...currentMateria, nivel: value })}
              >
                <SelectTrigger id="nivel">
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º ESO</SelectItem>
                  <SelectItem value="2">2º ESO</SelectItem>
                  <SelectItem value="3">3º ESO</SelectItem>
                  <SelectItem value="4">4º ESO</SelectItem>
                  <SelectItem value="5">1º Bachillerato</SelectItem>
                  <SelectItem value="6">2º Bachillerato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={isEditOpen ? handleEditMateria : handleAddMateria}
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
