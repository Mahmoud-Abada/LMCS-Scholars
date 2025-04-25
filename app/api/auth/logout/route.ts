import { NextResponse } from 'next/server';
import { signOut } from '@/auth';
import { auth } from '@/auth';

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await signOut({ redirect: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}