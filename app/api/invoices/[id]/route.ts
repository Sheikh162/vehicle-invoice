import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { checkUser } from '@/lib/checkUser';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { fileUrl: true, serviceCenter: true, totalCost: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove an invoice and its chat history
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoiceId = (await params).id;

    // Verify ownership before deleting
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.userId !== user.id) {
      return NextResponse.json({ error: "Invoice not found or unauthorized" }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete Invoice Error:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}