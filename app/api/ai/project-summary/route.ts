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

    // Get project with recent updates
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          orderBy: { updatedAt: "desc" },
          take: 10,
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            author: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check and update AI token usage
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: session.user.organizationId! },
    })

    if (!subscription || subscription.aiTokensUsed >= subscription.aiTokensPerMonth) {
      return NextResponse.json(
        { error: "AI token limit reached" },
        { status: 429 }
      )
    }

    // Prepare context for AI
    const context = `
Project: ${project.name}
Description: ${project.description || "N/A"}
Status: ${project.status}

Recent Tasks:
${project.tasks.map((t) => `- ${t.title} (${t.status})`).join("\n")}

Recent Messages:
${project.messages.map((m) => `${m.author.name}: ${m.content.substring(0, 100)}`).join("\n")}
    `.trim()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a project manager assistant. Generate a concise, professional project summary highlighting key updates, progress, and next steps.",
        },
        {
          role: "user",
          content: `Generate a project update summary based on this information:\n\n${context}`,
        },
      ],
      max_tokens: 500,
    })

    const summary = completion.choices[0].message.content

    // Update AI token usage (approximate)
    await prisma.subscription.update({
      where: { organizationId: session.user.organizationId! },
      data: {
        aiTokensUsed: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("AI summary error:", error)
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    )
  }
}
