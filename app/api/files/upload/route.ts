import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "File and projectId are required" },
        { status: 400 }
      )
    }

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        clients: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", projectId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    const filepath = join(uploadDir, filename)

    await writeFile(filepath, buffer)

    // Save to database
    const fileRecord = await prisma.file.create({
      data: {
        name: filename,
        originalName: file.name,
        path: `/uploads/${projectId}/${filename}`,
        size: file.size,
        mimeType: file.type,
        projectId,
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        action: "uploaded",
        entityType: "file",
        entityId: fileRecord.id,
        userId: session.user.id,
        projectId,
      },
    })

    return NextResponse.json(fileRecord)
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
