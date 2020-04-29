import { Server as HTTPServer } from "http";
import SocketIO, { Socket } from "socket.io";
import { SignalingEvents } from "../constants";

export function createSignalingServer(httpServer: HTTPServer): HTTPServer {
  const activeSockets: Map<String, Socket> = new Map();
  const socketServer = SocketIO(httpServer);

  socketServer.on("connection", (socket) => {
    console.log("Connect", { socket: socket.id });

    if (activeSockets.has(socket.id)) {
      return;
    }

    // add user to current active sockets
    activeSockets.set(socket.id, socket);

    const activeSocketIds = [...activeSockets.keys()];

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

      activeSockets.delete(socket.id);

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

  return httpServer;
}