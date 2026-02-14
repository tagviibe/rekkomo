import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HomeRedirectPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/signin?callback=/home");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  if (!user?.username) {
    redirect("/onboarding");
  }

  redirect(`/home/${user.username}`);
}
