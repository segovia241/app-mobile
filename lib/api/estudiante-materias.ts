import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface EstudianteMateria {
  id: number
  student_id: number
  subject_id: number
  schedule_id?: number
  semester: string
  academic_year: string
  enrollment_date: string
  status?: string
  final_grade?: number
  notes?: string
  materias?: {
    id: number
    name: string
    code: string
    description?: string
  }
}

/**
 * Obtiene todas las materias asignadas a un estudiante
 *
 * @param estudianteId ID del estudiante
 * @returns Lista de materias asignadas al estudiante
 */
export async function getMateriasByEstudiante(estudianteId: number): Promise<EstudianteMateria[]> {
  try {
    return await fetchAPI(`inscripciones?student_id=eq.${estudianteId}&select=*,materias(id,name,code,description)`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Asigna una materia a un estudiante
 *
 * @param estudianteId ID del estudiante
 * @param materiaId ID de la materia
 * @param academicYear Año académico
 * @param semester Semestre
 * @returns Asignación creada
 */
export async function asignarMateriaAEstudiante(
  estudianteId: number,
  materiaId: number,
  academicYear: string,
  semester: string,
): Promise<EstudianteMateria> {
  try {
    const data = {
      student_id: estudianteId,
      subject_id: materiaId,
      academic_year: academicYear,
      semester: semester,
      enrollment_date: new Date().toISOString().split("T")[0],
      status: "active",
    }

    return await fetchAPI("inscripciones", {
      method: "POST",
      body: JSON.stringify(data),
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina la asignación de una materia a un estudiante
 *
 * @param id ID de la asignación
 * @returns void
 */
export async function eliminarMateriaDeEstudiante(id: number): Promise<void> {
  try {
    await fetchAPI(`inscripciones?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza el estado de una asignación de materia a estudiante
 *
 * @param id ID de la asignación
 * @param status Nuevo estado
 * @returns Asignación actualizada
 */
export async function actualizarEstadoMateriaEstudiante(id: number, status: string): Promise<EstudianteMateria> {
  try {
    return await fetchAPI(`inscripciones?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Verifica si un estudiante tiene asignada una materia específica
 *
 * @param estudianteId ID del estudiante
 * @param materiaId ID de la materia
 * @returns true si el estudiante tiene asignada la materia, false en caso contrario
 */
export async function estudianteTieneMateria(estudianteId: number, materiaId: number): Promise<boolean> {
  try {
    const asignaciones = await fetchAPI(
      `inscripciones?student_id=eq.${estudianteId}&subject_id=eq.${materiaId}&status=eq.active`,
    )
    return asignaciones.length > 0
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Asigna múltiples materias a un estudiante
 *
 * @param estudianteId ID del estudiante
 * @param materiaIds IDs de las materias
 * @param academicYear Año académico
 * @param semester Semestre
 * @returns Lista de asignaciones creadas
 */
export async function asignarMateriasAEstudiante(
  estudianteId: number,
  materiaIds: number[],
  academicYear: string,
  semester: string,
): Promise<EstudianteMateria[]> {
  try {
    const data = materiaIds.map((materiaId) => ({
      student_id: estudianteId,
      subject_id: materiaId,
      academic_year: academicYear,
      semester: semester,
      enrollment_date: new Date().toISOString().split("T")[0],
      status: "active",
    }))

    return await fetchAPI("inscripciones", {
      method: "POST",
      body: JSON.stringify(data),
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
