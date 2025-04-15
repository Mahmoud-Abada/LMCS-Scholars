// src/app/admin/researchers/page.tsx
import { AddResearcherDialog } from "@/components/add-researcher-dialog";
import { ResearchersTable } from "@/components/researchers--table";
//import { requireAdmin } from '@/lib/auth';
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ResearchersPage() {
  //await requireAdmin();

  const researchers = await db.query.users.findMany({
    where: eq(users.role, "researcher"),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      researcherId: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Researchers Management</h1>
        <AddResearcherDialog />
      </div>

      <ResearchersTable researchers={researchers} />
    </div>
  );
}
