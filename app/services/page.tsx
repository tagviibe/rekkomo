import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import ServicesBrowseClient from "./ServicesBrowseClient";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center">Loading services...</div>}>
        <ServicesBrowseClient />
      </Suspense>
    </div>
  );
}
