"use client"

import { Attendance } from "@/components/admin/attendance"

export default function AttendancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Asistencias</h1>
      <Attendance />
    </div>
  )
}
