import { currentUser } from "@clerk/nextjs/server";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <AppLayout showSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || "User"}!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Case Update Needed Listing Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Case Update Needed Listing</CardTitle>
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardDescription>
                Automated RDN Portal Navigation & Case Processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Automated portal login and navigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Extract case details and vehicle information</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Validate cases against business rules</span>
                </div>
              </div>
              
              <div className="pt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Complete end-to-end case processing automation
                </p>
                <p className="text-sm text-muted-foreground">
                  • Navigate through cases automatically
                </p>
                <p className="text-sm text-muted-foreground">
                  • Verify ZIP code coverage areas
                </p>
                <p className="text-sm text-muted-foreground">
                  • Check order types and case status
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/case-processing" className="w-full">
                <Button className="w-full" size="lg">
                  Go to Case Update Needed Listing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Agent Updates Visibility Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Agent Updates Visibility</CardTitle>
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <CardDescription>
                Control Update Visibility in RDN Portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Toggle agent update visibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Filter updates by specific criteria</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Process multiple cases in batches</span>
                </div>
              </div>
              
              <div className="pt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Manage which updates are visible in the portal
                </p>
                <p className="text-sm text-muted-foreground">
                  • Show or hide specific updates
                </p>
                <p className="text-sm text-muted-foreground">
                  • Choose automatic or manual mode
                </p>
                <p className="text-sm text-muted-foreground">
                  • Track changes in real-time
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/agent-updates-visibility" className="w-full">
                <Button className="w-full" size="lg" variant="secondary">
                  Go to Agent Updates
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}