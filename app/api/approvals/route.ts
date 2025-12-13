import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only clients can create approvals
    if (session.user.role !== UserRole.CLIENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await req.json()
    const { projectId, status, comment } = data

    const approval = await prisma.approval.create({
      data: {
        projectId,
        status,
        comment,
        approvedById: session.user.id,
        approvedAt: status !== "pending" ? new Date() : null,
      },
      include: {
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        action: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "requested_approval",
        entityType: "approval",
        entityId: approval.id,
        userId: session.user.id,
        projectId,
      },
    })

    return NextResponse.json(approval)
  } catch (error) {
    console.error("Create approval error:", error)
    return NextResponse.json(
      { error: "Failed to create approval" },
      { status: 500 }
    )
  }
}
