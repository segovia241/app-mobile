import { fetchAPI, handleApiError } from "./config"
import { jwtDecode } from "jwt-decode"
import Cookies from "js-cookie"

// Tipos
export interface LoginCredentials {
  username: string
  password: string
}

export interface Session {
  token: string
  user: {
    id: number
    username: string
    email: string
    role: string
    first_name: string
    last_name: string
  }
  expiresAt: Date
}

const SESSION_COOKIE_NAME = "auth_session"

/**
 * Inicia sesión con credenciales
 *
 * @param credentials Credenciales de inicio de sesión
 * @returns Sesión del usuario
 */
export async function login(credentials: LoginCredentials): Promise<Session> {
  try {
    // En una aplicación real, esto sería una llamada a un endpoint de autenticación
    // que verificaría las credenciales y devolvería un token JWT
    const response = await fetchAPI("auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    if (!response || !response.token) {
      throw new Error("Credenciales inválidas")
    }

    const session: Session = {
      token: response.token,
      user: {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
      },
      expiresAt: new Date(response.expiresAt),
    }

    // Guardar la sesión en una cookie
    saveSession(session)

    return session
  } catch (error) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Cierra la sesión actual
 */
export async function logout(): Promise<void> {
  try {
    // En una aplicación real, esto podría ser una llamada a un endpoint para invalidar el token
    // await fetchAPI("auth/logout", { method: "POST" })

    // Eliminar la cookie de sesión
    Cookies.remove(SESSION_COOKIE_NAME)

    // Eliminar la sesión del localStorage si se está usando
    localStorage.removeItem(SESSION_COOKIE_NAME)
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
  }
}

/**
 * Verifica si hay una sesión activa
 *
 * @returns Sesión del usuario o null si no hay sesión
 */
export function getSession(): Session | null {
  try {
    // Intentar obtener la sesión de la cookie
    const sessionData = Cookies.get(SESSION_COOKIE_NAME)

    if (!sessionData) {
      return null
    }

    const session: Session = JSON.parse(sessionData)

    // Verificar si la sesión ha expirado
    if (new Date(session.expiresAt) < new Date()) {
      // La sesión ha expirado, eliminarla
      Cookies.remove(SESSION_COOKIE_NAME)
      return null
    }

    return session
  } catch (error) {
    console.error("Error al obtener la sesión:", error)
    return null
  }
}

/**
 * Guarda la sesión en una cookie
 *
 * @param session Sesión a guardar
 */
function saveSession(session: Session): void {
  Cookies.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    expires: new Date(session.expiresAt),
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })
}

/**
 * Verifica si el usuario tiene un rol específico
 *
 * @param role Rol a verificar
 * @returns true si el usuario tiene el rol, false en caso contrario
 */
export function hasRole(role: string): boolean {
  const session = getSession()
  return session !== null && session.user.role === role
}

/**
 * Actualiza la fecha de último inicio de sesión del usuario
 *
 * @param userId ID del usuario
 */
export async function updateLastLogin(userId: number): Promise<void> {
  try {
    await fetchAPI(`usuarios?id=eq.${userId}`, {
      method: "PATCH",
      body: JSON.stringify({
        last_login: new Date().toISOString(),
      }),
    })
  } catch (error) {
    console.error("Error al actualizar último inicio de sesión:", error)
  }
}

/**
 * Obtiene el usuario actual basado en la sesión
 *
 * @returns Información del usuario o null si no hay sesión
 */
export function getCurrentUser() {
  const session = getSession()
  return session ? session.user : null
}

/**
 * Verifica si el token JWT es válido
 *
 * @param token Token JWT a verificar
 * @returns true si el token es válido, false en caso contrario
 */
export function isValidToken(token: string): boolean {
  try {
    const decoded = jwtDecode(token)
    const currentTime = Date.now() / 1000

    // @ts-ignore - exp es una propiedad estándar de JWT
    return decoded && decoded.exp > currentTime
  } catch (error) {
    return false
  }
}
