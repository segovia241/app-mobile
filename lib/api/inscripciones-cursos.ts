import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface InscripcionCurso {
  id: number
  estudiante_id: number
  curso_id: number
  estado: string
  calificacion?: number
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todas las inscripciones a cursos
 *
 * @returns Lista de inscripciones
 */
export async function getInscripcionesCursos(): Promise<InscripcionCurso[]> {
  try {
    return await fetchAPI("inscripciones_cursos?select=*")
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
export async function getInscripcionesByEstudiante(estudianteId: number): Promise<InscripcionCurso[]> {
  try {
    return await fetchAPI(`inscripciones_cursos?estudiante_id=eq.${estudianteId}&select=*`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene las inscripciones a un curso
 *
 * @param cursoId ID del curso
 * @returns Lista de inscripciones al curso
 */
export async function getInscripcionesByCurso(cursoId: number): Promise<InscripcionCurso[]> {
  try {
    return await fetchAPI(`inscripciones_cursos?curso_id=eq.${cursoId}&select=*`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea una nueva inscripción a un curso
 *
 * @param inscripcion Datos de la inscripción
 * @returns Inscripción creada
 */
export async function createInscripcionCurso(
  inscripcion: Omit<InscripcionCurso, "id" | "created_at" | "updated_at">,
): Promise<InscripcionCurso> {
  try {
    const inscripcionConTimestamps = {
      ...inscripcion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("inscripciones_cursos", {
      method: "POST",
      body: JSON.stringify(inscripcionConTimestamps),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Inscribe a un estudiante en múltiples cursos
 *
 * @param estudianteId ID del estudiante
 * @param cursosIds IDs de los cursos
 * @returns Lista de inscripciones creadas
 */
export async function inscribirEstudianteEnCursos(
  estudianteId: number,
  cursosIds: number[],
): Promise<InscripcionCurso[]> {
  try {
    const inscripciones = []

    for (const cursoId of cursosIds) {
      const inscripcion = await createInscripcionCurso({
        estudiante_id: estudianteId,
        curso_id: cursoId,
        estado: "Inscrito",
      })
      inscripciones.push(inscripcion)
    }

    return inscripciones
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza una inscripción
 *
 * @param id ID de la inscripción
 * @param inscripcion Datos actualizados
 * @returns Inscripción actualizada
 */
export async function updateInscripcionCurso(
  id: number,
  inscripcion: Partial<Omit<InscripcionCurso, "id" | "created_at" | "updated_at">>,
): Promise<InscripcionCurso> {
  try {
    const inscripcionConTimestamp = {
      ...inscripcion,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`inscripciones_cursos?id=eq.${id}`, {
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
 * @param id ID de la inscripción
 * @returns void
 */
export async function deleteInscripcionCurso(id: number): Promise<void> {
  try {
    await fetchAPI(`inscripciones_cursos?id=eq.${id}`, {
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
export async function updateCalificacion(id: number, calificacion: number): Promise<InscripcionCurso> {
  try {
    const data = {
      calificacion,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`inscripciones_cursos?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
