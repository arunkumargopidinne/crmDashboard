import React, { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export const metadata = {
  title: "CRM Dashboard",
  description: "Contact Management System",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
