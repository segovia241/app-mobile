"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/hooks/use-toast"
import { Pencil, Trash2, Plus, Search, X } from "lucide-react"
import useIsMobile from "@/hooks/use-mobile"
import MobileCardView from "@/components/mobile-card-view"
import { getProfesores } from "@/lib/api/profesores"
import { getMaterias } from "@/lib/api/materias"
import { getAulas } from "@/lib/api/aulas"
import { createCurso, updateCurso, deleteCurso, getCursos } from "@/lib/api/cursos"
import { getPeriodos, createPeriodo } from "@/lib/api/periodos"
import { Checkbox } from "@/components/ui/checkbox"

// Días de la semana
const diasSemana = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
]

// Horas disponibles para selección
const horasDisponibles = Array.from({ length: 15 }, (_, i) => {
  const hora = i + 7 // Empezando desde las 7 AM
  return {
    value: hora.toString().padStart(2, "0") + ":00",
    label: `${hora}:00 ${hora < 12 ? "AM" : hora === 12 ? "PM" : hora - 12 + ":00 PM"}`,
  }
})

// Esquema de validación para el formulario de sesión
const sessionFormSchema = z.object({
  profesor_id: z.coerce.number().min(1, "Debe seleccionar un profesor"),
  materia_id: z.coerce.number().min(1, "Debe seleccionar una materia"),
  periodo_id: z.coerce.number().optional(),
  dias_seleccionados: z.array(z.string()).min(1, "Debe seleccionar al menos un día"),
  horarios: z
    .record(
      z.string(),
      z.object({
        inicio: z.string().min(1, "Debe seleccionar hora de inicio"),
        fin: z.string().min(1, "Debe seleccionar hora de fin"),
      }),
    )
    .optional(),
  aula_id: z.coerce.number().min(1, "Debe seleccionar un aula"),
  cupo_maximo: z.coerce.number().min(1, "El cupo máximo debe ser al menos 1"),
  estado: z.string().min(1, "El estado es requerido"),
})

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentSession, setCurrentSession] = useState<any | null>(null)
  const [profesores, setProfesores] = useState<any[]>([])
  const [materias, setMaterias] = useState<any[]>([])
  const [aulas, setAulas] = useState<any[]>([])
  const [periodos, setPeriodos] = useState<any[]>([])
  const [creatingPeriodo, setCreatingPeriodo] = useState(false)
  const isMobile = useIsMobile()

  const form = useForm<z.infer<typeof sessionFormSchema>>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      profesor_id: 0,
      materia_id: 0,
      periodo_id: 0,
      dias_seleccionados: [],
      horarios: {},
      aula_id: 0,
      cupo_maximo: 30,
      estado: "Activo",
    },
  })

  const editForm = useForm<z.infer<typeof sessionFormSchema>>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      profesor_id: 0,
      materia_id: 0,
      periodo_id: 0,
      dias_seleccionados: [],
      horarios: {},
      aula_id: 0,
      cupo_maximo: 30,
      estado: "Activo",
    },
  })

  // Observar los días seleccionados para el formulario de creación
  const diasSeleccionados = form.watch("dias_seleccionados") || []
  const horariosForm = form.watch("horarios") || {}

  // Observar los días seleccionados para el formulario de edición
  const diasSeleccionadosEdit = editForm.watch("dias_seleccionados") || []
  const horariosEditForm = editForm.watch("horarios") || {}

  useEffect(() => {
    loadSessions()
    loadProfesores()
    loadMaterias()
    loadAulas()
    loadPeriodos()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await getCursos()
      setSessions(data)
    } catch (error) {
      console.error("Error al cargar sesiones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProfesores = async () => {
    try {
      const data = await getProfesores()
      setProfesores(data)
    } catch (error) {
      console.error("Error al cargar profesores:", error)
    }
  }

  const loadMaterias = async () => {
    try {
      const data = await getMaterias()
      setMaterias(data)
    } catch (error) {
      console.error("Error al cargar materias:", error)
    }
  }

  const loadAulas = async () => {
    try {
      const data = await getAulas()
      setAulas(data)
    } catch (error) {
      console.error("Error al cargar aulas:", error)
    }
  }

  const loadPeriodos = async () => {
    try {
      const data = await getPeriodos()
      setPeriodos(data)
    } catch (error) {
      console.error("Error al cargar periodos:", error)
    }
  }

  const crearPeriodoAutomatico = async () => {
    try {
      setCreatingPeriodo(true)
      const fechaActual = new Date()
      const anio = fechaActual.getFullYear()

      // Crear un periodo que abarque todo el año actual
      const nuevoPeriodo = {
        nombre: `Periodo ${anio}`,
        fecha_inicio: new Date(anio, 0, 1).toISOString().split("T")[0], // 1 de enero
        fecha_fin: new Date(anio, 11, 31).toISOString().split("T")[0], // 31 de diciembre
        activo: true,
      }

      const periodoCreado = await createPeriodo(nuevoPeriodo)
      setPeriodos([...periodos, periodoCreado])

      toast({
        title: "Éxito",
        description: "Se ha creado un nuevo periodo automáticamente",
      })

      return periodoCreado.id
    } catch (error) {
      console.error("Error al crear periodo automático:", error)
      toast({
        title: "Error",
        description: "No se pudo crear un periodo automáticamente",
        variant: "destructive",
      })
      return null
    } finally {
      setCreatingPeriodo(false)
    }
  }

  const handleAddSession = async (data: z.infer<typeof sessionFormSchema>) => {
    try {
      // Verificar si hay periodos disponibles, si no, crear uno automáticamente
      let periodoId = data.periodo_id
      if ((!periodoId || periodoId <= 0) && periodos.length === 0) {
        periodoId = await crearPeriodoAutomatico()
        if (!periodoId) {
          toast({
            title: "Error",
            description: "No se pudo crear un periodo automáticamente",
            variant: "destructive",
          })
          return
        }
      } else if (periodoId <= 0 && periodos.length > 0) {
        // Si no se seleccionó un periodo pero hay disponibles, usar el primero
        periodoId = periodos[0].id
      }

      // Formatear los días y horarios seleccionados
      const diasFormateados = data.dias_seleccionados.map((dia) => {
        const horario = data.horarios?.[dia]
        return {
          dia,
          horario: horario ? `${horario.inicio} - ${horario.fin}` : "",
        }
      })

      // Crear string de días de la semana
      const diasSemanaStr = data.dias_seleccionados.join(",")

      // Crear string de horario (usando el primer horario como referencia)
      const primerDia = data.dias_seleccionados[0]
      const horarioReferencia = data.horarios?.[primerDia]
      const horarioStr = horarioReferencia ? `${horarioReferencia.inicio} - ${horarioReferencia.fin}` : ""

      // Asegurarse de que los datos están formateados correctamente para la API
      const sessionData = {
        profesor_id: data.profesor_id,
        materia_id: data.materia_id,
        periodo_id: periodoId,
        horario: horarioStr,
        dias_semana: diasSemanaStr,
        aula_id: data.aula_id,
        cupo_maximo: data.cupo_maximo,
        cupo_actual: 0,
        estado: data.estado,
      }

      const newSession = await createCurso(sessionData)

      setSessions([...sessions, newSession])
      setIsAddDialogOpen(false)
      form.reset()
      toast({
        title: "Éxito",
        description: "Sesión creada correctamente",
      })
    } catch (error) {
      console.error("Error al crear sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la sesión",
        variant: "destructive",
      })
    }
  }

  const handleEditSession = async (data: z.infer<typeof sessionFormSchema>) => {
    if (!currentSession) return

    try {
      // Verificar si hay periodos disponibles, si no, crear uno automáticamente
      let periodoId = data.periodo_id
      if ((!periodoId || periodoId <= 0) && periodos.length === 0) {
        periodoId = await crearPeriodoAutomatico()
        if (!periodoId) {
          toast({
            title: "Error",
            description: "No se pudo crear un periodo automáticamente",
            variant: "destructive",
          })
          return
        }
      } else if (periodoId <= 0 && periodos.length > 0) {
        // Si no se seleccionó un periodo pero hay disponibles, usar el primero
        periodoId = periodos[0].id
      }

      // Formatear los días y horarios seleccionados
      const diasFormateados = data.dias_seleccionados.map((dia) => {
        const horario = data.horarios?.[dia]
        return {
          dia,
          horario: horario ? `${horario.inicio} - ${horario.fin}` : "",
        }
      })

      // Crear string de días de la semana
      const diasSemanaStr = data.dias_seleccionados.join(",")

      // Crear string de horario (usando el primer horario como referencia)
      const primerDia = data.dias_seleccionados[0]
      const horarioReferencia = data.horarios?.[primerDia]
      const horarioStr = horarioReferencia ? `${horarioReferencia.inicio} - ${horarioReferencia.fin}` : ""

      const updatedSession = await updateCurso(currentSession.id, {
        profesor_id: data.profesor_id,
        materia_id: data.materia_id,
        periodo_id: periodoId,
        horario: horarioStr,
        dias_semana: diasSemanaStr,
        aula_id: data.aula_id,
        cupo_maximo: data.cupo_maximo,
        estado: data.estado,
      })

      setSessions(sessions.map((s) => (s.id === currentSession.id ? updatedSession : s)))
      setIsEditDialogOpen(false)
      setCurrentSession(null)
      toast({
        title: "Éxito",
        description: "Sesión actualizada correctamente",
      })
    } catch (error) {
      console.error("Error al actualizar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la sesión",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSession = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta sesión? Esta acción no se puede deshacer.")) return

    try {
      await deleteCurso(id)
      setSessions(sessions.filter((s) => s.id !== id))
      toast({
        title: "Éxito",
        description: "Sesión eliminada correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la sesión",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (session: any) => {
    setCurrentSession(session)

    // Parsear los días de la semana y horarios
    const diasArray = session.dias_semana ? session.dias_semana.split(",") : []

    // Crear objeto de horarios para cada día
    const horariosObj: Record<string, { inicio: string; fin: string }> = {}

    // Parsear el horario general (asumiendo formato "HH:MM - HH:MM")
    let horaInicio = "08:00"
    let horaFin = "10:00"

    if (session.horario && session.horario.includes("-")) {
      const [inicio, fin] = session.horario.split("-").map((h) => h.trim())
      horaInicio = inicio
      horaFin = fin
    }

    // Asignar el mismo horario a todos los días seleccionados
    diasArray.forEach((dia) => {
      horariosObj[dia] = {
        inicio: horaInicio,
        fin: horaFin,
      }
    })

    editForm.reset({
      profesor_id: session.profesor_id,
      materia_id: session.materia_id,
      periodo_id: session.periodo_id || 0,
      dias_seleccionados: diasArray,
      horarios: horariosObj,
      aula_id: session.aula_id,
      cupo_maximo: session.cupo_maximo,
      estado: session.estado,
    })

    setIsEditDialogOpen(true)
  }

  const filteredSessions = sessions.filter(
    (session) =>
      (session.profesor?.nombres || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.profesor?.apellidos || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.materia?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.horario || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getProfesorNombre = (profesorId: number) => {
    const profesor = profesores.find((p) => p.id === profesorId)
    return profesor ? `${profesor.nombres} ${profesor.apellidos}` : "Desconocido"
  }

  const getMateriaNombre = (materiaId: number) => {
    const materia = materias.find((m) => m.id === materiaId)
    return materia ? materia.nombre : "Desconocida"
  }

  const getAulaNombre = (aulaId: number) => {
    const aula = aulas.find((a) => a.id === aulaId)
    return aula ? aula.nombre : "Desconocida"
  }

  const getPeriodoNombre = (periodoId: number) => {
    const periodo = periodos.find((p) => p.id === periodoId)
    return periodo ? periodo.nombre : "Desconocido"
  }

  if (loading) {
    return <div className="flex justify-center p-4">Cargando sesiones...</div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sesiones</h1>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sesiones..."
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
            <Button onClick={() => form.reset()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Sesión
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4 w-[95vw] sm:w-auto">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Sesión</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddSession)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="profesor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profesor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar profesor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[40vh] overflow-y-auto">
                            {profesores.map((profesor) => (
                              <SelectItem key={profesor.id} value={profesor.id.toString()}>
                                {profesor.nombres} {profesor.apellidos}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="materia_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Materia</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar materia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {materias.map((materia) => (
                              <SelectItem key={materia.id} value={materia.id.toString()}>
                                {materia.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aula_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aula</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar aula" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {aulas.map((aula) => (
                              <SelectItem key={aula.id} value={aula.id.toString()}>
                                {aula.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cupo_maximo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cupo Máximo</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="periodo_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Periodo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString() || "0"}
                          disabled={creatingPeriodo}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={creatingPeriodo ? "Creando periodo..." : "Seleccionar periodo"}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {periodos.length > 0 ? (
                              periodos.map((periodo) => (
                                <SelectItem key={periodo.id} value={periodo.id.toString()}>
                                  {periodo.nombre}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="0">Se creará automáticamente</SelectItem>
                            )}
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Activo">Activo</SelectItem>
                            <SelectItem value="Inactivo">Inactivo</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                            <SelectItem value="Finalizado">Finalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Selección de días de la semana */}
                <FormField
                  control={form.control}
                  name="dias_seleccionados"
                  render={() => (
                    <FormItem>
                      <FormLabel>Días de la semana</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {diasSemana.map((dia) => (
                          <div key={dia.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={diasSeleccionados.includes(dia.id)}
                              onCheckedChange={(checked) => {
                                const currentDias = [...diasSeleccionados]
                                if (checked) {
                                  if (!currentDias.includes(dia.id)) {
                                    currentDias.push(dia.id)
                                  }
                                } else {
                                  const index = currentDias.indexOf(dia.id)
                                  if (index !== -1) {
                                    currentDias.splice(index, 1)
                                  }
                                }
                                form.setValue("dias_seleccionados", currentDias, { shouldValidate: true })
                              }}
                              id={`dia-${dia.id}`}
                            />
                            <label
                              htmlFor={`dia-${dia.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {dia.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Horarios para cada día seleccionado */}
                {diasSeleccionados.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Horarios por día</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {diasSeleccionados.map((diaId) => {
                        const dia = diasSemana.find((d) => d.id === diaId)
                        return (
                          <div key={diaId} className="border p-3 rounded-md">
                            <h4 className="font-medium mb-2">{dia?.label}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <FormLabel htmlFor={`horario-inicio-${diaId}`}>Hora inicio</FormLabel>
                                <Select
                                  value={horariosForm[diaId]?.inicio || ""}
                                  onValueChange={(value) => {
                                    const horarios = { ...horariosForm }
                                    if (!horarios[diaId]) {
                                      horarios[diaId] = { inicio: "", fin: "" }
                                    }
                                    horarios[diaId].inicio = value
                                    form.setValue("horarios", horarios, { shouldValidate: true })
                                  }}
                                >
                                  <SelectTrigger id={`horario-inicio-${diaId}`}>
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[40vh] overflow-y-auto">
                                    {horasDisponibles.map((hora) => (
                                      <SelectItem key={`inicio-${diaId}-${hora.value}`} value={hora.value}>
                                        {hora.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <FormLabel htmlFor={`horario-fin-${diaId}`}>Hora fin</FormLabel>
                                <Select
                                  value={horariosForm[diaId]?.fin || ""}
                                  onValueChange={(value) => {
                                    const horarios = { ...horariosForm }
                                    if (!horarios[diaId]) {
                                      horarios[diaId] = { inicio: "", fin: "" }
                                    }
                                    horarios[diaId].fin = value
                                    form.setValue("horarios", horarios, { shouldValidate: true })
                                  }}
                                >
                                  <SelectTrigger id={`horario-fin-${diaId}`}>
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[40vh] overflow-y-auto">
                                    {horasDisponibles.map((hora) => (
                                      <SelectItem key={`fin-${diaId}-${hora.value}`} value={hora.value}>
                                        {hora.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creatingPeriodo}>
                    {creatingPeriodo ? "Creando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isMobile ? (
        <MobileCardView
          data={filteredSessions}
          columns={[
            { key: "profesor_id", title: "Profesor", render: (value) => getProfesorNombre(value) },
            { key: "materia_id", title: "Materia", render: (value) => getMateriaNombre(value) },
            { key: "horario", title: "Horario" },
            { key: "dias_semana", title: "Días" },
          ]}
          actions={(session) => (
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => openEditDialog(session)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDeleteSession(session.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesor</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead>Aula</TableHead>
                  <TableHead>Cupo</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No hay sesiones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{getProfesorNombre(session.profesor_id)}</TableCell>
                      <TableCell>{getMateriaNombre(session.materia_id)}</TableCell>
                      <TableCell>{session.horario}</TableCell>
                      <TableCell>{session.dias_semana}</TableCell>
                      <TableCell>{getAulaNombre(session.aula_id)}</TableCell>
                      <TableCell>
                        {session.cupo_actual}/{session.cupo_maximo}
                      </TableCell>
                      <TableCell>{session.periodo_id ? getPeriodoNombre(session.periodo_id) : "N/A"}</TableCell>
                      <TableCell>{session.estado}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(session)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteSession(session.id)}>
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Sesión</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSession)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="profesor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profesor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar profesor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {profesores.map((profesor) => (
                            <SelectItem key={profesor.id} value={profesor.id.toString()}>
                              {profesor.nombres} {profesor.apellidos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="materia_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar materia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {materias.map((materia) => (
                            <SelectItem key={materia.id} value={materia.id.toString()}>
                              {materia.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="aula_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aula</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar aula" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {aulas.map((aula) => (
                            <SelectItem key={aula.id} value={aula.id.toString()}>
                              {aula.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="cupo_maximo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cupo Máximo</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="periodo_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periodo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString() || "0"}
                        disabled={creatingPeriodo}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={creatingPeriodo ? "Creando periodo..." : "Seleccionar periodo"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periodos.length > 0 ? (
                            periodos.map((periodo) => (
                              <SelectItem key={periodo.id} value={periodo.id.toString()}>
                                {periodo.nombre}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="0">Se creará automáticamente</SelectItem>
                          )}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Inactivo">Inactivo</SelectItem>
                          <SelectItem value="Cancelado">Cancelado</SelectItem>
                          <SelectItem value="Finalizado">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Selección de días de la semana */}
              <FormField
                control={editForm.control}
                name="dias_seleccionados"
                render={() => (
                  <FormItem>
                    <FormLabel>Días de la semana</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {diasSemana.map((dia) => (
                        <div key={dia.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={diasSeleccionadosEdit.includes(dia.id)}
                            onCheckedChange={(checked) => {
                              const currentDias = [...diasSeleccionadosEdit]
                              if (checked) {
                                if (!currentDias.includes(dia.id)) {
                                  currentDias.push(dia.id)
                                }
                              } else {
                                const index = currentDias.indexOf(dia.id)
                                if (index !== -1) {
                                  currentDias.splice(index, 1)
                                }
                              }
                              editForm.setValue("dias_seleccionados", currentDias, { shouldValidate: true })
                            }}
                            id={`edit-dia-${dia.id}`}
                          />
                          <label
                            htmlFor={`edit-dia-${dia.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {dia.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Horarios para cada día seleccionado */}
              {diasSeleccionadosEdit.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Horarios por día</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {diasSeleccionadosEdit.map((diaId) => {
                      const dia = diasSemana.find((d) => d.id === diaId)
                      return (
                        <div key={diaId} className="border p-3 rounded-md">
                          <h4 className="font-medium mb-2">{dia?.label}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <FormLabel htmlFor={`edit-horario-inicio-${diaId}`}>Hora inicio</FormLabel>
                              <Select
                                value={horariosEditForm[diaId]?.inicio || ""}
                                onValueChange={(value) => {
                                  const horarios = { ...horariosEditForm }
                                  if (!horarios[diaId]) {
                                    horarios[diaId] = { inicio: "", fin: "" }
                                  }
                                  horarios[diaId].inicio = value
                                  editForm.setValue("horarios", horarios, { shouldValidate: true })
                                }}
                              >
                                <SelectTrigger id={`edit-horario-inicio-${diaId}`}>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {horasDisponibles.map((hora) => (
                                    <SelectItem key={`edit-inicio-${diaId}-${hora.value}`} value={hora.value}>
                                      {hora.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <FormLabel htmlFor={`edit-horario-fin-${diaId}`}>Hora fin</FormLabel>
                              <Select
                                value={horariosEditForm[diaId]?.fin || ""}
                                onValueChange={(value) => {
                                  const horarios = { ...horariosEditForm }
                                  if (!horarios[diaId]) {
                                    horarios[diaId] = { inicio: "", fin: "" }
                                  }
                                  horarios[diaId].fin = value
                                  editForm.setValue("horarios", horarios, { shouldValidate: true })
                                }}
                              >
                                <SelectTrigger id={`edit-horario-fin-${diaId}`}>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {horasDisponibles.map((hora) => (
                                    <SelectItem key={`edit-fin-${diaId}-${hora.value}`} value={hora.value}>
                                      {hora.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creatingPeriodo}>
                  {creatingPeriodo ? "Creando..." : "Actualizar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
