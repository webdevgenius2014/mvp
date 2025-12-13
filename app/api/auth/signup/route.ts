import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import prisma from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const { email, password, name, role, organizationName } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    // If signing up as ADMIN, create organization
    let organizationId: string | undefined

    if (role === UserRole.ADMIN) {
      const organization = await prisma.organization.create({
        data: {
          name: organizationName || `${name}'s Organization`,
          subscription: {
            create: {
              tier: "STARTER",
              status: "TRIALING",
              teamMemberLimit: 1,
              aiTokensPerMonth: 100,
            },
          },
        },
      })
      organizationId = organization.id
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || UserRole.TEAM_MEMBER,
        organizationId,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
