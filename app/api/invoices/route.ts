import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkUser } from '@/lib/checkUser';

export async function GET() {
  try {
    const user = await checkUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoices = await prisma.invoice.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc' // Newest first
      },
      include: {
        vehicle: true // Include vehicle details (Make/Model) to show in the table
      }
    });

    return NextResponse.json(invoices);

  } catch (error) {
    console.error("Fetch Invoices Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}