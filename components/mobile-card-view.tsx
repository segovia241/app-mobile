import type React from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Column {
  key: string
  title: string
  render?: (value: any) => React.ReactNode
}

interface MobileCardViewProps {
  data: any[]
  columns: Column[]
  actions?: (item: any) => React.ReactNode
  title?: (item: any) => React.ReactNode
  subtitle?: (item: any) => React.ReactNode
}

export function MobileCardView({ data, columns, actions, title, subtitle }: MobileCardViewProps) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            {title ? (
              title(item)
            ) : (
              <CardTitle className="text-base">{item[columns[0].key] || `Item ${index + 1}`}</CardTitle>
            )}
            {subtitle && <div className="text-sm text-muted-foreground">{subtitle(item)}</div>}
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              {columns.slice(title ? 0 : 1).map((column) => (
                <div key={column.key} className="flex justify-between">
                  <span className="text-sm font-medium">{column.title}:</span>
                  <span className="text-sm">
                    {column.render ? column.render(item[column.key]) : item[column.key] || "-"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
          {actions && <CardFooter className="flex justify-end pt-0">{actions(item)}</CardFooter>}
        </Card>
      ))}
    </div>
  )
}

// Mantener la exportación por defecto para compatibilidad con el código existente
export default MobileCardView
