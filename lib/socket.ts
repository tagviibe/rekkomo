import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function initializeSocket(server: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join inquiry room
    socket.on("join_inquiry", (inquiryId: string) => {
      socket.join(`inquiry:${inquiryId}`);
      console.log(`Socket ${socket.id} joined inquiry:${inquiryId}`);
    });

    // Leave inquiry room
    socket.on("leave_inquiry", (inquiryId: string) => {
      socket.leave(`inquiry:${inquiryId}`);
      console.log(`Socket ${socket.id} left inquiry:${inquiryId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToInquiry(inquiryId: string, event: string, data: any) {
  if (io) {
    io.to(`inquiry:${inquiryId}`).emit(event, data);
  }
}
