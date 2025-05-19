import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Materia {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  creditos: number
  nivel?: string
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todas las materias
 *
 * @returns Lista de materias
 */
export async function getMaterias(): Promise<Materia[]> {
  try {
    return await fetchAPI("materias?select=*")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene una materia por su ID
 *
 * @param id ID de la materia
 * @returns Datos de la materia
 */
export async function getMateriaById(id: number): Promise<Materia> {
  try {
    const materias = await fetchAPI(`materias?id=eq.${id}`)
    if (materias.length === 0) {
      throw new Error(`No se encontró la materia con ID ${id}`)
    }
    return materias[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene materias por profesor
 *
 * @param profesorId ID del profesor
 * @returns Lista de materias asignadas al profesor
 */
export async function getMateriasByProfesor(profesorId: number): Promise<any[]> {
  try {
    return await fetchAPI(`profesor_materias?profesor_id=eq.${profesorId}&select=*,materia:materia_id(*)`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea una nueva materia
 *
 * @param materia Datos de la materia a crear
 * @returns Materia creada
 */
export async function createMateria(materia: Omit<Materia, "id" | "created_at" | "updated_at">): Promise<Materia> {
  try {
    // Añadir timestamps
    const materiaConTimestamps = {
      ...materia,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("materias", {
      method: "POST",
      body: JSON.stringify(materiaConTimestamps),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza una materia existente
 *
 * @param id ID de la materia
 * @param materia Datos actualizados de la materia
 * @returns Materia actualizada
 */
export async function updateMateria(
  id: number,
  materia: Partial<Omit<Materia, "id" | "created_at" | "updated_at">>,
): Promise<Materia> {
  try {
    // Añadir timestamp de actualización
    const materiaConTimestamp = {
      ...materia,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`materias?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(materiaConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina una materia
 *
 * @param id ID de la materia a eliminar
 * @returns void
 */
export async function deleteMateria(id: number): Promise<void> {
  try {
    await fetchAPI(`materias?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
