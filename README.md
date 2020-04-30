# realtime

> 🚧 Documentation & stable implementation in progress 🚧

A signaling server & web client for WebRTC.

The goal of this library is to absorb some of the complexity of WebRTC, and handle negotiating the connection between two peers, allowing the direct transfer of any arbitrary data between the two peers. This may be well-suited for video chat, game data updates, or other applications that require real-time performance.

It handles this through some of the following:

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

#### Example
```tsx
import { SignalingServer } from "@raycaster/realtime";
import { createServer } from "http";

// attach the signaling server to the top-level http server
const httpServer = createServer();
const signalingServer = new SignalingServer({ server: httpServer });

httpServer.listen(3000);
```

### RTCClient
The RTC client is meant to be used in the browser, and initiates a connection request through the included signaling server to another peer. Once the connection is established, the two peers are able to send data directly to each other.

#### Example
```tsx
import { RTCClient } from "@raycaster/realtime";

const client = new RTCClient({ url: 'ws://localhost:3000' });
```