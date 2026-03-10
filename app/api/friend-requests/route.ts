import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Get all friend requests (sent and received)
export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pending requests received (incoming)
    const incomingRequests = await prisma.friendRequest.findMany({
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

    // Get pending requests sent (outgoing)
    const outgoingRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: session.user.id,
        status: "PENDING",
      },
      include: {
        receiver: {
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

    // Get accepted friend requests (friends list)
    const acceptedRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            status: "ACCEPTED",
          },
          {
            receiverId: session.user.id,
            status: "ACCEPTED",
          },
        ],
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
        receiver: {
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
        updatedAt: "desc",
      },
    });

    // Transform accepted requests to get the other user
    const friends = acceptedRequests.map((req) => {
      const otherUser =
        req.senderId === session.user.id ? req.receiver : req.sender;
      return {
        id: req.id,
        friendId: otherUser.id,
        friend: otherUser,
        acceptedAt: req.updatedAt,
      };
    });

    return NextResponse.json({
      incoming: incomingRequests.map((req) => ({
        id: req.id,
        sender: req.sender,
        createdAt: req.createdAt,
      })),
      outgoing: outgoingRequests.map((req) => ({
        id: req.id,
        receiver: req.receiver,
        createdAt: req.createdAt,
      })),
      friends,
    });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch friend requests" },
      { status: 500 }
    );
  }
}
