import { fetchAPI, handleApiError } from "./config"

// Tipos
export interface Usuario {
  id: number
  username: string
  password: string
  email: string
  role: "admin" | "profesor" | "estudiante" // Roles válidos en la base de datos
  created_at?: string
  updated_at?: string
}

/**
 * Obtiene todos los usuarios
 *
 * @returns Lista de usuarios
 */
export async function getUsuarios(): Promise<Usuario[]> {
  try {
    return await fetchAPI("usuarios?select=*")
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un usuario por su ID
 *
 * @param id ID del usuario
 * @returns Datos del usuario
 */
export async function getUsuarioById(id: number): Promise<Usuario> {
  try {
    const usuarios = await fetchAPI(`usuarios?id=eq.${id}`)
    if (usuarios.length === 0) {
      throw new Error(`No se encontró el usuario con ID ${id}`)
    }
    return usuarios[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Obtiene un usuario por su nombre de usuario
 *
 * @param username Nombre de usuario
 * @returns Datos del usuario
 */
export async function getUsuarioByUsername(username: string): Promise<Usuario> {
  try {
    const usuarios = await fetchAPI(`usuarios?username=eq.${username}`)
    if (usuarios.length === 0) {
      throw new Error(`No se encontró el usuario con nombre de usuario ${username}`)
    }
    return usuarios[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Crea un nuevo usuario
 *
 * @param usuario Datos del usuario a crear
 * @returns Usuario creado
 */
export async function createUsuario(usuario: Omit<Usuario, "id" | "created_at" | "updated_at">): Promise<Usuario> {
  try {
    // Validar que el rol sea válido
    if (!["admin", "profesor", "estudiante"].includes(usuario.role)) {
      throw new Error(`El rol '${usuario.role}' no es válido. Debe ser 'admin', 'profesor' o 'estudiante'.`)
    }

    // Añadir timestamps
    const usuarioConTimestamps = {
      ...usuario,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI("usuarios", {
      method: "POST",
      body: JSON.stringify(usuarioConTimestamps),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Actualiza un usuario existente
 *
 * @param id ID del usuario
 * @param usuario Datos actualizados del usuario
 * @returns Usuario actualizado
 */
export async function updateUsuario(
  id: number,
  usuario: Partial<Omit<Usuario, "id" | "created_at" | "updated_at">>,
): Promise<Usuario> {
  try {
    // Validar que el rol sea válido si se está actualizando
    if (usuario.role && !["admin", "profesor", "estudiante"].includes(usuario.role)) {
      throw new Error(`El rol '${usuario.role}' no es válido. Debe ser 'admin', 'profesor' o 'estudiante'.`)
    }

    // Añadir timestamp de actualización
    const usuarioConTimestamp = {
      ...usuario,
      updated_at: new Date().toISOString(),
    }

    const response = await fetchAPI(`usuarios?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(usuarioConTimestamp),
    })

    return Array.isArray(response) ? response[0] : response
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Elimina un usuario
 *
 * @param id ID del usuario a eliminar
 * @returns void
 */
export async function deleteUsuario(id: number): Promise<void> {
  try {
    await fetchAPI(`usuarios?id=eq.${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Autentica un usuario
 *
 * @param username Nombre de usuario
 * @param password Contraseña
 * @returns Usuario autenticado
 */
export async function authenticateUsuario(username: string, password: string): Promise<Usuario> {
  try {
    const usuarios = await fetchAPI(`usuarios?username=eq.${username}&password=eq.${password}`)
    if (usuarios.length === 0) {
      throw new Error("Credenciales inválidas")
    }
    return usuarios[0]
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Verifica si un nombre de usuario ya existe
 *
 * @param username Nombre de usuario a verificar
 * @returns true si el nombre de usuario ya existe, false en caso contrario
 */
export async function usernameExists(username: string): Promise<boolean> {
  try {
    const usuarios = await fetchAPI(`usuarios?username=eq.${username}`)
    return usuarios.length > 0
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Verifica si un email ya existe
 *
 * @param email Email a verificar
 * @returns true si el email ya existe, false en caso contrario
 */
export async function emailExists(email: string): Promise<boolean> {
  try {
    const usuarios = await fetchAPI(`usuarios?email=eq.${email}`)
    return usuarios.length > 0
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}
