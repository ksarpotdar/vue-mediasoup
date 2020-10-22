const https = require("https");
const { WebSocketServer } = require("protoo-server");
const mediasoup = require("mediasoup");
const ConfRoom = require("./lib/Room");
fs = require("fs");

(async () => {
  const worker = await mediasoup.createWorker({
    rtcMinPort: 3000,
    rtcMaxPort: 49999,
  });

  worker.on("died", () => {
    console.log("mediasoup Worker died, exit..");
    process.exit(1);
  });

  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: "audio",
        name: "opus",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: "video",
        name: "VP8",
        mimeType: "video/VP8",
        clockRate: 90000,
      },
    ],
  });

  const room = new ConfRoom(router);

  let key = "./certs/privkey.pem";
  let certificate = "./certs/fullchain.pem";

  const options = {
    rejectUnauthorized: false,
    key: fs.readFileSync(key),
    cert: fs.readFileSync(certificate),
  };

  const httpsServer = https.createServer(options);
  await new Promise((resolve) => {
    httpsServer.listen(8085, "178.128.48.181", resolve);
    console.log(httpsServer);
  });

  const wsServer = new WebSocketServer(httpsServer);
  wsServer.on("connectionrequest", (info, accept) => {
    console.log(
      "protoo connection request [peerId:%s, address:%s, origin:%s]",
      info.socket.remoteAddress,
      info.origin
    );

    room.handlePeerConnect({
      // to be more and more strict
      peerId: `p${String(Math.random()).slice(2)}`,
      protooWebSocketTransport: accept(),
    });
  });

  console.log("websocket server started on https://178.128.48.181:8085");
  setInterval(() => console.log("room stat", room.getStatus()), 1000 * 5);
})();
