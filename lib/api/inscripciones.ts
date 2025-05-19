import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Inscripcion {
  id: number
  estudiante_id?: number
  materia_id?: number
  periodo_id?: number
  estado?: string
  calificacion?: number
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todas las inscripciones
 *
 * @returns Lista de inscripciones
 */
export async function getInscripciones(): Promise<Inscripcion[]> {
  try {
    return await fetchAPI(
      "inscripciones?select=*,estudiantes(id,nombres,apellidos),materias(id,codigo,nombre),periodos(id,nombre)",
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene una inscripción por su ID
 *
 * @param id ID de la inscripción
 * @returns Datos de la inscripción
 */
export async function getInscripcionById(id: number): Promise<Inscripcion> {
  try {
    const inscripciones = await fetchAPI(
      `inscripciones?id=eq.${id}&select=*,estudiantes(id,nombres,apellidos),materias(id,codigo,nombre),periodos(id,nombre)`,
    )
    if (inscripciones.length === 0) {
      throw new Error(`No se encontró la inscripción con ID ${id}`)
    }
    return inscripciones[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene las inscripciones de un estudiante
 *
 * @param estudianteId ID del estudiante
 * @returns Lista de inscripciones del estudiante
 */
export async function getInscripcionesByEstudianteId(estudianteId: number): Promise<Inscripcion[]> {
  try {
    return await fetchAPI(
      `inscripciones?estudiante_id=eq.${estudianteId}&select=*,estudiantes(id,nombres,apellidos),materias(id,codigo,nombre),periodos(id,nombre)`,
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene las inscripciones a una materia
 *
 * @param materiaId ID de la materia
 * @returns Lista de inscripciones a la materia
 */
export async function getInscripcionesByMateriaId(materiaId: number): Promise<Inscripcion[]> {
  try {
    return await fetchAPI(
      `inscripciones?materia_id=eq.${materiaId}&select=*,estudiantes(id,nombres,apellidos),materias(id,codigo,nombre),periodos(id,nombre)`,
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene las inscripciones de un periodo
 *
 * @param periodoId ID del periodo
 * @returns Lista de inscripciones del periodo
 */
export async function getInscripcionesByPeriodoId(periodoId: number): Promise<Inscripcion[]> {
  try {
    return await fetchAPI(
      `inscripciones?periodo_id=eq.${periodoId}&select=*,estudiantes(id,nombres,apellidos),materias(id,codigo,nombre),periodos(id,nombre)`,
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea una nueva inscripción
 *
 * @param inscripcion Datos de la inscripción a crear
 * @returns Inscripción creada
 */
export async function createInscripcion(
  inscripcion: Omit<Inscripcion, "id" | "created_at" | "updated_at">,
): Promise<Inscripcion> {
  try {
    // Añadir timestamps
    const inscripcionConTimestamps = {
      ...inscripcion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("inscripciones", {
      method: "POST",
      body: JSON.stringify(inscripcionConTimestamps),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza una inscripción existente
 *
 * @param id ID de la inscripción
 * @param inscripcion Datos actualizados de la inscripción
 * @returns Inscripción actualizada
 */
export async function updateInscripcion(
  id: number,
  inscripcion: Partial<Omit<Inscripcion, "id" | "created_at" | "updated_at">>,
): Promise<Inscripcion> {
  try {
    // Añadir timestamp de actualización
    const inscripcionConTimestamp = {
      ...inscripcion,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`inscripciones?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(inscripcionConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina una inscripción
 *
 * @param id ID de la inscripción a eliminar
 * @returns void
 */
export async function deleteInscripcion(id: number): Promise<void> {
  try {
    await fetchAPI(`inscripciones?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza la calificación de una inscripción
 *
 * @param id ID de la inscripción
 * @param calificacion Nueva calificación
 * @returns Inscripción actualizada
 */
export async function updateCalificacion(id: number, calificacion: number): Promise<Inscripcion> {
  try {
    const response = await fetchAPI(`inscripciones?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        calificacion,
        updated_at: new Date().toISOString(),
      }),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Verifica si un estudiante ya está inscrito en una materia en un periodo
 *
 * @param estudianteId ID del estudiante
 * @param materiaId ID de la materia
 * @param periodoId ID del periodo
 * @returns true si ya está inscrito, false en caso contrario
 */
export async function verificarInscripcionExistente(
  estudianteId: number,
  materiaId: number,
  periodoId: number,
): Promise<boolean> {
  try {
    const inscripciones = await fetchAPI(
      `inscripciones?estudiante_id=eq.${estudianteId}&materia_id=eq.${materiaId}&periodo_id=eq.${periodoId}`,
    )
    return inscripciones.length > 0
  } catch (error) {
    console.error(handleApiError(error))
    return false
  }
}
