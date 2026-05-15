import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { Room } from "./src/server/Room.js";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    }
  });

  const rooms = new Map<string, Room>();

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("join_room", ({ roomId, name, playerId, isSpectator }: { roomId: string, name: string, playerId?: string, isSpectator?: boolean }) => {
      let room = rooms.get(roomId);
      if (!room) {
        room = new Room(roomId);
        rooms.set(roomId, room);
      }

      try {
        const id = room.addPlayer(socket, name, playerId, isSpectator);
        socket.join(roomId);
        room.broadcastState(io);
        socket.emit("joined", { playerId: id });
        console.log(`Player ${name} (${id}) joined room ${roomId} (Spectator: ${isSpectator})`);
      } catch (err: any) {
        socket.emit("error_message", err.message);
      }
    });

    socket.on("ready", ({ roomId, playerId }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.handleReady(playerId, io);
      }
    });

    socket.on("add_bot", ({ roomId, difficulty, style }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.addBot(io, difficulty, style);
      }
    });

    socket.on("fill_bots", ({ roomId, difficulty, style }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.fillWithBots(io, difficulty, style);
        room.checkBotTurn(io);
      }
    });

    socket.on("set_trump", ({ roomId, playerId, suit }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.setTrump(playerId, suit);
        room.broadcastState(io);
        room.checkBotTurn(io);
      }
    });

    socket.on("play_card", async ({ roomId, playerId, cardId }) => {
      const room = rooms.get(roomId);
      if (room) {
        await room.playCard(playerId, cardId, io);
      }
    });

    socket.on("send_message", ({ roomId, playerId, text }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.addChatMessage(playerId, text);
        room.broadcastState(io);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
      rooms.forEach(room => {
        room.handleDisconnect(socket.id);
        room.broadcastState(io);
      });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
