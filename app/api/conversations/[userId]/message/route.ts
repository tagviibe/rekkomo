import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Find conversation
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
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Emit socket event for real-time updates
    const io = (global as any).io;
    if (io) {
      const messageData = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: message.sender,
        createdAt: message.createdAt.toISOString(),
      };

      // Emit to conversation room
      io.to(`conversation:${conversation.id}`).emit("new_message", messageData);
      console.log(`Emitted new_message to conversation:${conversation.id}`, messageData);
      
      // Emit global event for conversation list updates
      io.emit("conversation_updated", {
        conversationId: conversation.id,
        user1Id: conversation.user1Id,
        user2Id: conversation.user2Id,
      });
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: message.sender,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
