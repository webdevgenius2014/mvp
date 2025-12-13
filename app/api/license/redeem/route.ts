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

    const { licenseKey } = await req.json()

    const license = await prisma.license.findUnique({
      where: { licenseKey },
    })

    if (!license) {
      return NextResponse.json({ error: "Invalid license key" }, { status: 400 })
    }

    if (license.isRedeemed) {
      return NextResponse.json({ error: "License already redeemed" }, { status: 400 })
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      return NextResponse.json({ error: "License expired" }, { status: 400 })
    }

    // Redeem license
    await prisma.license.update({
      where: { licenseKey },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
        organizationId: session.user.organizationId!,
      },
    })

    // Update organization subscription based on license type
    let tier: any = "PRO"
    let teamMemberLimit = 5
    let aiTokensPerMonth = 1000

    if (license.licenseType === "enterprise") {
      tier = "AGENCY"
      teamMemberLimit = 999999
      aiTokensPerMonth = 10000
    } else if (license.licenseType === "developer") {
      teamMemberLimit = 10
      aiTokensPerMonth = 2000
    }

    await prisma.subscription.update({
      where: { organizationId: session.user.organizationId! },
      data: {
        tier,
        status: "ACTIVE",
        teamMemberLimit,
        aiTokensPerMonth,
        currentPeriodEnd: license.expiresAt,
      },
    })

    return NextResponse.json({ success: true, licenseType: license.licenseType })
  } catch (error) {
    console.error("License redemption error:", error)
    return NextResponse.json(
      { error: "Failed to redeem license" },
      { status: 500 }
    )
  }
}
