import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function MessageViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </div>
        <Skeleton className="h-6 w-[100px]" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <Skeleton className="h-5 w-[120px] mb-1" />
                <Skeleton className="h-4 w-[100px] mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-4 w-[120px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 