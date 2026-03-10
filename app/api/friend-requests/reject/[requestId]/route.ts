import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Reject friend request
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
        { error: "Unauthorized to reject this request" },
        { status: 403 }
      );
    }

    // Update friend request status
    await prisma.friendRequest.update({
      where: { id: params.requestId },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    return NextResponse.json(
      { error: "Failed to reject friend request" },
      { status: 500 }
    );
  }
}
