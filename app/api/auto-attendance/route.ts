import { NextResponse } from "next/server"
import { runAutoAttendanceCheck } from "@/lib/api/auto-attendance"

export async function GET() {
  try {
    const result = await runAutoAttendanceCheck()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error en la API de verificación automática de asistencias:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
