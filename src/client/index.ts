import { io, Socket } from "socket.io-client";

import {
  SignalingEvents,
  InitializePayload,
  UserConnectedPayload,
  UserDisconnectedPayload,
  ReceiveOfferPayload,
  ReceiveAnswerPayload,
  ReceiveCandidatePayload
} from "../types";

type RTCClientConfig = {
  url: string;
  iceServers?: RTCConfiguration['iceServers']
}

const defaultIceServers = [
  { urls: 'stun:stun.services.mozilla.com' },
  { urls: 'stun:stun.l.google.com:19302' },
];

export class RTCClient {
  #me = '';
  #socket: Socket;
  #users = new Set<string>();
  #connections = new Map<string, RTCPeerConnection>();
  #channels = new Map<string, RTCDataChannel>();
  #iceServers: RTCConfiguration['iceServers'];

  constructor({ url, iceServers }: RTCClientConfig) {
    this.#socket = io(url);
    this.#iceServers = iceServers ?? defaultIceServers;
  }

  getKey = (remoteId: string) => `${this.#me}-${remoteId}`;

  setConnection = (remoteId: string, localConnection: RTCPeerConnection) =>
    this.#connections.set(this.getKey(remoteId), localConnection);

  getConnection = (remoteId: string) =>
    this.#connections.get(this.getKey(remoteId));

  getChannels = () => this.#channels

  getChannel = (remoteId: string) =>
    this.#channels.get(this.getKey(remoteId));

  setChannel = (remoteId: string, localChannel: RTCDataChannel) =>
    this.#channels.set(this.getKey(remoteId), localChannel);

  createLocalPeerConnection = async (remoteId: string) => {
    const iceServers = this.#iceServers;
    const localConnection = new RTCPeerConnection({ iceServers });

    localConnection.onicecandidate = ({ candidate }) => {
      if (!candidate) return;

      this.#socket.emit(SignalingEvents.SendCandidate, {
        candidate,
        to: remoteId
      });
    };

    const localChannel = localConnection.createDataChannel('game-data', {
      negotiated: true,
      id: 1,
    });

    // store the RTCPeerConnection. and RTCDataChannel for later access
    this.setConnection(remoteId, localConnection);
    this.setChannel(remoteId, localChannel);

    return localConnection;
  }

  sendOffer = async (remoteId) => {
    const localConnection = await this.createLocalPeerConnection(remoteId);

    const offer = await localConnection.createOffer();
    await localConnection.setLocalDescription(offer);

    this.#socket.emit(SignalingEvents.SendOffer, {
      offer: localConnection.localDescription,
      to: remoteId
    });
  }

  updateAllChannels = (data: Object) => {
    for (let [_, channel] of this.#channels) {
      channel.send(JSON.stringify(data));
    }
  }

  initialize = (onSignal) => {
    const socket = this.#socket;

    socket.on(SignalingEvents.Initialize, ({ users, me }: InitializePayload) => {
      this.#users = new Set(users);
      this.#me = me;
      onSignal(this);
    });

    socket.on(SignalingEvents.UserConnected, ({ user }: UserConnectedPayload) => {
      this.#users.add(user);
      onSignal(this);
    });

    socket.on(SignalingEvents.UserDisconnected, ({ user }: UserDisconnectedPayload) => {
      this.#users.delete(user);
      onSignal(this);
    });

    socket.on(SignalingEvents.ReceiveOffer, async ({ offer, from }: ReceiveOfferPayload) => {
      const localConnection = await this.createLocalPeerConnection(from);

      await localConnection.setRemoteDescription(offer);
      const answer = await localConnection.createAnswer();
      await localConnection.setLocalDescription(answer);

      socket.emit(SignalingEvents.SendAnswer, {
        answer: localConnection.localDescription,
        to: from,
      });

      onSignal(this);
    });

    socket.on(SignalingEvents.ReceiveAnswer, async ({ answer, from }: ReceiveAnswerPayload) => {
      const localConnection = this.getConnection(from);
      await localConnection.setRemoteDescription(answer);
      onSignal(this);
    });

    socket.on(SignalingEvents.ReceiveCandidate, async ({ candidate, from }: ReceiveCandidatePayload) => {
      const localConnection = this.getConnection(from);
      await localConnection.addIceCandidate(candidate);
      onSignal(this);
    });
  }

  close = () => {
    this.#socket.close();
  }
}
