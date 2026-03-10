const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // Store io instance globally for use in API routes
  global.io = io;

  io.on("connection", (socket) => {
    console.log("✅ Socket.io client connected:", socket.id);
    console.log("   Transport:", socket.conn.transport.name);

    // Join inquiry room
    socket.on("join_inquiry", (inquiryId) => {
      socket.join(`inquiry:${inquiryId}`);
      console.log(`📥 Socket ${socket.id} joined inquiry:${inquiryId}`);
    });

    // Leave inquiry room
    socket.on("leave_inquiry", (inquiryId) => {
      socket.leave(`inquiry:${inquiryId}`);
      console.log(`📤 Socket ${socket.id} left inquiry:${inquiryId}`);
    });

    // Join conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`📥 Socket ${socket.id} joined conversation:${conversationId}`);
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`📤 Socket ${socket.id} left conversation:${conversationId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", socket.id, "Reason:", reason);
    });

    socket.on("error", (error) => {
      console.error("⚠️ Socket error:", socket.id, error);
    });
  });

  io.engine.on("connection_error", (err) => {
    console.error("⚠️ Socket.io engine connection error:", err);
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
