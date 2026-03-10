import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Accept friend request
export async function POST(
  req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: params.requestId },
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
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    // Check if current user is the receiver
    if (friendRequest.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to accept this request" },
        { status: 403 }
      );
    }

    // Check if already accepted
    if (friendRequest.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "Friend request already accepted" },
        { status: 400 }
      );
    }

    // Update friend request status
    const updatedRequest = await prisma.friendRequest.update({
      where: { id: params.requestId },
      data: { status: "ACCEPTED" },
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
        id: updatedRequest.id,
        status: updatedRequest.status,
        sender: updatedRequest.sender,
        receiver: updatedRequest.receiver,
        updatedAt: updatedRequest.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return NextResponse.json(
      { error: "Failed to accept friend request" },
      { status: 500 }
    );
  }
}
