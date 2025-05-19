"use client"

import { Students } from "@/components/admin/students"

export default function StudentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Alumnos</h1>
      <Students />
    </div>
  )
}
