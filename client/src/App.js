import { io } from "socket.io-client";

import React, { useEffect, useState, useRef } from "react";
import { animated, useTransition } from "@react-spring/web";

import "./App.css";
import Scene from "./three/Scene";
import { hostSpeak, hostPlayGesture } from "./three/Models";
import {
  ANIMATIONS_MAP,
  GRATITUDE_PHRASES,
  DEFAULT_MANUAL_SPEECH,
} from "./three/constants";
import { asyncTimeout, sanitizeText } from "./utils";

function App() {
  const [message, setMessage] = useState("");
  const transitions = useTransition(message, {
    from: { opacity: 0, x: -50 },
    enter: { opacity: 1, x: 0 },
    leave: { opacity: 0, x: -50 },
  });
  const [idInput, setIdInput] = useState("");
  const [stateText, setStateText] = useState("");
  const [connectedRoom, setConnectedRoom] = useState(false);
  const [viewerCount, setViewerCount] = useState(null);
  const [likeCount, setLikeCount] = useState(null);
  const [waitingList, setWaitingList] = useState(null);
  const [diamondsCount, setDiamondsCount] = useState(null);
  const ioConnectionRef = useRef(null);
  const [emoteValue, setEmoteValue] = useState("");
  const [manualSpeech, setManualSpeech] = useState(DEFAULT_MANUAL_SPEECH);
  const isManualSpeech = useRef(false);
  const isAutomaticSpeech = useRef(false);
  const [allGifts, setAllGifts] = useState(null);

  const connect = () => {
    if (idInput !== "") {
      ioConnectionRef.current.emit("setUniqueId", idInput, {
        enableExtendedGiftInfo: true,
      });
      setStateText("Connecting...");
    }
  };

  const processTiktokEvent = async (data, mqMsg) => {
    setMessage(data);

    if (data.type === "social" || data.type === "gift") {
      await hostSpeak(
        GRATITUDE_PHRASES[Math.floor(Math.random() * GRATITUDE_PHRASES.length)]
      );
      await asyncTimeout(1000);
      isAutomaticSpeech.current = false;
    } else {
      await asyncTimeout(2500);
    }

    setMessage("");
    setTimeout(() => {
      ioConnectionRef.current.emit("messageProcessed", mqMsg);
    }, 500);
  };

  // Play manual speech
  const onChangeManualSpeech = (event) => {
    setManualSpeech(event.target.value);
  };

  const playManualSpeech = async () => {
    if (isAutomaticSpeech.current) {
      return;
    }

    isManualSpeech.current = true;
    await hostSpeak(manualSpeech);
    isManualSpeech.current = false;
  };

  // Play emote on demand with emote button
  const onChangeEmoteValue = (event) => {
    setEmoteValue(event.target.value);
  };

  const handlePlayGesture = async () => {
    const getstureName = ANIMATIONS_MAP[emoteValue] || "Emote";
    await hostPlayGesture(getstureName, emoteValue);
  };

  useEffect(() => {
    const ioConnection = new io("http://localhost:3001");

    // On successful connection
    ioConnection.on("setUniqueIdSuccess", (state) => {
      // Reset stats
      setViewerCount(0);
      setLikeCount(0);
      setDiamondsCount(0);
      setStateText(`Connected to roomId ${state.roomId}`);
      setConnectedRoom(true);
    });

    // On failed connection
    ioConnection.on("setUniqueIdFailed", (errorMsg) => {
      setStateText(errorMsg);
    });

    // On stream ended
    ioConnection.on("streamEnd", () => {
      setStateText("Stream ended");
    });

    // Viewer stats
    ioConnection.on("roomUser", (msg) => {
      if (typeof msg.viewerCount === "number") {
        setViewerCount(msg.viewerCount);
      }
    });

    // Waiting list
    ioConnection.on("waitingList", (count) => {
      setWaitingList(count);
    });

    // Like stats
    ioConnection.on("like", (msg) => {
      if (typeof msg.likeCount === "number") {
      }

      if (typeof msg.totalLikeCount === "number") {
        setLikeCount(msg.totalLikeCount);
      }
    });

    function isPendingStreak(data) {
      return data.gift.gift_type === 1 && !data.gift.repeat_end;
    }

    // Process tiktok event
    ioConnection.on("tiktokEvent", (event) => {
      let text = "";
      const { data, mqMsg } = event;

      switch (data.type) {
        case "like":
          if (data.likeCount) {
            text = `sent ${data.likeCount} x ❤️ to Phendran`;
          }
          break;
        case "social":
          text = data.label.replace("{0:user}", "");
          isAutomaticSpeech.current = true;
          break;
        case "gift":
          console.log(event);
          // if (!isPendingStreak(data) && data.extendedGiftInfo.diamond_count > 0) {
          //   diamondsCount +=
          //     data.extendedGiftInfo.diamond_count * data.gift.repeat_count;
          // }
          text = data.extendedGiftInfo.describe;
          // diamond_count: 30
          // image.url_list[0] || icon.url_list[0]
          // name: Mirror
          isAutomaticSpeech.current = true;
          break;
        default:
          return;
      }

      const modifiedData = { ...data, text };

      if (isManualSpeech.current) {
        setTimeout(() => {
          processTiktokEvent(modifiedData, mqMsg);
        }, 4000);
      } else {
        processTiktokEvent(modifiedData, mqMsg);
      }
    });

    // Get a list of all available gifts
    ioConnection.on("getAvailableGifts", (data) => {
      setAllGifts(data);
    });

    // Chat messages
    ioConnection.on("chat", (msg) => {});
    // Gift
    ioConnection.on("gift", (data) => {});
    // Share, follow
    ioConnection.on("social", (data) => {});

    ioConnectionRef.current = ioConnection;
  }, []);

  return (
    <div className="container">
      <Scene />
      {transitions(({ opacity, x }, item) => {
        const image =
          item.extendedGiftInfo?.image.url_list[0] ||
          item.extendedGiftInfo?.icon.url_list[0];
        return (
          item.text && (
            <animated.div className="message-text" style={{ opacity, x }}>
              {item.profilePictureUrl && (
                <img
                  src={item.profilePictureUrl}
                  className="avatar"
                  alt="img"
                />
              )}
              <span className="username">{item.uniqueId} </span>
              <span className="text"> {sanitizeText(item.text)}</span>
              {image && <img src={image} className="gift-icon" alt="img" />}
            </animated.div>
          )
        );
      })}
      <header className="header">
        <div className="input-group">
          <input
            type="text"
            onChange={(e) => setIdInput(e.target.value)}
            value={idInput}
            className="input"
          />
          <input
            type="button"
            onClick={connect}
            id="connectButton"
            value="Connect"
            className="button"
          />
        </div>
        <div className="meta">
          <div id="stateText">{stateText}</div>
          {connectedRoom && (
            <div id="roomStats">
              <span className="metric">
                Waitlist: <b>{waitingList}</b>
              </span>
              {/* <span className="metric">
                Viewers: <b>{viewerCount}</b>
              </span>
              <span className="metric">
                Likes: <b>{likeCount}</b>
              </span>
              <span className="metric">
                Earned Diamonds: <b>{diamondsCount}</b>
              </span> */}
            </div>
          )}
        </div>
      </header>

      <div id="textToSpeech">
        <div>
          <textarea
            size="46"
            cols="40"
            rows="10"
            type="text"
            className="text-entry"
            value={manualSpeech}
            onChange={onChangeManualSpeech}
          ></textarea>
        </div>
        <div>
          <button onClick={playManualSpeech} id="play" className="speechButton">
            Play
          </button>
        </div>
        <div>
          <select
            onChange={onChangeEmoteValue}
            className="gestureButton"
            value={emoteValue}
          >
            <option value="select">Select emote</option>
            {Object.values(ANIMATIONS_MAP).map((animation) => (
              <option key={animation} value={animation}>
                {animation.replaceAll("_", " ").toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={handlePlayGesture}
            id="playEmote"
            className="gestureButton"
          >
            Play Emote
          </button>
        </div>
      </div>
      {/* <main className="main">
        {connectedRoom && (
          <div className="lists">
            <div className="chats-container">
              <h3 className="title">Chats</h3>
              <div className="chats-list">
                {chat.length > 0 ? (
                  chat.map((msg, i) => (
                    <div key={i} className="row">
                      <img src={msg.profileImg} className="avatar" alt="img" />
                      <span>{msg.uniqueId}: </span>
                      <span className="message-text">{sanitizeText(msg.text)}</span>
                    </div>
                  ))
                ) : (
                  <span>No chats yet</span>
                )}
                <div ref={lastMessageRef} />
              </div>
            </div>
            <div className="gifts-container">
              <h3 className="title">Gifts</h3>
              <div className="gifts-list">
                {gifts.length > 0 ? (
                  gifts.map((gift) => <div className="row"></div>)
                ) : (
                  <span>No gifts yet</span>
                )}
              </div>
            </div>
          </div>
        )}
      </main> */}
    </div>
  );
}

export default App;
