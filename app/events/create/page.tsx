import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import EventForm from "./EventForm";

export default async function CreateEventPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/signin?callback=/events/create");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <Navbar />
      <EventForm />
    </div>
  );
}
