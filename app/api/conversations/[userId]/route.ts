import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Create or get conversation with a connected user
export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (params.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot start conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if users are friends (accepted friend request)
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: params.userId,
            status: "ACCEPTED",
          },
          {
            senderId: params.userId,
            receiverId: session.user.id,
            status: "ACCEPTED",
          },
        ],
      },
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: "You can only message users who have accepted your friend request" },
        { status: 403 }
      );
    }

    // Get or create conversation
    // Check both directions (user1-user2 and user2-user1)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            user1Id: session.user.id,
            user2Id: params.userId,
          },
          {
            user1Id: params.userId,
            user2Id: session.user.id,
          },
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
                nativePlaceState: true,
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
                nativePlaceState: true,
              },
            },
          },
        },
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

    // Create conversation if it doesn't exist
    if (!conversation) {
      // Ensure user1Id is always the smaller of the two for unique constraint
      const [user1Id, user2Id] =
        session.user.id < params.userId
          ? [session.user.id, params.userId]
          : [params.userId, session.user.id];

      conversation = await prisma.conversation.create({
        data: {
          user1Id,
          user2Id,
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
    }

    // Determine the other user
    const otherUser =
      conversation.user1Id === session.user.id
        ? conversation.user2
        : conversation.user1;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          sender: m.sender,
          createdAt: m.createdAt,
        })),
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

// Get conversation with a user
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if users are friends (accepted friend request)
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: params.userId,
            status: "ACCEPTED",
          },
          {
            senderId: params.userId,
            receiverId: session.user.id,
            status: "ACCEPTED",
          },
        ],
      },
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: "You can only message users who have accepted your friend request" },
        { status: 403 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            user1Id: session.user.id,
            user2Id: params.userId,
          },
          {
            user1Id: params.userId,
            user2Id: session.user.id,
          },
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
                nativePlaceState: true,
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
                nativePlaceState: true,
              },
            },
          },
        },
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

    if (!conversation) {
      return NextResponse.json({ conversation: null });
    }

    // Determine the other user
    const otherUser =
      conversation.user1Id === session.user.id
        ? conversation.user2
        : conversation.user1;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          sender: m.sender,
          createdAt: m.createdAt,
        })),
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
