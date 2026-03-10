import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ServiceProviderRegistration from "./ServiceProviderRegistration";

export default async function ServiceProviderRegisterPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/signin?callback=/services/register");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ServiceProviderRegistration />
    </div>
  );
}
