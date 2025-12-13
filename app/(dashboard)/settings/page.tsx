import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import prisma from "@/lib/prisma"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: session!.user.organizationId! },
  })

  const organization = await prisma.organization.findUnique({
    where: { id: session!.user.organizationId! },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <p className="mt-1 text-gray-900">{organization?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Plan</label>
                <p className="mt-1 text-gray-900">
                  {subscription?.tier || "No active subscription"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-gray-900">{subscription?.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  AI Tokens Used
                </label>
                <p className="mt-1 text-gray-900">
                  {subscription?.aiTokensUsed} / {subscription?.aiTokensPerMonth}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Team Member Limit
                </label>
                <p className="mt-1 text-gray-900">
                  {subscription?.teamMemberLimit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-gray-900">{session?.user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{session?.user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-gray-900">{session?.user?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
