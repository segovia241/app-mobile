// Configuración base para la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://gzwhynhigerzmgfpgxkw.supabase.co/rest/v1"
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6d2h5bmhpZ2Vyem1nZnBneGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDAwNzksImV4cCI6MjA2MzExNjA3OX0.23hExnNnV4Osw8bVdZWKzqXjmswPnNVvp8ac4gfrxtI"

// Headers comunes para todas las peticiones
export const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
}

// Función base para hacer peticiones a la API
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}/${endpoint}`

  const defaultOptions: RequestInit = {
    headers: headers as HeadersInit,
    method: "GET",
  }

  const response = await fetch(url, { ...defaultOptions, ...options })

  if (!response.ok) {
    throw new Error(`Error API: ${response.status} - ${await response.text()}`)
  }

  return await response.json()
}

// Tipos comunes
export interface ApiResponse<T> {
  data: T
  error: string | null
}

// Función para manejar errores de la API
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    console.error("API Error:", error)
    return error.message
  }
  return "Error desconocido en la API"
}
