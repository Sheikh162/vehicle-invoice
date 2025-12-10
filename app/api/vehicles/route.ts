import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Helper to get Internal User ID
async function getInternalUserId() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });

  return user?.id || null;
}

// 1. GET: List all vehicles for the Dashboard
export async function GET() {
  try {
    const internalUserId = await getInternalUserId();
    if (!internalUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: internalUserId },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('GET /vehicles error:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

// 2. POST: Create a new vehicle
export async function POST(req: Request) {
  try {
    const internalUserId = await getInternalUserId();
    if (!internalUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { make, model, regNumber } = body;

    // Simple validation
    if (!make || !model || !regNumber) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create Record
    const newVehicle = await prisma.vehicle.create({
      data: {
        make,
        model,
        regNumber,
        userId: internalUserId,
      },
    });

    return NextResponse.json(newVehicle, { status: 201 });

  } catch (error: any) {
    console.error('POST /vehicles error:', error);
    
    // Handle unique constraint violation (Duplicate Reg Number)
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A vehicle with this Registration Number already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}