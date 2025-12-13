import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const whiteLabel = await prisma.whiteLabel.findUnique({
      where: { organizationId: session.user.organizationId! },
    })

    return NextResponse.json(whiteLabel || {})
  } catch (error) {
    console.error("Get white-label error:", error)
    return NextResponse.json(
      { error: "Failed to fetch white-label settings" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if Agency tier
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: session.user.organizationId! },
    })

    if (subscription?.tier !== "AGENCY") {
      return NextResponse.json(
        { error: "White-label is only available on Agency tier" },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const brandColor = formData.get("brandColor") as string
    const accentColor = formData.get("accentColor") as string
    const customDomain = formData.get("customDomain") as string
    const logo = formData.get("logo") as File | null
    const favicon = formData.get("favicon") as File | null

    let logoUrl: string | undefined
    let faviconUrl: string | undefined

    // Handle logo upload
    if (logo) {
      const uploadDir = join(process.cwd(), "public", "uploads", "branding")
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      const bytes = await logo.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `logo-${session.user.organizationId}.${logo.name.split(".").pop()}`
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      logoUrl = `/uploads/branding/${filename}`
    }

    // Handle favicon upload
    if (favicon) {
      const uploadDir = join(process.cwd(), "public", "uploads", "branding")
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      const bytes = await favicon.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `favicon-${session.user.organizationId}.${favicon.name.split(".").pop()}`
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      faviconUrl = `/uploads/branding/${filename}`
    }

    const whiteLabel = await prisma.whiteLabel.upsert({
      where: { organizationId: session.user.organizationId! },
      create: {
        organizationId: session.user.organizationId!,
        logoUrl,
        faviconUrl,
        brandColor,
        accentColor,
        customDomain,
      },
      update: {
        ...(logoUrl && { logoUrl }),
        ...(faviconUrl && { faviconUrl }),
        ...(brandColor && { brandColor }),
        ...(accentColor && { accentColor }),
        ...(customDomain && { customDomain }),
      },
    })

    return NextResponse.json(whiteLabel)
  } catch (error) {
    console.error("Update white-label error:", error)
    return NextResponse.json(
      { error: "Failed to update white-label settings" },
      { status: 500 }
    )
  }
}
