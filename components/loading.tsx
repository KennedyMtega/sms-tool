import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface LoadingProps {
  type?: "skeleton" | "spinner" | "dots"
  text?: string
  fullPage?: boolean
}

export default function Loading({ type = "skeleton", text = "Loading...", fullPage = false }: LoadingProps) {
  if (type === "spinner") {
    return (
      <div className={`flex ${fullPage ? "h-full" : "h-40"} items-center justify-center`}>
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    )
  }

  if (type === "dots") {
    return (
      <div className={`flex ${fullPage ? "h-full" : "h-40"} items-center justify-center`}>
        <div className="flex flex-col items-center">
          <div className="flex space-x-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
          </div>
          {text && <p className="mt-4 text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    )
  }

  // Default skeleton loading
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-[250px]" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-[140px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[100px] mb-2" />
                <Skeleton className="h-4 w-[160px]" />
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
