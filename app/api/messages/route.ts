import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { content, projectId, parentId } = data

    const message = await prisma.message.create({
      data: {
        content,
        projectId,
        parentId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        action: parentId ? "replied" : "commented",
        entityType: "message",
        entityId: message.id,
        userId: session.user.id,
        projectId,
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Create message error:", error)
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    )
  }
}
