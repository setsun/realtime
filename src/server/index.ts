import cors from "cors";
import express, { Application } from "express";
import { createServer, Server as HTTPServer } from "http";
import SocketIO, { Server as SocketIOServer, Socket } from "socket.io";
import { SignalingEvents } from "../constants";

export class SignalingServer {
  port: number;
  app: Application;
  httpServer: HTTPServer;
  socketServer: SocketIOServer;
  activeSockets: Map<String, Socket>;

  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.app.use(cors());
    this.httpServer = createServer(this.app);
    this.socketServer = SocketIO(this.httpServer);
    this.activeSockets = new Map();

    this.handleRoutes();
    this.handleSockets();
  }

  handleRoutes() {
    this.app.get("/", (req, res) => {
      res.send(`Status Code: ${req.statusCode}`);
    });
  }

  handleSockets() {
    this.socketServer.on("connection", (socket) => {
      console.log("Connect", { socket: socket.id });

      if (this.activeSockets.has(socket.id)) {
        return;
      }

      // add user to current active sockets
      this.activeSockets.set(socket.id, socket);

      const activeSocketIds = [...this.activeSockets.keys()];

      console.log({ activeSocketIds })

      // emit active users to current client
      socket.emit(SignalingEvents.Initialize, {
        me: socket.id,
        users: activeSocketIds,
      });

      // emit new user connection to all other clients
      socket.broadcast.emit(SignalingEvents.UserConnected, {
        user: socket.id,
      });

      socket.on("disconnect", () => {
        console.log("Disconnect", { socket: socket.id });

        this.activeSockets.delete(socket.id);

        socket.broadcast.emit(SignalingEvents.UserDisconnected, {
          user: socket.id
        });
      });

      // establish the intial RTC offer
      socket.on(SignalingEvents.SendOffer, ({ to, offer }: any) => {
        console.log(SignalingEvents.SendOffer, { to, offer });

        socket.to(to).emit(SignalingEvents.ReceiveOffer, {
          offer,
          from: socket.id,
        });
      });

      // confirm the RTC answer and connect the two clients
      socket.on(SignalingEvents.SendAnswer, ({ to, answer }: any) => {
        console.log(SignalingEvents.SendAnswer, { to, answer });

        socket.to(to).emit(SignalingEvents.ReceiveAnswer, {
          answer,
          from: socket.id,
        });
      });

      socket.on(SignalingEvents.SendCandidate, ({ to, candidate }: any) => {
        console.log(SignalingEvents.SendCandidate, { to, candidate });

        socket.to(to).emit(SignalingEvents.ReceiveCandidate, {
          candidate,
          from: socket.id
        });
      });
    });
  }

  listen(callback) {
    this.httpServer.listen(this.port, () => {
      callback(this.port);
    });
  }
}
