import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CampaignsTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              {Array(7)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-8 flex-1" />
                ))}
            </div>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center">
                  {Array(7)
                    .fill(0)
                    .map((_, j) => (
                      <Skeleton key={j} className="h-12 flex-1" />
                    ))}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
