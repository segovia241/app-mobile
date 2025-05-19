"use client"

import { Teachers } from "@/components/admin/teachers"

export default function TeachersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Docentes</h1>
      <Teachers />
    </div>
  )
}
