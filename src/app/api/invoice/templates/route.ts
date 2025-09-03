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

    const templates = await prisma.invoiceTemplate.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: [
        { isDefault: 'desc' },
        { templateName: 'asc' }
      ],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching invoice templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
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

    const templateData = await request.json();

    // If setting as default, remove default from other templates
    if (templateData.isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        userId: user.id,
        ...templateData,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating invoice template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}