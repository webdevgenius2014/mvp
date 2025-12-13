import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isClient = session.user.role === UserRole.CLIENT

    // Get active projects
    const activeProjects = await prisma.project.findMany({
      where: isClient
        ? {
            clients: {
              some: { clientId: session.user.id },
            },
            status: "ACTIVE",
          }
        : {
            organizationId: session.user.organizationId!,
            status: "ACTIVE",
          },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      take: 5,
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Get tasks due soon
    const tasksDue = await prisma.task.findMany({
      where: isClient
        ? {
            project: {
              clients: {
                some: { clientId: session.user.id },
              },
            },
            dueDate: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              gte: new Date(),
            },
            status: { not: "COMPLETED" },
          }
        : {
            project: {
              organizationId: session.user.organizationId!,
            },
            dueDate: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              gte: new Date(),
            },
            status: { not: "COMPLETED" },
          },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 10,
    })

    // Get recent activity
    const recentActivity = await prisma.activity.findMany({
      where: isClient
        ? {
            project: {
              clients: {
                some: { clientId: session.user.id },
              },
            },
          }
        : {
            project: {
              organizationId: session.user.organizationId!,
            },
          },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 15,
    })

    return NextResponse.json({
      activeProjects,
      tasksDue,
      recentActivity,
    })
  } catch (error) {
    console.error("Get dashboard error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
