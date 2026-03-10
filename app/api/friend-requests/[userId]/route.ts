import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Send friend request
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
        { error: "Cannot send friend request to yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if friend request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: params.userId,
          },
          {
            senderId: params.userId,
            receiverId: session.user.id,
          },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "Friend request already pending" },
          { status: 400 }
        );
      }
      if (existingRequest.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "Already friends" },
          { status: 400 }
        );
      }
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: session.user.id,
        receiverId: params.userId,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      friendRequest: {
        id: friendRequest.id,
        status: friendRequest.status,
        sender: friendRequest.sender,
        receiver: friendRequest.receiver,
        createdAt: friendRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 }
    );
  }
}

// Get friend request status
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ status: null });
    }

    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: params.userId,
          },
          {
            senderId: params.userId,
            receiverId: session.user.id,
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!friendRequest) {
      return NextResponse.json({ status: null });
    }

    return NextResponse.json({
      status: friendRequest.status,
      isSender: friendRequest.senderId === session.user.id,
      friendRequest: {
        id: friendRequest.id,
        sender: friendRequest.sender,
        receiver: friendRequest.receiver,
        createdAt: friendRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching friend request status:", error);
    return NextResponse.json(
      { error: "Failed to fetch friend request status" },
      { status: 500 }
    );
  }
}
