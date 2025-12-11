import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkUser } from '@/lib/checkUser';

// FIX: Helper should strictly return string or null
async function getInternalUserId() {
  const user = await checkUser(); 

  if (!user) {
      return null; // Return null, not a Response object
  }

  return user.id;
}

// 1. GET: List all vehicles for the Dashboard
export async function GET() {
  try {
    const internalUserId = await getInternalUserId();
    
    // Check if ID is null. If so, return the error response here.
    if (!internalUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: internalUserId }, // Now TypeScript knows this is a string
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

    if (!make || !model || !regNumber) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        make,
        model,
        regNumber,
        userId: internalUserId, // internalUserId is strictly a string here
      },
    });

    return NextResponse.json(newVehicle, { status: 201 });

  } catch (error: any) {
    console.error('POST /vehicles error:', error);
    
    if (error.code === 'P2002') {
        return NextResponse.json({ error: "A vehicle with this Registration Number already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}