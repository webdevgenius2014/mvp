import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await req.json()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check AI token usage
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: session.user.organizationId! },
    })

    if (!subscription || subscription.aiTokensUsed >= subscription.aiTokensPerMonth) {
      return NextResponse.json(
        { error: "AI token limit reached" },
        { status: 429 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional proposal writer. Generate a comprehensive project proposal with sections: Executive Summary, Project Overview, Scope of Work, Timeline, Deliverables, and Investment.",
        },
        {
          role: "user",
          content: `Generate a professional proposal for:\n\nProject: ${project.name}\nBrief: ${project.brief || project.description}\nBudget: ${project.budget ? `₹${project.budget}` : "To be discussed"}\nOrganization: ${project.organization.name}`,
        },
      ],
      max_tokens: 1500,
    })

    const proposal = completion.choices[0].message.content

    // Update AI token usage
    await prisma.subscription.update({
      where: { organizationId: session.user.organizationId! },
      data: {
        aiTokensUsed: {
          increment: 2, // Proposals use more tokens
        },
      },
    })

    return NextResponse.json({ proposal })
  } catch (error) {
    console.error("AI proposal error:", error)
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    )
  }
}
