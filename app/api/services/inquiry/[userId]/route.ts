import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Create or get inquiry thread
export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: params.userId },
      include: {
        user: {
          include: {
            profile: {
              select: {
                currentCity: true,
                nativePlaceState: true,
              },
            },
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Service provider not found" },
        { status: 404 }
      );
    }

    // Check if inquiry already exists
    let inquiry = await prisma.serviceInquiry.findUnique({
      where: {
        providerId_customerId: {
          providerId: provider.id,
          customerId: session.user.id,
        },
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // If inquiry exists, return it
    if (inquiry) {
      return NextResponse.json({
        inquiry: {
          id: inquiry.id,
          status: inquiry.status,
          phoneRevealed: inquiry.phoneRevealed,
          messages: inquiry.messages.map((m) => ({
            id: m.id,
            content: m.content,
            isSystem: m.isSystem,
            senderId: m.senderId,
            sender: m.sender,
            createdAt: m.createdAt,
          })),
        },
      });
    }

    // Create new inquiry
    inquiry = await prisma.serviceInquiry.create({
      data: {
        providerId: provider.id,
        customerId: session.user.id,
        status: "NEW",
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Generate pre-filled message based on provider's services
    const services = provider.services as any;
    const firstService = Array.isArray(services) && services.length > 0 ? services[0] : null;
    const serviceName = firstService?.name || provider.category.replace("_", " ");
    const customerName = session.user.name || "User";
    const providerName = provider.user.name || "Provider";
    const city = provider.user.profile?.currentCity || "your area";

    // Generate Hindi message
    const prefillMessage = `Namaste ${providerName}! Mujhe ${serviceName} chahiye. Kya aap aaj available hain? Main ${city} mein hun.`;

    // Create system message
    await prisma.serviceMessage.create({
      data: {
        inquiryId: inquiry.id,
        senderId: session.user.id,
        content: prefillMessage,
        isSystem: false,
      },
    });

    return NextResponse.json({
      inquiry: {
        id: inquiry.id,
        status: inquiry.status,
        phoneRevealed: false,
        messages: [],
        prefillMessage,
      },
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { error: "Failed to create inquiry" },
      { status: 500 }
    );
  }
}

// Get inquiry thread
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: params.userId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Service provider not found" },
        { status: 404 }
      );
    }

    const inquiry = await prisma.serviceInquiry.findUnique({
      where: {
        providerId_customerId: {
          providerId: provider.id,
          customerId: session.user.id,
        },
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                profile: {
                  select: {
                    currentCity: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ inquiry: null });
    }

    // Check if phone should be revealed (after 2+ real messages)
    const realMessages = inquiry.messages.filter((m) => !m.isSystem);
    const shouldRevealPhone = realMessages.length >= 2;

    // Sort messages by createdAt
    const sortedMessages = inquiry.messages
      .map((m) => ({
        id: m.id,
        content: m.content,
        isSystem: m.isSystem,
        senderId: m.senderId,
        sender: m.sender,
        createdAt: m.createdAt,
      }))
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    return NextResponse.json({
      inquiry: {
        id: inquiry.id,
        status: inquiry.status,
        phoneRevealed: inquiry.phoneRevealed || shouldRevealPhone,
        messages: sortedMessages,
        provider: inquiry.provider.user,
      },
    });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiry" },
      { status: 500 }
    );
  }
}
