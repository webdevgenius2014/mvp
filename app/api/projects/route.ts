import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ProjectStatus, UserRole } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") as ProjectStatus | null

    let projects

    // Clients only see projects they're assigned to
    if (session.user.role === UserRole.CLIENT) {
      projects = await prisma.project.findMany({
        where: {
          clients: {
            some: {
              clientId: session.user.id,
            },
          },
          ...(status && { status }),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              messages: true,
              files: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
    } else {
      // Team members and admins see all organization projects
      projects = await prisma.project.findMany({
        where: {
          organizationId: session.user.organizationId!,
          ...(status && { status }),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              messages: true,
              files: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and team members can create projects
    if (session.user.role === UserRole.CLIENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await req.json()
    const { name, description, brief, budget, startDate, endDate, clientIds, status } = data

    const project = await prisma.project.create({
      data: {
        name,
        description,
        brief,
        budget: budget ? parseFloat(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || ProjectStatus.DRAFT,
        organizationId: session.user.organizationId!,
        createdById: session.user.id,
        clients: clientIds
          ? {
              create: clientIds.map((clientId: string) => ({
                clientId,
              })),
            }
          : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clients: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        action: "created",
        entityType: "project",
        entityId: project.id,
        userId: session.user.id,
        projectId: project.id,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}
