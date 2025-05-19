"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AutoAttendancePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runAutoAttendance = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/auto-attendance")
      const data = await response.json()

      setResult(data)

      if (data.success) {
        toast({
          title: "Verificación completada",
          description: data.message,
        })
      } else {
        setError(data.message || "Error desconocido")
        toast({
          title: "Error",
          description: data.message || "Error desconocido",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error al ejecutar verificación automática:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      toast({
        title: "Error",
        description: "No se pudo ejecutar la verificación automática",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Asistencia Automática</h2>
        <p className="text-muted-foreground">
          Verifica y crea automáticamente registros de asistencia para clases sin registro.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificación de Asistencias</CardTitle>
          <CardDescription>
            Esta herramienta verifica si hay clases que ya terminaron y no tienen registro de asistencia. En ese caso,
            marca a todos los estudiantes como "Presente" y añade un comentario indicando que el profesor no registró la
            asistencia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && result.success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Verificación completada</AlertTitle>
              <AlertDescription>
                {result.message}
                {result.details && result.details.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Cursos procesados:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {result.details.map((curso: any, index: number) => (
                        <li key={index}>
                          {curso.nombre} - Prof. {curso.profesor} ({curso.estudiantes} estudiantes)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runAutoAttendance} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Verificando..." : "Ejecutar verificación"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
