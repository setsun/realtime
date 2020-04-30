import { Server as HTTPServer, IncomingMessage } from "http";
import WebSocket, { Server as WebSocketServer } from "ws";
import { SignalingEvents } from "../constants";

type SignalingServerConfig = {
  server: HTTPServer;
}

type BroadcastArgs = {
  currentSocket: WebSocket;
  eventName: string;
  data: Object;
}

export class SignalingServer {
  #activeSockets: Map<String, WebSocket> = new Map();
  #socketServer: WebSocketServer;

  constructor({ server }: SignalingServerConfig) {
    this.#socketServer = new WebSocketServer({ server });
    this.setupSockets();
  }

  getSocketKey(request: IncomingMessage) {
    const keys = request.headers['sec-websocket-key'];
    return Array.isArray(keys) ? keys.join('') : keys;
  }

  broadcast({ currentSocket, eventName, data }: BroadcastArgs) {
    this.#socketServer.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;
      if (client === currentSocket) return;

      client.emit(eventName, () => {
        return data;
      });
    });
  }

  setupSockets() {
    const socketServer = this.#socketServer;
    const activeSockets = this.#activeSockets;

    socketServer.on("connection", (socket, request) => {
      const socketKey = this.getSocketKey(request);

      console.log("Connect", { socketKey });

      if (activeSockets.has(socketKey)) {
        return;
      }

      // add user to current active sockets
      activeSockets.set(socketKey, socket);

      const activeSocketIds = [...activeSockets.keys()];

      console.log({ activeSocketIds })

      // emit current socket key, and active users to current client
      socket.emit(SignalingEvents.Initialize, {
        me: socketKey,
        users: activeSocketIds,
      });

      // broadcast new user connection to all other clients
      this.broadcast({
        currentSocket: socket,
        eventName: SignalingEvents.UserConnected,
        data: {
          user: socketKey
        }
      });

      socket.on("disconnect", () => {
        console.log("Disconnect", { socketKey });

        activeSockets.delete(socketKey);

        // broadcast user disconnection to all other clients
        this.broadcast({
          currentSocket: socket,
          eventName: SignalingEvents.UserDisconnected,
          data: {
            user: socketKey
          }
        });
      });

      // establish the intial RTC offer
      socket.on(SignalingEvents.SendOffer, ({ to, offer }: any) => {
        console.log(SignalingEvents.SendOffer, { to, offer });

        activeSockets.get(to).emit(SignalingEvents.ReceiveOffer, {
          offer,
          from: socketKey,
        });
      });

      // confirm the RTC answer and connect the two clients
      socket.on(SignalingEvents.SendAnswer, ({ to, answer }: any) => {
        console.log(SignalingEvents.SendAnswer, { to, answer });

        activeSockets.get(to).emit(SignalingEvents.ReceiveAnswer, {
          answer,
          from: socketKey,
        });
      });

      socket.on(SignalingEvents.SendCandidate, ({ to, candidate }: any) => {
        console.log(SignalingEvents.SendCandidate, { to, candidate });

        activeSockets.get(to).emit(SignalingEvents.ReceiveCandidate, {
          candidate,
          from: socketKey
        });
      });
    });
  }
}