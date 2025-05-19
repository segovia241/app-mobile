import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Horario {
  id: number
  materia_id?: number
  profesor_id?: number
  aula_id?: number
  periodo_id?: number
  dia_semana?: string
  hora_inicio: string
  hora_fin: string
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todos los horarios
 *
 * @returns Lista de horarios
 */
export async function getHorarios(): Promise<Horario[]> {
  try {
    return await fetchAPI(
      "horarios?select=*,materias(id,codigo,nombre),profesores(id,nombres,apellidos),aulas(id,codigo,nombre),periodos(id,nombre)",
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un horario por su ID
 *
 * @param id ID del horario
 * @returns Datos del horario
 */
export async function getHorarioById(id: number): Promise<Horario> {
  try {
    const horarios = await fetchAPI(
      `horarios?id=eq.${id}&select=*,materias(id,codigo,nombre),profesores(id,nombres,apellidos),aulas(id,codigo,nombre),periodos(id,nombre)`,
    )
    if (horarios.length === 0) {
      throw new Error(`No se encontró el horario con ID ${id}`)
    }
    return horarios[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene los horarios de un profesor
 *
 * @param profesorId ID del profesor
 * @returns Lista de horarios del profesor
 */
export async function getHorariosByProfesorId(profesorId: number): Promise<Horario[]> {
  try {
    return await fetchAPI(
      `horarios?profesor_id=eq.${profesorId}&select=*,materias(id,codigo,nombre),profesores(id,nombres,apellidos),aulas(id,codigo,nombre),periodos(id,nombre)`,
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene los horarios de una materia
 *
 * @param materiaId ID de la materia
 * @returns Lista de horarios de la materia
 */
export async function getHorariosByMateriaId(materiaId: number): Promise<Horario[]> {
  try {
    return await fetchAPI(
      `horarios?materia_id=eq.${materiaId}&select=*,materias(id,codigo,nombre),profesores(id,nombres,apellidos),aulas(id,codigo,nombre),periodos(id,nombre)`,
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene los horarios de un aula
 *
 * @param aulaId ID del aula
 * @returns Lista de horarios del aula
 */
export async function getHorariosByAulaId(aulaId: number): Promise<Horario[]> {
  try {
    return await fetchAPI(
      `horarios?aula_id=eq.${aulaId}&select=*,materias(id,codigo,nombre),profesores(id,nombres,apellidos),aulas(id,codigo,nombre),periodos(id,nombre)`,
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene los horarios de un periodo
 *
 * @param periodoId ID del periodo
 * @returns Lista de horarios del periodo
 */
export async function getHorariosByPeriodoId(periodoId: number): Promise<Horario[]> {
  try {
    return await fetchAPI(
      `horarios?periodo_id=eq.${periodoId}&select=*,materias(id,codigo,nombre),profesores(id,nombres,apellidos),aulas(id,codigo,nombre),periodos(id,nombre)`,
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea un nuevo horario
 *
 * @param horario Datos del horario a crear
 * @returns Horario creado
 */
export async function createHorario(horario: Omit<Horario, "id" | "created_at" | "updated_at">): Promise<Horario> {
  try {
    // Añadir timestamps
    const horarioConTimestamps = {
      ...horario,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("horarios", {
      method: "POST",
      body: JSON.stringify(horarioConTimestamps),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza un horario existente
 *
 * @param id ID del horario
 * @param horario Datos actualizados del horario
 * @returns Horario actualizado
 */
export async function updateHorario(
  id: number,
  horario: Partial<Omit<Horario, "id" | "created_at" | "updated_at">>,
): Promise<Horario> {
  try {
    // Añadir timestamp de actualización
    const horarioConTimestamp = {
      ...horario,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`horarios?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(horarioConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina un horario
 *
 * @param id ID del horario a eliminar
 * @returns void
 */
export async function deleteHorario(id: number): Promise<void> {
  try {
    await fetchAPI(`horarios?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Verifica si hay conflictos de horario para un aula
 *
 * @param aulaId ID del aula
 * @param diaSemana Día de la semana
 * @param horaInicio Hora de inicio
 * @param horaFin Hora de fin
 * @param periodoId ID del periodo
 * @param horarioIdExcluir ID del horario a excluir (para edición)
 * @returns true si hay conflicto, false en caso contrario
 */
export async function verificarConflictoAula(
  aulaId: number,
  diaSemana: string,
  horaInicio: string,
  horaFin: string,
  periodoId: number,
  horarioIdExcluir?: number,
): Promise<boolean> {
  try {
    let query = `horarios?aula_id=eq.${aulaId}&dia_semana=eq.${diaSemana}&periodo_id=eq.${periodoId}`

    if (horarioIdExcluir) {
      query += `&id=neq.${horarioIdExcluir}`
    }

    const horarios = await fetchAPI(query)

    // Verificar si hay solapamiento de horarios
    for (const horario of horarios) {
      const inicioExistente = horario.hora_inicio
      const finExistente = horario.hora_fin

      // Verificar solapamiento
      if (
        (horaInicio >= inicioExistente && horaInicio < finExistente) ||
        (horaFin > inicioExistente && horaFin <= finExistente) ||
        (horaInicio <= inicioExistente && horaFin >= finExistente)
      ) {
        return true // Hay conflicto
      }
    }

    return false // No hay conflicto
  } catch (error) {
    console.error(handleApiError(error))
    return true // En caso de error, asumimos que hay conflicto por seguridad
  }
}

/**
 * Verifica si hay conflictos de horario para un profesor
 *
 * @param profesorId ID del profesor
 * @param diaSemana Día de la semana
 * @param horaInicio Hora de inicio
 * @param horaFin Hora de fin
 * @param periodoId ID del periodo
 * @param horarioIdExcluir ID del horario a excluir (para edición)
 * @returns true si hay conflicto, false en caso contrario
 */
export async function verificarConflictoProfesor(
  profesorId: number,
  diaSemana: string,
  horaInicio: string,
  horaFin: string,
  periodoId: number,
  horarioIdExcluir?: number,
): Promise<boolean> {
  try {
    let query = `horarios?profesor_id=eq.${profesorId}&dia_semana=eq.${diaSemana}&periodo_id=eq.${periodoId}`

    if (horarioIdExcluir) {
      query += `&id=neq.${horarioIdExcluir}`
    }

    const horarios = await fetchAPI(query)

    // Verificar si hay solapamiento de horarios
    for (const horario of horarios) {
      const inicioExistente = horario.hora_inicio
      const finExistente = horario.hora_fin

      // Verificar solapamiento
      if (
        (horaInicio >= inicioExistente && horaInicio < finExistente) ||
        (horaFin > inicioExistente && horaFin <= finExistente) ||
        (horaInicio <= inicioExistente && horaFin >= finExistente)
      ) {
        return true // Hay conflicto
      }
    }

    return false // No hay conflicto
  } catch (error) {
    console.error(handleApiError(error))
    return true // En caso de error, asumimos que hay conflicto por seguridad
  }
}

// Función de compatibilidad para el dashboard
export async function getHorariosByProfesor(profesorId: number): Promise<Horario[]> {
  return getHorariosByProfesorId(profesorId)
}
