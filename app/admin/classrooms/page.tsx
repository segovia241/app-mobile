"use client"

import { Classrooms } from "@/components/admin/classrooms"

export default function ClassroomsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Salones</h1>
      <Classrooms />
    </div>
  )
}
