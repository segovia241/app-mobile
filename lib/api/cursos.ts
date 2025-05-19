import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Curso {
  id: number
  profesor_id: number
  materia_id: number
  periodo_id: number
  horario: string
  dias_semana: string
  aula_id: number
  cupo_maximo: number
  cupo_actual: number
  estado: string
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todos los cursos
 *
 * @returns Lista de cursos
 */
export async function getCursos(): Promise<Curso[]> {
  try {
    return await fetchAPI("cursos?select=*")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un curso por su ID
 *
 * @param id ID del curso
 * @returns Datos del curso
 */
export async function getCursoById(id: number): Promise<Curso> {
  try {
    const cursos = await fetchAPI(`cursos?id=eq.${id}`)
    if (cursos.length === 0) {
      throw new Error(`No se encontró el curso con ID ${id}`)
    }
    return cursos[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene cursos por profesor
 *
 * @param profesorId ID del profesor
 * @returns Lista de cursos del profesor
 */
export async function getCursosByProfesor(profesorId: number): Promise<Curso[]> {
  try {
    return await fetchAPI(`cursos?profesor_id=eq.${profesorId}`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene cursos por materia
 *
 * @param materiaId ID de la materia
 * @returns Lista de cursos de la materia
 */
export async function getCursosByMateria(materiaId: number): Promise<Curso[]> {
  try {
    return await fetchAPI(`cursos?materia_id=eq.${materiaId}`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene cursos por periodo
 *
 * @param periodoId ID del periodo
 * @returns Lista de cursos del periodo
 */
export async function getCursosByPeriodo(periodoId: number): Promise<Curso[]> {
  try {
    return await fetchAPI(`cursos?periodo_id=eq.${periodoId}`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea un nuevo curso
 *
 * @param curso Datos del curso a crear
 * @returns Curso creado
 */
export async function createCurso(
  curso: Omit<Partial<Curso>, "id" | "cupo_actual" | "created_at" | "updated_at"> & {
    profesor_id: number
    materia_id: number
    horario: string
    dias_semana: string
  },
): Promise<Curso> {
  try {
    // Añadir valores por defecto y timestamps
    const cursoConDefaults = {
      ...curso,
      cupo_actual: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("cursos", {
      method: "POST",
      body: JSON.stringify(cursoConDefaults),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza un curso existente
 *
 * @param id ID del curso
 * @param curso Datos actualizados del curso
 * @returns Curso actualizado
 */
export async function updateCurso(
  id: number,
  curso: Partial<Omit<Curso, "id" | "created_at" | "updated_at">>,
): Promise<Curso> {
  try {
    // Añadir timestamp de actualización
    const cursoConTimestamp = {
      ...curso,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`cursos?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(cursoConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina un curso
 *
 * @param id ID del curso a eliminar
 * @returns void
 */
export async function deleteCurso(id: number): Promise<void> {
  try {
    await fetchAPI(`cursos?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza el cupo actual de un curso
 *
 * @param id ID del curso
 * @param cupoActual Nuevo valor del cupo actual
 * @returns Curso actualizado
 */
export async function updateCupoActual(id: number, cupoActual: number): Promise<Curso> {
  try {
    const response = await fetchAPI(`cursos?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        cupo_actual: cupoActual,
        updated_at: new Date().toISOString(),
      }),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Busca cursos por texto en materia o profesor
 *
 * @param query Texto a buscar
 * @returns Lista de cursos que coinciden con la búsqueda
 */
export async function searchCursos(query: string): Promise<Curso[]> {
  try {
    // Esta búsqueda es básica y podría mejorarse con joins en la API
    return await fetchAPI(`cursos?select=*&or=(horario.ilike.%${query}%,dias_semana.ilike.%${query}%)`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Verifica si hay conflicto de horario para un profesor
 *
 * @param profesorId ID del profesor
 * @param horario Horario a verificar
 * @param diasSemana Días de la semana a verificar
 * @param cursoIdExcluir ID del curso a excluir de la verificación (para ediciones)
 * @returns true si hay conflicto, false si no hay conflicto
 */
export async function verificarConflictoHorarioProfesor(
  profesorId: number,
  horario: string,
  diasSemana: string,
  cursoIdExcluir?: number,
): Promise<boolean> {
  try {
    // Obtener todos los cursos del profesor
    const cursos = await getCursosByProfesor(profesorId)

    // Excluir el curso que se está editando
    const cursosRelevantes = cursoIdExcluir ? cursos.filter((curso) => curso.id !== cursoIdExcluir) : cursos

    // Convertir el horario a verificar a un formato comparable (asumiendo formato HH:MM-HH:MM)
    const [horaInicio, horaFin] = horario.split("-")
    const diasArray = diasSemana.split(",").map((dia) => dia.trim())

    // Verificar conflictos
    for (const curso of cursosRelevantes) {
      const [cursoHoraInicio, cursoHoraFin] = curso.horario.split("-")
      const cursoDiasArray = curso.dias_semana.split(",").map((dia) => dia.trim())

      // Verificar si hay días en común
      const diasComunes = diasArray.filter((dia) => cursoDiasArray.includes(dia))
      if (diasComunes.length === 0) continue

      // Verificar si hay solapamiento de horarios
      if (
        (horaInicio <= cursoHoraFin && horaFin >= cursoHoraInicio) ||
        (cursoHoraInicio <= horaFin && cursoHoraFin >= horaInicio)
      ) {
        return true // Hay conflicto
      }
    }

    return false // No hay conflicto
  } catch (error) {
    console.error("Error al verificar conflicto de horario:", error)
    throw new Error(handleApiError(error))
  }
}

/**
 * Verifica si hay conflicto de horario para un aula
 *
 * @param aulaId ID del aula
 * @param horario Horario a verificar
 * @param diasSemana Días de la semana a verificar
 * @param cursoIdExcluir ID del curso a excluir de la verificación (para ediciones)
 * @returns true si hay conflicto, false si no hay conflicto
 */
export async function verificarConflictoHorarioAula(
  aulaId: number,
  horario: string,
  diasSemana: string,
  cursoIdExcluir?: number,
): Promise<boolean> {
  try {
    // Obtener todos los cursos que usan esta aula
    const cursos = await fetchAPI(`cursos?aula_id=eq.${aulaId}`)

    // Excluir el curso que se está editando
    const cursosRelevantes = cursoIdExcluir ? cursos.filter((curso) => curso.id !== cursoIdExcluir) : cursos

    // Convertir el horario a verificar a un formato comparable (asumiendo formato HH:MM-HH:MM)
    const [horaInicio, horaFin] = horario.split("-")
    const diasArray = diasSemana.split(",").map((dia) => dia.trim())

    // Verificar conflictos
    for (const curso of cursosRelevantes) {
      const [cursoHoraInicio, cursoHoraFin] = curso.horario.split("-")
      const cursoDiasArray = curso.dias_semana.split(",").map((dia) => dia.trim())

      // Verificar si hay días en común
      const diasComunes = diasArray.filter((dia) => cursoDiasArray.includes(dia))
      if (diasComunes.length === 0) continue

      // Verificar si hay solapamiento de horarios
      if (
        (horaInicio <= cursoHoraFin && horaFin >= cursoHoraInicio) ||
        (cursoHoraInicio <= horaFin && cursoHoraFin >= horaInicio)
      ) {
        return true // Hay conflicto
      }
    }

    return false // No hay conflicto
  } catch (error) {
    console.error("Error al verificar conflicto de horario de aula:", error)
    throw new Error(handleApiError(error))
  }
}
