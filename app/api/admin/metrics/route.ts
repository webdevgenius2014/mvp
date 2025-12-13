import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const organizationId = session.user.organizationId!

    // Get counts
    const [totalProjects, activeProjects, totalTasks, completedTasks, totalUsers, totalMessages] = await Promise.all([
      prisma.project.count({ where: { organizationId } }),
      prisma.project.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.task.count({ where: { project: { organizationId } } }),
      prisma.task.count({ where: { project: { organizationId }, status: "COMPLETED" } }),
      prisma.user.count({ where: { organizationId } }),
      prisma.message.count({ where: { project: { organizationId } } }),
    ])

    // Get subscription info
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    })

    // Get recent activity
    const recentActivity = await prisma.activity.findMany({
      where: { project: { organizationId } },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      totalUsers,
      totalMessages,
      subscription: {
        tier: subscription?.tier,
        status: subscription?.status,
        aiTokensUsed: subscription?.aiTokensUsed,
        aiTokensPerMonth: subscription?.aiTokensPerMonth,
        teamMemberLimit: subscription?.teamMemberLimit,
      },
      recentActivity,
    })
  } catch (error) {
    console.error("Get metrics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    )
  }
}
