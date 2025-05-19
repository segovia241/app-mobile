import { fetchAPI, handleApiError } from "./config"

// Tipo para representar un aula
export interface Aula {
  id: number
  name?: string
  number?: string
  building?: string
  capacity?: number
  description?: string
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todas las aulas
 * @returns Lista de aulas
 */
export async function getAulas(): Promise<Aula[]> {
  try {
    return await fetchAPI("aulas?select=*")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un aula por su ID
 * @param id ID del aula
 * @returns Datos del aula
 */
export async function getAulaById(id: number): Promise<Aula | null> {
  try {
    const response = await fetchAPI(`aulas?id=eq.${id}&select=*`)
    return response.length > 0 ? response[0] : null
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea un nuevo aula
 * @param aula Datos del aula a crear
 * @returns Aula creada
 */
export async function createAula(aula: Omit<Aula, "id" | "created_at" | "updated_at">): Promise<Aula> {
  try {
    const response = await fetchAPI("aulas", {
      method: "POST",
      body: JSON.stringify({
        ...aula,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    })
    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza un aula existente
 * @param id ID del aula a actualizar
 * @param aula Datos actualizados del aula
 * @returns Aula actualizada
 */
export async function updateAula(id: number, aula: Partial<Aula>): Promise<Aula> {
  try {
    const response = await fetchAPI(`aulas?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...aula,
        updated_at: new Date().toISOString(),
      }),
    })
    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina un aula
 * @param id ID del aula a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteAula(id: number): Promise<boolean> {
  try {
    await fetchAPI(`aulas?id=eq.${id}`, {
      method: "DELETE",
    })
    return true
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
