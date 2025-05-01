"use server";

import { db } from "@/db/client";
import { researchers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { researcherStatusEnum } from "@/db/schema";

export async function updateResearcherStatus(name: string, status: keyof typeof researcherStatusEnum) {
    try {
      // First find the researcher by name
      const researcher = await db.query.researchers.findFirst({
        where: eq(researchers.name, name)
      });
  
      if (!researcher) {
        throw new Error(`Researcher with name "${name}" not found`);
      }
  
      // Then update by the found ID
      const updated = await db.update(researchers)
        .set({ status })
        .where(eq(researchers.id, researcher.id))
        .returning();
        
      if (!updated.length) {
        throw new Error("Failed to update researcher status");
      }
      
      revalidatePath("/researchers");
      return { success: true };
    } catch (error) {
      console.error("Update status error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to update status");
    }
  }

export async function deleteResearcher(id: string) {
  try {
    // First find the researcher by ID
    const researcher = await db.query.researchers.findFirst({
      where: eq(researchers.id, id)
    });

    if (!researcher) {
      throw new Error("Researcher not found");
    }

    // Then delete by the found ID
    const deleted = await db.delete(researchers)
      .where(eq(researchers.id, researcher.id))
      .returning();
      
    if (!deleted.length) {
      throw new Error("Failed to delete researcher");
    }
    
    revalidatePath("/researchers");
    return { success: true };
  } catch (error) {
    console.error("Delete researcher error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete");
  }
}