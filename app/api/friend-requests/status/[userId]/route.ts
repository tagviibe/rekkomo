import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Get friend request status and details
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
      return NextResponse.json({ status: null, friendRequest: null });
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
