import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)

  const isClient = session?.user?.role === UserRole.CLIENT

  const projects = await prisma.project.findMany({
    where: isClient
      ? {
          clients: {
            some: {
              clientId: session!.user.id,
            },
          },
        }
      : {
          organizationId: session!.user.organizationId!,
        },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          messages: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-blue-100 text-blue-800",
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        {!isClient && (
          <Link href="/projects/new">
            <Button>Create Project</Button>
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p className="mb-4">No projects yet</p>
            {!isClient && (
              <Link href="/projects/new">
                <Button>Create Your First Project</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-lg transition cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        statusColors[project.status]
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{project._count.tasks} tasks</span>
                    <span>{project._count.messages} messages</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    By {project.createdBy.name}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
