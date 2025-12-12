import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkUser } from '@/lib/checkUser';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoiceId = (await params).id;

    const messages = await prisma.message.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    return NextResponse.json(messages);

  } catch (error) {
    console.error("Fetch Messages Error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}