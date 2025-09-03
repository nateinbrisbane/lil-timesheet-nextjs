import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = await prisma.globalInvoiceSettings.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching invoice settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const {
      contractorName,
      abn,
      bankBsb,
      bankAccount,
      addressLine1,
      addressLine2,
      city,
      state,
      postcode
    } = await request.json();

    const settings = await prisma.globalInvoiceSettings.upsert({
      where: { userId: user.id },
      update: {
        contractorName,
        abn,
        bankBsb,
        bankAccount,
        addressLine1,
        addressLine2,
        city,
        state,
        postcode,
      },
      create: {
        userId: user.id,
        contractorName,
        abn,
        bankBsb,
        bankAccount,
        addressLine1,
        addressLine2,
        city,
        state,
        postcode,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving invoice settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}