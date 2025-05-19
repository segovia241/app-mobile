import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Profesor {
  id: number
  usuario_id?: number
  cedula: string
  nombres: string
  apellidos: string
  email: string
  telefono?: string
  direccion?: string
  fecha_nacimiento?: string
  genero?: string
  titulo?: string
  especialidad?: string
  fecha_contratacion?: string
  estado?: string
  created_at?: string
  updated_at?: string
  usuarios?: {
    id: number
    username: string
    email: string
    role: string
  }
}

/**
 * Obtiene todos los profesores
 *
 * @returns Lista de profesores
 */
export async function getProfesores(): Promise<Profesor[]> {
  try {
    return await fetchAPI("profesores?select=*,usuarios(id,username,email,role)")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un profesor por su ID
 *
 * @param id ID del profesor
 * @returns Datos del profesor
 */
export async function getProfesorById(id: number): Promise<Profesor> {
  try {
    const profesores = await fetchAPI(`profesores?id=eq.${id}&select=*,usuarios(id,username,email,role)`)
    if (profesores.length === 0) {
      throw new Error(`No se encontró el profesor con ID ${id}`)
    }
    return profesores[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un profesor por su cédula
 *
 * @param cedula Cédula del profesor
 * @returns Datos del profesor
 */
export async function getProfesorByCedula(cedula: string): Promise<Profesor> {
  try {
    const profesores = await fetchAPI(`profesores?cedula=eq.${cedula}&select=*,usuarios(id,username,email,role)`)
    if (profesores.length === 0) {
      throw new Error(`No se encontró el profesor con cédula ${cedula}`)
    }
    return profesores[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un profesor por su ID de usuario
 *
 * @param usuarioId ID del usuario
 * @returns Datos del profesor
 */
export async function getProfesorByUsuarioId(usuarioId: number): Promise<Profesor> {
  try {
    const profesores = await fetchAPI(`profesores?usuario_id=eq.${usuarioId}&select=*,usuarios(id,username,email,role)`)
    if (profesores.length === 0) {
      throw new Error(`No se encontró el profesor con usuario_id ${usuarioId}`)
    }
    return profesores[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea un nuevo profesor
 *
 * @param profesor Datos del profesor a crear
 * @returns Profesor creado
 */
export async function createProfesor(profesor: Omit<Profesor, "id" | "created_at" | "updated_at">): Promise<Profesor> {
  try {
    // Añadir timestamps
    const profesorConTimestamps = {
      ...profesor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("profesores", {
      method: "POST",
      body: JSON.stringify(profesorConTimestamps),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza un profesor existente
 *
 * @param id ID del profesor
 * @param profesor Datos actualizados del profesor
 * @returns Profesor actualizado
 */
export async function updateProfesor(
  id: number,
  profesor: Partial<Omit<Profesor, "id" | "created_at" | "updated_at">>,
): Promise<Profesor> {
  try {
    // Añadir timestamp de actualización
    const profesorConTimestamp = {
      ...profesor,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`profesores?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(profesorConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina un profesor
 *
 * @param id ID del profesor a eliminar
 * @returns void
 */
export async function deleteProfesor(id: number): Promise<void> {
  try {
    await fetchAPI(`profesores?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene profesores por departamento
 *
 * @param departamento Departamento académico
 * @returns Lista de profesores del departamento especificado
 */
export async function getProfesoresByDepartamento(departamento: string): Promise<Profesor[]> {
  try {
    return await fetchAPI(`profesores?departamento=eq.${departamento}`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Busca profesores por nombre, apellido o email
 *
 * @param query Texto a buscar
 * @returns Lista de profesores que coinciden con la búsqueda
 */
export async function searchProfesores(query: string): Promise<Profesor[]> {
  try {
    return await fetchAPI(`profesores?or=(nombres.ilike.%${query}%,apellidos.ilike.%${query}%,email.ilike.%${query}%)`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
/**
 * Obtiene profesores por especialidad
 *
 * @param especialidad Especialidad
 * @returns Lista de profesores con la especialidad especificada
 */
// export async function getProfesoresByEspecialidad(especialidad: string): Promise<Profesor[]> {
//   try {
//     return await fetchAPI(`profesores?especialidad=eq.${especialidad}&select=*,usuarios(id,username,email,role)`)
//   } catch (error) {
//     throw new Error(handleApiError(error))
//   }
// }
