import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Asistencia {
  id: number
  curso_id?: number
  estudiante_id?: number
  fecha: string
  estado: string // Puede ser "Presente", "Ausente", "Tardanza", "Justificado"
  comentario?: string
  registrado_por?: number
  created_at?: string
  updated_at?: string
  schedule_id?: number
  student_id?: number
}

/**
 * Obtiene todos los registros de asistencia
 *
 * @returns Lista de registros de asistencia
 */
export async function getAsistencias(): Promise<Asistencia[]> {
  try {
    return await fetchAPI("asistencia?select=*")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene registros de asistencia por fecha
 *
 * @param fecha Fecha en formato YYYY-MM-DD
 * @returns Lista de registros de asistencia de la fecha
 */
export async function getAsistenciasByFecha(fecha: string): Promise<Asistencia[]> {
  try {
    return await fetchAPI(`asistencia?fecha=eq.${fecha}&select=*`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene registros de asistencia por estudiante
 *
 * @param estudianteId ID del estudiante
 * @returns Lista de registros de asistencia del estudiante
 */
export async function getAsistenciasByEstudiante(estudianteId: number): Promise<Asistencia[]> {
  try {
    // Buscar tanto en estudiante_id como en student_id para compatibilidad
    return await fetchAPI(`asistencia?or=(estudiante_id.eq.${estudianteId},student_id.eq.${estudianteId})&select=*`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene registros de asistencia por horario
 *
 * @param horarioId ID del horario
 * @returns Lista de registros de asistencia del horario
 */
export async function getAsistenciasByHorario(horarioId: number): Promise<Asistencia[]> {
  try {
    return await fetchAPI(`asistencia?schedule_id=eq.${horarioId}&select=*`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene registros de asistencia por curso
 *
 * @param cursoId ID del curso
 * @returns Lista de registros de asistencia del curso
 */
export async function getAsistenciasByCurso(cursoId: number): Promise<Asistencia[]> {
  try {
    return await fetchAPI(`asistencia?curso_id=eq.${cursoId}&select=*`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Guarda registros de asistencia
 *
 * @param asistencias Lista de registros de asistencia a guardar
 * @returns Lista de registros de asistencia guardados
 */
export async function saveAsistencias(
  asistencias: Omit<Asistencia, "id" | "created_at" | "updated_at">[],
): Promise<Asistencia[]> {
  try {
    // Añadir timestamps
    const asistenciasConTimestamps = asistencias.map((asistencia) => ({
      ...asistencia,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    return await fetchAPI("asistencia", {
      method: "POST",
      body: JSON.stringify(asistenciasConTimestamps),
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza un registro de asistencia existente
 *
 * @param id ID del registro de asistencia
 * @param asistencia Datos actualizados del registro de asistencia
 * @returns Registro de asistencia actualizado
 */
export async function updateAsistencia(id: number, asistencia: Partial<Asistencia>): Promise<Asistencia> {
  try {
    // Añadir timestamp de actualización
    const asistenciaConTimestamp = {
      ...asistencia,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`asistencia?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(asistenciaConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina un registro de asistencia
 *
 * @param id ID del registro de asistencia a eliminar
 * @returns void
 */
export async function deleteAsistencia(id: number): Promise<void> {
  try {
    await fetchAPI(`asistencia?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene registros de asistencia por profesor
 *
 * @param profesorId ID del profesor
 * @returns Lista de registros de asistencia del profesor
 */
export async function getAsistenciasByProfesor(profesorId: number): Promise<Asistencia[]> {
  try {
    return await fetchAPI(`asistencia?registrado_por=eq.${profesorId}&select=*`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene registros de asistencia con información detallada
 * Incluye datos del estudiante, curso, materia y profesor
 *
 * @returns Lista de registros de asistencia con detalles
 */
export async function getAsistenciasDetalladas(): Promise<any[]> {
  try {
    return await fetchAPI(`
      asistencia?select=*,
      estudiantes:estudiante_id(*,usuarios(*)),
      cursos:curso_id(*,
        materias:materia_id(*),
        profesores:profesor_id(*,usuarios(*))
      )
    `)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene registros de asistencia por profesor con información detallada
 *
 * @param profesorId ID del profesor
 * @returns Lista de registros de asistencia del profesor con detalles
 */
export async function getAsistenciasDetalladasByProfesor(profesorId: number): Promise<any[]> {
  try {
    return await fetchAPI(`
      asistencia?registrado_por=eq.${profesorId}&select=*,
      estudiantes:estudiante_id(*,usuarios(*)),
      cursos:curso_id(*,
        materias:materia_id(*),
        profesores:profesor_id(*,usuarios(*))
      )
    `)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
