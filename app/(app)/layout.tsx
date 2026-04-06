import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { PushProvider } from "@/components/push/push-provider";

// This layout only enforces authentication.
// Each sub-layout (dashboard, group pages) renders its own AppSidebar
// to avoid double-sidebar nesting.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return (
    <>
      {children}
      <PushProvider />
    </>
  );
}
