import { Server as HTTPServer } from "http";
import SocketIO, { Server as SocketIOServer, Socket } from "socket.io";
import {
  SignalingEvents,
  SendOfferPayload,
  SendAnswerPayload,
  SendCandidatePayload
} from "../types";

type SignalingServerConfig = {
  server: HTTPServer;
}

export class SignalingServer {
  #activeSockets: Map<String, Socket> = new Map();
  #socketServer: SocketIOServer;

  constructor({ server }: SignalingServerConfig) {
    this.#socketServer = SocketIO(server);
    this.setupSockets();
  }

  setupSockets() {
    const socketServer = this.#socketServer;
    const activeSockets = this.#activeSockets;

    socketServer.on("connection", (socket) => {
      const socketId = socket.id;

      console.log("Connect", { socketId });

      if (activeSockets.has(socketId)) {
        return;
      }

      // add user to current active sockets
      activeSockets.set(socketId, socket);

      const activeSocketIds = [...activeSockets.keys()];

      console.log({ activeSocketIds })

      // emit current socket key, and active users to current client
      socket.emit(SignalingEvents.Initialize, {
        me: socketId,
        users: activeSocketIds,
      });

      // broadcast new user connection to all other clients
      socket.broadcast.emit(SignalingEvents.UserConnected, {
        user: socketId,
      });

      socket.on("disconnect", () => {
        console.log("Disconnect", { socketId });

        activeSockets.delete(socketId);

        // broadcast user disconnection to all other clients
        socket.broadcast.emit(SignalingEvents.UserDisconnected, {
          user: socket.id
        });
      });

      // establish the intial RTC offer
      socket.on(SignalingEvents.SendOffer, ({ to, offer }: SendOfferPayload) => {
        console.log(SignalingEvents.SendOffer, { to, offer });

        socket.to(to).emit(SignalingEvents.ReceiveOffer, {
          offer,
          from: socketId,
        });
      });

      // confirm the RTC answer and connect the two clients
      socket.on(SignalingEvents.SendAnswer, ({ to, answer }: SendAnswerPayload) => {
        console.log(SignalingEvents.SendAnswer, { to, answer });

        socket.to(to).emit(SignalingEvents.ReceiveAnswer, {
          answer,
          from: socketId,
        });
      });

      socket.on(SignalingEvents.SendCandidate, ({ to, candidate }: SendCandidatePayload) => {
        console.log(SignalingEvents.SendCandidate, { to, candidate });

        socket.to(to).emit(SignalingEvents.ReceiveCandidate, {
          candidate,
          from: socketId
        });
      });
    });
  }
}