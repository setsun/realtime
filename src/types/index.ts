export enum SignalingEvents {
  Initialize = "Initialize",
  UserConnected = "UserConnected",
  UserDisconnected = "UserDisconnected",
  SendOffer = "SendOffer",
  ReceiveOffer = "ReceiveOffer",
  SendAnswer = "SendAnswer",
  ReceiveAnswer = "ReceiveAnswer",
  SendCandidate = "SendCandidate",
  ReceiveCandidate = "ReceiveCandidate",
}

export type InitializePayload = {
  me: string;
  users: string[];
}

export type UserConnectedPayload = {
  user: string;
}

export type UserDisconnectedPayload = {
  user: string;
}

export type SendOfferPayload = {
  to: string;
  offer: RTCSessionDescription;
}

export type ReceiveOfferPayload = {
  from: string;
  offer: RTCSessionDescription;
}

export type SendAnswerPayload = {
  to: string;
  answer: RTCSessionDescription;
}

export type ReceiveAnswerPayload = {
  from: string;
  answer: RTCSessionDescription;
}

export type SendCandidatePayload = {
  to: string;
  candidate: RTCIceCandidate;
}

export type ReceiveCandidatePayload = {
  from: string;
  candidate: RTCIceCandidate;
}