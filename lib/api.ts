// Export all the API functions from individual modules
export * from "./api/materias"
export * from "./api/aulas"
export * from "./api/horarios"
export * from "./api/estudiantes"
export * from "./api/profesores"
export * from "./api/inscripciones"
export * from "./api/asistencia"
export * from "./api/periodos"
export * from "./api/usuarios"
export * from "./api/cursos"
export * from "./api/inscripciones-cursos"

// Re-export types for convenience
export type { Materia } from "./api/materias"
export type { Aula } from "./api/aulas"
export type { Horario } from "./api/horarios"
export type { Estudiante } from "./api/estudiantes"
export type { Profesor } from "./api/profesores"
export type { Inscripcion } from "./api/inscripciones"
export type { Asistencia } from "./api/asistencia"
export type { Periodo as PeriodoAcademico } from "./api/periodos"
export type { Curso } from "./api/cursos"
export type { InscripcionCurso } from "./api/inscripciones-cursos"

import { getPeriodoActivo } from "./api/periodos"

export const getPeriodoAcademicoActual = getPeriodoActivo
