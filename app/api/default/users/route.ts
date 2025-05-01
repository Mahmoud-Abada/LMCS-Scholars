import { NextResponse } from "next/server";
import { seedDefaultUsers } from "../../../../scripts/seed-default-users";

export async function POST() {
  try {
    await seedDefaultUsers();
    return NextResponse.json({
      success: true,
      message: "Default users seeded successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
