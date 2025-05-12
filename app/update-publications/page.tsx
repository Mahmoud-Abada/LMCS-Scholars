// app/update-publications/page.tsx
import { db } from "@/db/client";
import { researchers } from "@/db/schema";
import { asc } from "drizzle-orm";
import ClientPage from "./client-page";

export default async function UpdatePublicationsPage() {
  const researchersData = await db.query.researchers.findMany({
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
    },
    orderBy: (researchers, { asc }) => [asc(researchers.lastName)],
  });

  return <ClientPage researchers={researchersData} />;
}