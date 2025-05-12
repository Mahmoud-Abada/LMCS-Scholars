"use server";

import { db } from "@/db/client";
import { researchers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { researcherStatusEnum } from "@/db/schema";

export async function updateResearcherStatus(id: string, status: keyof typeof researcherStatusEnum) {
    try {
      // First find the researcher by ID
      const researcher = await db.query.researchers.findFirst({
        where: eq(researchers.id, id)
      });
  
      if (!researcher) {
        throw new Error(`Researcher not found`);
      }

      // Validate status
      const validStatuses: (keyof typeof researcherStatusEnum)[] = ["active", "on_leave", "inactive", "retired"];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }
  
      // Update the status
      const updated = await db.update(researchers)
        .set({ status })
        .where(eq(researchers.id, id))
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

// Function to toggle researcher status between active/inactive
export async function toggleResearcherStatus(id: string) {
  try {
    const researcher = await db.query.researchers.findFirst({
      where: eq(researchers.id, id)
    });

    if (!researcher) {
      throw new Error(`Researcher not found`);
    }

    const newStatus = researcher.status === "active" ? "inactive" : "active";
    
    const updated = await db.update(researchers)
      .set({ status: newStatus })
      .where(eq(researchers.id, id))
      .returning();
      
    if (!updated.length) {
      throw new Error("Failed to toggle researcher status");
    }
    
    revalidatePath("/researchers");
    return { 
      success: true,
      newStatus 
    };
  } catch (error) {
    console.error("Toggle researcher status error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to toggle status");
  }
}