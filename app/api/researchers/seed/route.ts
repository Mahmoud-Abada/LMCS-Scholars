
import { NextResponse } from 'next/server';
import { seedResearchers } from '../../../../scripts/seed-researchers';

export async function GET() {
  try {
    await seedResearchers();
    return NextResponse.json({ 
      success: true,
      message: 'Researchers seeded successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}