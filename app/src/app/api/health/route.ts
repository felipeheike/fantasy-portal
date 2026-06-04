import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/prisma';

export async function GET() {
  const health = await checkDatabaseHealth();
  return NextResponse.json(health);
}
