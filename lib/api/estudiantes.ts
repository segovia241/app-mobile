import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Estudiante {
  id: number
  usuario_id?: number
  matricula: string
  cedula: string
  nombres: string
  apellidos: string
  email: string
  telefono?: string
  direccion?: string
  fecha_nacimiento?: string
  genero?: string
  carrera?: string
  semestre?: number
  estado?: string
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todos los estudiantes
 *
 * @returns Lista de estudiantes
 */
export async function getEstudiantes(): Promise<Estudiante[]> {
  try {
    return await fetchAPI("estudiantes?select=*,usuarios(id,username,email,role)")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un estudiante por su ID
 *
 * @param id ID del estudiante
 * @returns Datos del estudiante
 */
export async function getEstudianteById(id: number): Promise<Estudiante> {
  try {
    const estudiantes = await fetchAPI(`estudiantes?id=eq.${id}&select=*,usuarios(id,username,email,role)`)
    if (estudiantes.length === 0) {
      throw new Error(`No se encontró el estudiante con ID ${id}`)
    }
    return estudiantes[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un estudiante por su matrícula
 *
 * @param matricula Matrícula del estudiante
 * @returns Datos del estudiante
 */
export async function getEstudianteByMatricula(matricula: string): Promise<Estudiante> {
  try {
    const estudiantes = await fetchAPI(
      `estudiantes?matricula=eq.${matricula}&select=*,usuarios(id,username,email,role)`,
    )
    if (estudiantes.length === 0) {
      throw new Error(`No se encontró el estudiante con matrícula ${matricula}`)
    }
    return estudiantes[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un estudiante por su cédula
 *
 * @param cedula Cédula del estudiante
 * @returns Datos del estudiante
 */
export async function getEstudianteByCedula(cedula: string): Promise<Estudiante> {
  try {
    const estudiantes = await fetchAPI(`estudiantes?cedula=eq.${cedula}&select=*,usuarios(id,username,email,role)`)
    if (estudiantes.length === 0) {
      throw new Error(`No se encontró el estudiante con cédula ${cedula}`)
    }
    return estudiantes[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un estudiante por su ID de usuario
 *
 * @param usuarioId ID del usuario
 * @returns Datos del estudiante
 */
export async function getEstudianteByUsuarioId(usuarioId: number): Promise<Estudiante> {
  try {
    const estudiantes = await fetchAPI(
      `estudiantes?usuario_id=eq.${usuarioId}&select=*,usuarios(id,username,email,role)`,
    )
    if (estudiantes.length === 0) {
      throw new Error(`No se encontró el estudiante con usuario_id ${usuarioId}`)
    }
    return estudiantes[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea un nuevo estudiante
 *
 * @param estudiante Datos del estudiante a crear
 * @returns Estudiante creado
 */
export async function createEstudiante(
  estudiante: Omit<Estudiante, "id" | "created_at" | "updated_at">,
): Promise<Estudiante> {
  try {
    // Añadir timestamps
    const estudianteConTimestamps = {
      ...estudiante,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("estudiantes", {
      method: "POST",
      body: JSON.stringify(estudianteConTimestamps),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza un estudiante existente
 *
 * @param id ID del estudiante
 * @param estudiante Datos actualizados del estudiante
 * @returns Estudiante actualizado
 */
export async function updateEstudiante(
  id: number,
  estudiante: Partial<Omit<Estudiante, "id" | "created_at" | "updated_at">>,
): Promise<Estudiante> {
  try {
    // Añadir timestamp de actualización
    const estudianteConTimestamp = {
      ...estudiante,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`estudiantes?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(estudianteConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina un estudiante
 *
 * @param id ID del estudiante a eliminar
 * @returns void
 */
export async function deleteEstudiante(id: number): Promise<void> {
  try {
    await fetchAPI(`estudiantes?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Busca estudiantes por nombre o apellido
 *
 * @param query Texto a buscar
 * @returns Lista de estudiantes que coinciden con la búsqueda
 */
export async function searchEstudiantes(query: string): Promise<Estudiante[]> {
  try {
    return await fetchAPI(
      `estudiantes?or=(nombres.ilike.%${query}%,apellidos.ilike.%${query}%)&select=*,usuarios(id,username,email,role)`,
    )
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene estudiantes por carrera
 *
 * @param carrera Carrera
 * @returns Lista de estudiantes de la carrera especificada
 */
export async function getEstudiantesByCarrera(carrera: string): Promise<Estudiante[]> {
  try {
    return await fetchAPI(`estudiantes?carrera=eq.${carrera}&select=*,usuarios(id,username,email,role)`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene estudiantes por semestre
 *
 * @param semestre Semestre
 * @returns Lista de estudiantes del semestre especificado
 */
export async function getEstudiantesBySemestre(semestre: number): Promise<Estudiante[]> {
  try {
    return await fetchAPI(`estudiantes?semestre=eq.${semestre}&select=*,usuarios(id,username,email,role)`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
