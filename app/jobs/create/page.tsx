import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import JobPostForm from "./JobPostForm";

export default async function CreateJobPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/signin?callback=/jobs/create");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <Navbar />
      <JobPostForm />
    </div>
  );
}
