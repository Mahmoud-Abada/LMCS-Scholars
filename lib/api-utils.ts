// src/lib/api-utils.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRole } from '../types/auth';


export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const handleApiError = (error: unknown) => {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.errors },
      { status: 400 }
    );
  }
  if (error instanceof Error) {
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { error: 'Unknown server error' },
    { status: 500 }
  );
};

export const authorizeRequest = (
  userRole: UserRole,
  requiredRole: UserRole
) => {
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    researcher: 1,
    assistant: 2,
    admin: 3,
    director: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};