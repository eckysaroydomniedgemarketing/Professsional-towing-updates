import { currentUser } from "@clerk/nextjs/server";
import { AppLayout } from "@/components/app-layout";
import { Briefcase, Truck, DollarSign, Star } from "lucide-react";
import { WorkflowControl } from "@/modules/module-1-rdn-portal/components/workflow-control";

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-6 hover:border-amber-300 transition-colors">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-amber-700">
                  Active Jobs
                </span>
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-amber-900">12</span>
              <span className="text-xs text-amber-600">
                +2 from yesterday
              </span>
            </div>
          </div>

          <div className="rounded-lg border-2 border-sky-200 bg-sky-50 p-6 hover:border-sky-300 transition-colors">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-sky-700">
                  Fleet Status
                </span>
                <Truck className="h-5 w-5 text-sky-600" />
              </div>
              <span className="text-2xl font-bold text-sky-900">8/10</span>
              <span className="text-xs text-sky-600">
                Available vehicles
              </span>
            </div>
          </div>

          <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-6 hover:border-emerald-300 transition-colors">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700">
                  Today&apos;s Revenue
                </span>
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-emerald-900">$2,450</span>
              <span className="text-xs text-emerald-600">
                +15% from average
              </span>
            </div>
          </div>

          <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6 hover:border-purple-300 transition-colors">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700">
                  Customer Rating
                </span>
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-900">4.8</span>
              <span className="text-xs text-purple-600">
                Based on 127 reviews
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">RDN Portal Automation</h2>
          <WorkflowControl />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border-2 border-slate-200 bg-white p-6 hover:border-slate-300 transition-colors">
            <h3 className="font-semibold mb-4 text-slate-900">Recent Jobs</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No recent jobs to display.
              </p>
            </div>
          </div>

          <div className="rounded-lg border-2 border-slate-200 bg-white p-6 hover:border-slate-300 transition-colors">
            <h3 className="font-semibold mb-4 text-slate-900">Fleet Alerts</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                All vehicles are operating normally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}