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

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: params.userId },
      include: {
        user: {
          select: {
            id: true,
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

    // Get or create inquiry
    let inquiry = await prisma.serviceInquiry.findUnique({
      where: {
        providerId_customerId: {
          providerId: provider.id,
          customerId: session.user.id,
        },
      },
      include: {
        messages: {
          where: {
            isSystem: false,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "Service inquiry not found. Please send an inquiry first." },
        { status: 404 }
      );
    }

    // Check if conversation can start
    // For customer: provider must have sent at least one message
    // For provider: customer must have sent at least one message (the initial inquiry)
    const realMessages = inquiry.messages || [];
    const customerMessages = realMessages.filter((m) => m.senderId === inquiry.customerId);
    const providerMessages = realMessages.filter((m) => m.senderId !== inquiry.customerId);

    const isCustomer = session.user.id === inquiry.customerId;
    const isProvider = provider.userId === session.user.id;

    if (isCustomer && providerMessages.length === 0) {
      return NextResponse.json(
        { error: "Please wait for the service provider to respond to your inquiry." },
        { status: 403 }
      );
    }

    if (isProvider && customerMessages.length === 0) {
      return NextResponse.json(
        { error: "Customer must send an inquiry first." },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.serviceMessage.create({
      data: {
        inquiryId: inquiry.id,
        senderId: session.user.id,
        content: content.trim(),
        isSystem: false,
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

    // Check if phone should be revealed (after 2+ real messages)
    const allMessages = await prisma.serviceMessage.findMany({
      where: {
        inquiryId: inquiry.id,
        isSystem: false,
      },
    });

    let phoneRevealed = inquiry.phoneRevealed;
    if (allMessages.length >= 2 && !inquiry.phoneRevealed) {
      await prisma.serviceInquiry.update({
        where: { id: inquiry.id },
        data: { phoneRevealed: true },
      });
      phoneRevealed = true;
    }

    // Check for agreement keywords and update status
    const agreementKeywords = [
      "theek",
      "ok",
      "agreed",
      "confirm",
      "sahi",
      "haan",
      "yes",
      "done",
    ];
    const contentLower = content.toLowerCase();
    const hasAgreement = agreementKeywords.some((keyword) =>
      contentLower.includes(keyword)
    );

    let updatedStatus = inquiry.status;
    if (hasAgreement && inquiry.status === "NEW") {
      await prisma.serviceInquiry.update({
        where: { id: inquiry.id },
        data: { status: "AGREED" },
      });
      updatedStatus = "AGREED";
    }

    // Emit socket event for real-time updates
    const io = (global as any).io;
    if (io) {
      const messageData = {
        id: message.id,
        content: message.content,
        isSystem: message.isSystem,
        senderId: message.senderId,
        sender: message.sender,
        createdAt: message.createdAt.toISOString(),
      };

      // Emit to all clients in the inquiry room
      io.to(`inquiry:${inquiry.id}`).emit("new_message", messageData);
      console.log(`Emitted new_message to inquiry:${inquiry.id}`, messageData);
      
      // Emit global event for conversation list updates (for messages page)
      io.emit("conversation_updated", {
        inquiryId: inquiry.id,
        customerId: inquiry.customerId,
        providerId: inquiry.providerId,
      });
      
      if (phoneRevealed && !inquiry.phoneRevealed) {
        io.to(`inquiry:${inquiry.id}`).emit("phone_revealed", {
          inquiryId: inquiry.id,
          phoneRevealed: true,
        });
        console.log(`Emitted phone_revealed to inquiry:${inquiry.id}`);
      }

      if (hasAgreement && inquiry.status === "NEW") {
        io.to(`inquiry:${inquiry.id}`).emit("inquiry_status_changed", {
          inquiryId: inquiry.id,
          status: "AGREED",
        });
        console.log(`Emitted inquiry_status_changed to inquiry:${inquiry.id}`);
      }
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        isSystem: message.isSystem,
        senderId: message.senderId,
        sender: message.sender,
        createdAt: message.createdAt.toISOString(),
      },
      phoneRevealed: phoneRevealed,
      status: updatedStatus,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
