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
          content: "You are a project management assistant. Generate 5-8 actionable tasks based on a project brief. Return tasks as a JSON array with 'title', 'description', and 'priority' fields.",
        },
        {
          role: "user",
          content: `Generate task suggestions for this project:\n\nName: ${project.name}\nBrief: ${project.brief || project.description}\n\nReturn as JSON array.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    })

    const response = JSON.parse(completion.choices[0].message.content || "{}")
    const tasks = response.tasks || []

    // Update AI token usage
    await prisma.subscription.update({
      where: { organizationId: session.user.organizationId! },
      data: {
        aiTokensUsed: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("AI task suggestions error:", error)
    return NextResponse.json(
      { error: "Failed to generate task suggestions" },
      { status: 500 }
    )
  }
}
