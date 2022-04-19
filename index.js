import { createServer } from "http";

import express from "express";
import { WebcastPushConnection } from "tiktok-livestream-chat-connector";
import { Server } from "socket.io";
import amqp from "amqplib/callback_api";

const RABBIT_MQ_CONN_URL =
  "amqps://zlnypzcv:V_7jHO6wUYZrW5YAp-LBgAon7AAJTDDB@rattlesnake.rmq.cloudamqp.com/zlnypzcv";
const RQBBIT_MQ_QUEUE = "tiktok_live_DEV";

// Create express / socket server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// Publish to queue
const publishToQueue = async ({ channel, queueName, data, type }) => {
  if (!channel) {
    console.error("Failed to publish to queue due to missing channel");
  }

  const payload = JSON.stringify({ ...data, type });
  if (channel) {
    // Disable for testing to avoid hitting limit
    // channel.sendToQueue(queueName, Buffer.from(payload), {
    //   persistent: true,
    // });
  }
};

const processMessage = (channel, socket, msg) => {
  const payload = {
    mqMsg: msg,
    data: JSON.parse(msg.content.toString()),
  };
  if (channel) {
    console.log("check queue");
    const queue = channel.checkQueue(RQBBIT_MQ_QUEUE);
    channel.checkQueue(RQBBIT_MQ_QUEUE, function (err, queue) {
      if (err != null) {
        console.error(err);
        return;
      }
      socket.emit("waitingList", queue.messageCount);
    });
  }
  socket.emit("tiktokEvent", payload);
};

let globalConnectionCount = 0;

setInterval(() => {
  io.emit("statistic", { globalConnectionCount });
});

// Set up events on established socket connection
io.on("connection", (socket) => {
  let chatConnection;
  let mqChannel = null;

  function disconnectChat() {
    if (chatConnection) {
      console.error("Tiktok chat disconnected");
      chatConnection.disconnect();
      chatConnection = null;
    }
  }

  function closeMQChannel() {
    console.error("RabbitMQ channel closed");
    if (mqChannel) {
      mqChannel.close();
    }
  }

  // Client requests to join a room
  socket.on("setUniqueId", (uniqueId, options) => {
    console.log("connecting", uniqueId, options);

    // Connect to Tiktok Webcast push service
    let thisConnection = new WebcastPushConnection(uniqueId, options);

    thisConnection
      .connect()
      .then((state) => {
        disconnectChat();
        chatConnection = thisConnection;

        // Abort if socket connection lost
        if (!socket.connected) {
          disconnectChat();
          return;
        }

        // Establish RabbitMQ connection
        amqp.connect(RABBIT_MQ_CONN_URL, function (err, conn) {
          // Abort if failed to establish mq connection
          if (err != null) {
            console.error(err);
            disconnectChat();
          }
          conn.createChannel(function (err, channel) {
            // Abort if failed to create published channel
            if (err != null) {
              console.error(err);
              disconnectChat();
            }
            mqChannel = channel;
            mqChannel.prefetch(1);

            // Start consuming
            mqChannel.consume(
              RQBBIT_MQ_QUEUE,
              function (msg) {
                if (msg !== null) {
                  processMessage(channel, socket, msg);
                }
              },
              { noAck: false }
            );
          });
        });

        // Inform client chat has been established
        socket.emit("setUniqueIdSuccess", state);
      })
      .catch((err) => {
        socket.emit("setUniqueIdFailed", err.toString());
      });

    // Get a list of all available gifts, including gift name, image url, diamond cost, etc.
    thisConnection
      .getAvailableGifts()
      .then((giftList) => {
        socket.emit("getAvailableGifts", giftList);
      })
      .catch((err) => {
        console.error(err);
      });

    // Tiktok events
    thisConnection.on("roomUser", async (msg) => {
      // Viewer count
      socket.emit("roomUser", msg);
    });
    thisConnection.on("member", async (msg) => {}); // When someone joins
    thisConnection.on("chat", async (msg) => {});
    thisConnection.on("gift", async (msg) => {
      await publishToQueue({
        channel: mqChannel,
        queueName: RQBBIT_MQ_QUEUE,
        data: msg,
        type: "gift",
      });
    });
    thisConnection.on("social", async (msg) => {
      await publishToQueue({
        channel: mqChannel,
        queueName: RQBBIT_MQ_QUEUE,
        data: msg,
        type: "social",
      });
    });
    thisConnection.on("like", async (msg) => {
      await publishToQueue({
        channel: mqChannel,
        queueName: RQBBIT_MQ_QUEUE,
        data: msg,
        type: "like",
      });
    });
    thisConnection.on("streamEnd", async (msg) => {
      socket.emit("streamEnd", msg);
    });

    thisConnection.on("connected", () => {
      console.log("chatConnection connected");
      globalConnectionCount += 1;
    });

    thisConnection.on("disconnected", () => {
      // You can add some reconnect logic here.
      // Should wait a little bit before attempting to avoid being rate-limited.
      // https://github.com/zerodytrash/TikTok-Live-Connector#disconnected
      console.log("chatConnection disconnected");
      globalConnectionCount -= 1;
    });

    thisConnection.on("error", (err) => {
      console.error(err);
      socket.emit("setUniqueIdFailed", err.toString());
    });
  });

  // Acknowledge message when client ready
  socket.on("messageProcessed", (msg) => {
    if (mqChannel) {
      mqChannel.ack(msg);
    }
  });

  socket.on("disconnect", () => {
    disconnectChat();
    closeMQChannel();
    console.log("client disconnected");
  });

  console.log("client connected");
});

// Server frontend files
app.use(express.static("public"));

httpServer.listen(process.env.PORT || 3001);

process.on("exit", (code) => {});
