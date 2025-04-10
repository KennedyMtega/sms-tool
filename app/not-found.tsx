import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>The page you are looking for doesn't exist or has been moved.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="text-8xl font-bold text-gray-200">404</div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button asChild>
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
