import { fetchAPI, handleApiError } from "./config"
import { format } from "date-fns"

/**
 * Verifica y crea automáticamente registros de asistencia para clases sin registro
 *
 * Esta función se ejecuta periódicamente para verificar si hay clases que ya terminaron
 * y no tienen registro de asistencia. En ese caso, marca a todos los estudiantes como
 * "Presente" y añade un comentario indicando que el profesor no registró la asistencia.
 *
 * @returns Resultado de la operación
 */
export async function checkAndCreateAutoAttendance(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // 1. Obtener la fecha actual
    const currentDate = format(new Date(), "yyyy-MM-dd")
    const currentTime = format(new Date(), "HH:mm:ss")

    // 2. Obtener todos los cursos activos
    const cursos = await fetchAPI(`cursos?estado=eq.activo&select=*,materia:materia_id(*),profesor:profesor_id(*)`)

    if (!cursos || cursos.length === 0) {
      return { success: true, message: "No hay cursos activos para verificar" }
    }

    const cursosFinalizados = []

    // 3. Para cada curso, verificar si la clase ya terminó hoy
    for (const curso of cursos) {
      // Extraer la hora de fin de la clase del horario (formato "08:00-10:00")
      if (!curso.horario || !curso.horario.includes("-")) {
        continue
      }

      const horaFin = curso.horario.split("-")[1].trim()
      const [horaFinHoras, horaFinMinutos] = horaFin.split(":").map(Number)

      // Crear una fecha con la hora de fin para hoy
      const fechaActual = new Date()
      const fechaFinClase = new Date()
      fechaFinClase.setHours(horaFinHoras, horaFinMinutos, 0)

      // Verificar si la clase ya terminó
      if (fechaActual > fechaFinClase) {
        // 4. Verificar si ya existe un registro de asistencia para este curso y fecha
        const asistencias = await fetchAPI(`asistencia?curso_id=eq.${curso.id}&fecha=eq.${currentDate}&select=count`)
        const tieneAsistencia = asistencias && asistencias.length > 0 && asistencias[0].count > 0

        if (!tieneAsistencia) {
          // 5. Obtener los estudiantes inscritos en el curso
          const inscripciones = await fetchAPI(`inscripciones_cursos?curso_id=eq.${curso.id}&select=estudiante_id`)

          if (inscripciones && inscripciones.length > 0) {
            // 6. Crear registros de asistencia automáticos
            for (const inscripcion of inscripciones) {
              await fetchAPI("asistencia", {
                method: "POST",
                body: JSON.stringify({
                  curso_id: curso.id,
                  estudiante_id: inscripcion.estudiante_id,
                  fecha: currentDate,
                  estado: "Presente", // Marcar como presente por defecto
                  comentario: "El profesor no registró la asistencia",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }),
              })
            }

            cursosFinalizados.push({
              id: curso.id,
              nombre: curso.materia?.nombre || `Curso ${curso.id}`,
              profesor: curso.profesor?.nombres || `Profesor ${curso.profesor_id}`,
              estudiantes: inscripciones.length,
            })
          }
        }
      }
    }

    return {
      success: true,
      message: `Se verificaron ${cursos.length} cursos y se crearon registros automáticos para ${cursosFinalizados.length} cursos finalizados sin registro de asistencia`,
      details: cursosFinalizados,
    }
  } catch (error) {
    console.error("Error al verificar y crear asistencias automáticas:", error)
    return { success: false, message: handleApiError(error) }
  }
}

/**
 * Ejecuta la verificación de asistencias automáticas
 * Esta función puede ser llamada desde un cron job o manualmente
 */
export async function runAutoAttendanceCheck() {
  const result = await checkAndCreateAutoAttendance()
  console.log("Resultado de verificación automática de asistencias:", result)
  return result
}
