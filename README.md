# realtime

> 🚧 Documentation & stable implementation in progress 🚧

A signaling server & web client for WebRTC.

The goal of this library is to absorb some of the complexity of WebRTC, and handle negotiating the connection between two peers. It handles this through some of the following:

- Exchanging [`RTCPeerConnection` offers](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer) between peers.
- Exchanging [`RTCPeerConnection` answers](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer) between peers.
- Exchanging [ICE candidates](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addIceCandidate) between peers.
- Creating [data channels](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel) to send arbitrary JSON data through the peer connection.

## API

### SignalingEvents
Signaling events are the set of events that `realtime` uses internally for connecting two peers via WebRTC.

```tsx
enum SignalingEvents {
  Initialize = "Initialize",
  UserConnected = "UserConnected",
  UserDisconnected = "UserDisconnected",
  SendCandidate = "SendCandidate",
  ReceiveCandidate = "ReceiveCandidate",
  SendOffer = "SendOffer",
  ReceiveOffer = "ReceiveOffer",
  SendAnswer = "SendAnswer",
  ReceiveAnswer = "ReceiveAnswer",
}
```

### SignalingServer
The signaling server is responsible for negotiating a `RTCPeerConnection` between 2 clients. Once the peer connection is established, all data is sent between the two clients without the need of the intermediate server.

### RTCClient
The RTC client is meant to be used in the browser, and initiates a connection request through the included signaling server to another peer. Once the connection is established, the two peers are able to send data directly to each other.
