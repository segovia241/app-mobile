import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Sesion {
  id: number
  usuario_id?: number
  token: string
  ip_address?: string
  user_agent?: string
  expires_at: string
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todas las sesiones
 *
 * @returns Lista de sesiones
 */
export async function getSesiones(): Promise<Sesion[]> {
  try {
    return await fetchAPI("sesiones?select=*,usuarios(id,username,email,role)")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene una sesión por su ID
 *
 * @param id ID de la sesión
 * @returns Datos de la sesión
 */
export async function getSesionById(id: number): Promise<Sesion> {
  try {
    const sesiones = await fetchAPI(`sesiones?id=eq.${id}&select=*,usuarios(id,username,email,role)`)
    if (sesiones.length === 0) {
      throw new Error(`No se encontró la sesión con ID ${id}`)
    }
    return sesiones[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene una sesión por su token
 *
 * @param token Token de la sesión
 * @returns Datos de la sesión
 */
export async function getSesionByToken(token: string): Promise<Sesion> {
  try {
    const sesiones = await fetchAPI(`sesiones?token=eq.${token}&select=*,usuarios(id,username,email,role)`)
    if (sesiones.length === 0) {
      throw new Error(`No se encontró la sesión con token ${token}`)
    }
    return sesiones[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene las sesiones de un usuario
 *
 * @param usuarioId ID del usuario
 * @returns Lista de sesiones del usuario
 */
export async function getSesionesByUsuarioId(usuarioId: number): Promise<Sesion[]> {
  try {
    return await fetchAPI(`sesiones?usuario_id=eq.${usuarioId}&select=*,usuarios(id,username,email,role)`)
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea una nueva sesión
 *
 * @param sesion Datos de la sesión a crear
 * @returns Sesión creada
 */
export async function createSesion(sesion: Omit<Sesion, "id" | "created_at" | "updated_at">): Promise<Sesion> {
  try {
    // Añadir timestamps
    const sesionConTimestamps = {
      ...sesion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("sesiones", {
      method: "POST",
      body: JSON.stringify(sesionConTimestamps),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza una sesión existente
 *
 * @param id ID de la sesión
 * @param sesion Datos actualizados de la sesión
 * @returns Sesión actualizada
 */
export async function updateSesion(
  id: number,
  sesion: Partial<Omit<Sesion, "id" | "created_at" | "updated_at">>,
): Promise<Sesion> {
  try {
    // Añadir timestamp de actualización
    const sesionConTimestamp = {
      ...sesion,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`sesiones?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(sesionConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina una sesión
 *
 * @param id ID de la sesión a eliminar
 * @returns void
 */
export async function deleteSesion(id: number): Promise<void> {
  try {
    await fetchAPI(`sesiones?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina todas las sesiones de un usuario
 *
 * @param usuarioId ID del usuario
 * @returns void
 */
export async function deleteSesionesByUsuarioId(usuarioId: number): Promise<void> {
  try {
    await fetchAPI(`sesiones?usuario_id=eq.${usuarioId}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Verifica si una sesión es válida (no ha expirado)
 *
 * @param token Token de la sesión
 * @returns true si la sesión es válida, false en caso contrario
 */
export async function verificarSesion(token: string): Promise<boolean> {
  try {
    const sesiones = await fetchAPI(`sesiones?token=eq.${token}`)
    if (sesiones.length === 0) {
      return false
    }

    const sesion = sesiones[0]
    const ahora = new Date()
    const expiracion = new Date(sesion.expires_at)

    return ahora < expiracion
  } catch (error) {
    console.error(handleApiError(error))
    return false
  }
}
