import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Get all inquiries for the current user (as customer or provider)
export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get inquiries where user is the customer
    const customerInquiries = await prisma.serviceInquiry.findMany({
      where: {
        customerId: session.user.id,
      },
      include: {
        provider: {
          select: {
            id: true,
            category: true,
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get only the latest message
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Get inquiries where user is the provider
    const providerInquiries = await prisma.serviceInquiry.findMany({
      where: {
        provider: {
          userId: session.user.id,
        },
      },
      include: {
        customer: {
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
        provider: {
          select: {
            id: true,
            category: true,
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get only the latest message
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform customer inquiries
    const customerConversations = customerInquiries.map((inquiry) => {
      const latestMessage = inquiry.messages[0];
      const unreadCount = 0; // TODO: Implement unread count tracking

      return {
        id: inquiry.id,
        inquiryId: inquiry.id,
        type: "customer" as const,
        status: inquiry.status,
        phoneRevealed: inquiry.phoneRevealed,
        updatedAt: inquiry.updatedAt,
        createdAt: inquiry.createdAt,
        otherUser: inquiry.provider.user,
        provider: {
          id: inquiry.provider.id,
          category: inquiry.provider.category,
        },
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              content: latestMessage.content,
              isSystem: latestMessage.isSystem,
              senderId: latestMessage.senderId,
              sender: latestMessage.sender,
              createdAt: latestMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    });

    // Transform provider inquiries
    const providerConversations = providerInquiries.map((inquiry) => {
      const latestMessage = inquiry.messages[0];
      const unreadCount = 0; // TODO: Implement unread count tracking

      return {
        id: inquiry.id,
        inquiryId: inquiry.id,
        type: "provider" as const,
        status: inquiry.status,
        phoneRevealed: inquiry.phoneRevealed,
        updatedAt: inquiry.updatedAt,
        createdAt: inquiry.createdAt,
        otherUser: inquiry.customer,
        provider: {
          id: inquiry.provider.id,
          category: inquiry.provider.category,
        },
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              content: latestMessage.content,
              isSystem: latestMessage.isSystem,
              senderId: latestMessage.senderId,
              sender: latestMessage.sender,
              createdAt: latestMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    });

    // Get general conversations (not service-related)
    const generalConversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id },
        ],
      },
      include: {
        user1: {
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
        user2: {
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform general conversations
    const generalConvList = generalConversations.map((conv) => {
      const latestMessage = conv.messages[0];
      const otherUser =
        conv.user1Id === session.user.id ? conv.user2 : conv.user1;
      const unreadCount = 0; // TODO: Implement unread count tracking

      return {
        id: conv.id,
        conversationId: conv.id,
        type: "general" as const,
        status: null,
        phoneRevealed: false,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
        otherUser,
        provider: null,
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              content: latestMessage.content,
              isSystem: false,
              senderId: latestMessage.senderId,
              sender: latestMessage.sender,
              createdAt: latestMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    });

    // Get pending friend requests received
    const incomingFriendRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: session.user.id,
        status: "PENDING",
      },
      include: {
        sender: {
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform friend requests to conversation-like format
    const friendRequestConversations = incomingFriendRequests.map((req) => ({
      id: `friend-request-${req.id}`,
      type: "friend_request" as const,
      requestId: req.id,
      status: req.status,
      updatedAt: req.createdAt,
      createdAt: req.createdAt,
      otherUser: req.sender,
      latestMessage: null,
      unreadCount: 1, // Show as unread
    }));

    // Combine all conversations
    const allConversations = [
      ...customerConversations,
      ...providerConversations,
      ...generalConvList,
      ...friendRequestConversations,
    ];

    // Deduplicate conversations by creating a unique key for each
    // Use type + id combination to ensure uniqueness
    const seen = new Map<string, typeof allConversations[0]>();
    
    for (const conv of allConversations) {
      // Create a unique key: type + id (or requestId for friend requests)
      const uniqueKey = conv.type === "friend_request" 
        ? `${conv.type}-${conv.requestId}`
        : `${conv.type}-${conv.id}`;
      
      // If we haven't seen this conversation before, or if this one is more recent, keep it
      if (!seen.has(uniqueKey)) {
        seen.set(uniqueKey, conv);
      } else {
        const existing = seen.get(uniqueKey)!;
        // Keep the one with the most recent update
        if (new Date(conv.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
          seen.set(uniqueKey, conv);
        }
      }
    }

    // Convert map values back to array and sort by updatedAt
    const deduplicatedConversations = Array.from(seen.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({
      conversations: deduplicatedConversations,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
