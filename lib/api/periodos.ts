import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Periodo {
  id: number
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  activo?: boolean
  created_at?: string
  updated_at?: string
}

export interface PeriodoAcademico {
  id: number
  name: string
  academic_year: string
  start_date?: string
  end_date?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todos los periodos académicos
 *
 * @returns Lista de periodos académicos
 */
export async function getPeriodosAcademicos(): Promise<PeriodoAcademico[]> {
  try {
    return await fetchAPI("periodos?select=*")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene todos los periodos
 *
 * @returns Lista de periodos
 */
export async function getPeriodos(): Promise<Periodo[]> {
  try {
    return await fetchAPI("periodos?select=*")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un periodo por su ID
 *
 * @param id ID del periodo
 * @returns Datos del periodo
 */
export async function getPeriodoById(id: number): Promise<Periodo> {
  try {
    const periodos = await fetchAPI(`periodos?id=eq.${id}`)
    if (periodos.length === 0) {
      throw new Error(`No se encontró el periodo con ID ${id}`)
    }
    return periodos[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene el periodo activo
 *
 * @returns Periodo activo o null si no hay ninguno activo
 */
export async function getPeriodoActivo(): Promise<Periodo | null> {
  try {
    const periodos = await fetchAPI("periodos?activo=eq.true")
    if (periodos.length === 0) {
      return null
    }
    return periodos[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea un nuevo periodo
 *
 * @param periodo Datos del periodo a crear
 * @returns Periodo creado
 */
export async function createPeriodo(periodo: Omit<Periodo, "id" | "created_at" | "updated_at">): Promise<Periodo> {
  try {
    // Añadir timestamps
    const periodoConTimestamps = {
      ...periodo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("periodos", {
      method: "POST",
      body: JSON.stringify(periodoConTimestamps),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza un periodo existente
 *
 * @param id ID del periodo
 * @param periodo Datos actualizados del periodo
 * @returns Periodo actualizado
 */
export async function updatePeriodo(
  id: number,
  periodo: Partial<Omit<Periodo, "id" | "created_at" | "updated_at">>,
): Promise<Periodo> {
  try {
    // Añadir timestamp de actualización
    const periodoConTimestamp = {
      ...periodo,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`periodos?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(periodoConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina un periodo
 *
 * @param id ID del periodo a eliminar
 * @returns void
 */
export async function deletePeriodo(id: number): Promise<void> {
  try {
    await fetchAPI(`periodos?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Activa un periodo y desactiva todos los demás
 *
 * @param id ID del periodo a activar
 * @returns Periodo activado
 */
export async function activarPeriodo(id: number): Promise<Periodo> {
  try {
    // Primero desactivamos todos los periodos
    await fetchAPI("periodos", {
      method: "PATCH",
      body: JSON.stringify({ activo: false }),
    })

    // Luego activamos el periodo especificado
    const response = await fetchAPI(`periodos?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ activo: true, updated_at: new Date().toISOString() }),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
