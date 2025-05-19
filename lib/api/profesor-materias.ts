import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface ProfesorMateria {
  id: number
  profesor_id: number
  materia_id: number
  periodo_id?: number
  estado?: string
  created_at?: string
  updated_at?: string
  subject_id?: number // Para compatibilidad con código existente
}

/**
 * Obtiene todas las asignaciones de materias a profesores
 *
 * @returns Lista de asignaciones
 */
export async function getProfesorMaterias(): Promise<ProfesorMateria[]> {
  try {
    return await fetchAPI("profesor_materias?select=*")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene las materias asignadas a un profesor
 *
 * @param profesorId ID del profesor
 * @returns Lista de materias asignadas al profesor
 */
export async function getMateriasByProfesor(profesorId: number): Promise<ProfesorMateria[]> {
  try {
    const result = await fetchAPI(`profesor_materias?profesor_id=eq.${profesorId}`)

    // Añadir subject_id como alias de materia_id para compatibilidad
    return result.map((item: any) => ({
      ...item,
      subject_id: item.materia_id,
    }))
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene los profesores asignados a una materia
 *
 * @param materiaId ID de la materia
 * @returns Lista de profesores asignados a la materia
 */
export async function getProfesoresByMateria(materiaId: number): Promise<ProfesorMateria[]> {
  try {
    return await fetchAPI(`profesor_materias?materia_id=eq.${materiaId}`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Asigna una materia a un profesor
 *
 * @param profesorId ID del profesor
 * @param materiaId ID de la materia
 * @param anioAcademico Año académico
 * @param semestre Semestre
 * @returns Asignación creada
 */
export async function asignarMateriaAProfesor(
  profesorId: number,
  materiaId: number,
  anioAcademico: string,
  semestre: string,
): Promise<ProfesorMateria> {
  try {
    // Primero, intentamos obtener el ID del periodo académico
    const periodos = await fetchAPI(`periodos_academicos?academic_year=eq.${anioAcademico}&name=ilike.%${semestre}%`)

    let periodoId = null
    if (periodos && periodos.length > 0) {
      periodoId = periodos[0].id
    } else {
      // Si no existe el periodo, usamos el primer periodo activo
      const periodosActivos = await fetchAPI("periodos_academicos?is_current=eq.true")
      if (periodosActivos && periodosActivos.length > 0) {
        periodoId = periodosActivos[0].id
      }
    }

    // Crear la asignación
    const asignacion = {
      profesor_id: profesorId,
      materia_id: materiaId,
      periodo_id: periodoId,
      estado: "activo",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("profesor_materias", {
      method: "POST",
      body: JSON.stringify(asignacion),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina la asignación de una materia a un profesor
 *
 * @param profesorId ID del profesor
 * @param materiaId ID de la materia
 * @returns void
 */
export async function eliminarMateriaDeProfesor(profesorId: number, materiaId: number): Promise<void> {
  try {
    await fetchAPI(`profesor_materias?profesor_id=eq.${profesorId}&materia_id=eq.${materiaId}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
/**
 * Actualiza el estado de una asignación
 *
 * @param id ID de la asignación
 * @param estado Nuevo estado
 * @returns Asignación actualizada
 */
export async function updateEstadoAsignacion(id: number, estado: string): Promise<ProfesorMateria> {
  try {
    const data = {
      estado,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`profesor_materias?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina una asignación
 *
 * @param id ID de la asignación
 * @returns void
 */
export async function deleteAsignacion(id: number): Promise<void> {
  try {
    await fetchAPI(`profesor_materias?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
