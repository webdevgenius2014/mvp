import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

async function getDashboardData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard`, {
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  const data = await getDashboardData()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s what&apos;s happening with your projects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Active Projects</div>
            <div className="text-3xl font-bold mt-2">
              {data?.activeProjects?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Tasks Due Soon</div>
            <div className="text-3xl font-bold mt-2">
              {data?.tasksDue?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Recent Updates</div>
            <div className="text-3xl font-bold mt-2">
              {data?.recentActivity?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.activeProjects?.length > 0 ? (
              <div className="space-y-3">
                {data.activeProjects.map((project: any) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-gray-50 transition"
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {project._count.tasks} tasks
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No active projects</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.tasksDue?.length > 0 ? (
              <div className="space-y-3">
                {data.tasksDue.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border"
                  >
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {task.project.name} • Due {formatDate(task.dueDate)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming tasks</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentActivity?.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.slice(0, 10).map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user?.name}</span>{" "}
                      {activity.action} {activity.entityType}
                      {activity.project && (
                        <span className="text-gray-600">
                          {" "}in {activity.project.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
