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
  const [idInput, setIdInput] = useState("discover_the_cosmos");
  const [stateText, setStateText] = useState("");
  const [connectedRoom, setConnectedRoom] = useState(false);
  const viewerCount = useRef(0);
  const [likeCount, setLikeCount] = useState(null);
  const [waitingList, setWaitingList] = useState(null);
  const diamondsCount = useRef(0);
  const ioConnectionRef = useRef(null);
  const [emoteValue, setEmoteValue] = useState("");
  const [manualSpeech, setManualSpeech] = useState(DEFAULT_MANUAL_SPEECH);
  const isManualSpeech = useRef(false);
  const isAutomaticSpeech = useRef(false);
  const [allGifts, setAllGifts] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const connect = () => {
    if (idInput !== "") {
      ioConnectionRef.current.emit("setUniqueId", idInput, {
        enableExtendedGiftInfo: true,
      });
      setStateText("Connecting...");
    }
  };

  const addEnterEvent = () => {
    document.addEventListener("keyup", async function (event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        await playManualSpeech();
        await asyncTimeout(1000);
        await handlePlayGesture();
      }
    });
  };

  const onStartBtnClick = () => {
    connect();
    addEnterEvent();
    setLoaded(true);
  };

  const processTiktokEvent = async (data, mqMsg) => {
    setMessage(data);

    if (data.type === "social" || data.type === "like") {
      await hostSpeak(
        GRATITUDE_PHRASES[Math.floor(Math.random() * GRATITUDE_PHRASES.length)]
      );
      await asyncTimeout(1000);
      isAutomaticSpeech.current = false;
    } else if (data.type === "gift") {
      if (diamondsCount.current > 50) {
        await hostSpeak(
          GRATITUDE_PHRASES[
            Math.floor(Math.random() * GRATITUDE_PHRASES.length)
          ]
        );
        await asyncTimeout(1000);
        await handlePlayGesture();
        await asyncTimeout(1000);
        isAutomaticSpeech.current = false;
        diamondsCount.current = 0;
      }
    } else {
      await asyncTimeout(1700);
    }

    setMessage("");
    setTimeout(() => {
      ioConnectionRef.current.emit("messageProcessed", mqMsg);
    }, 500);
  };

  // Play manual speech
  // const onChangeManualSpeech = (event) => {
  //   setManualSpeech(event.target.value);
  // };

  const playManualSpeech = async () => {
    if (isAutomaticSpeech.current) {
      return;
    }

    isManualSpeech.current = true;
    await hostSpeak(manualSpeech);
    isManualSpeech.current = false;
  };

  // Play emote on demand with emote button
  // const onChangeEmoteValue = (event) => {
  //   setEmoteValue(event.target.value);
  // };

  const handlePlayGesture = async () => {
    const keys = Object.keys(ANIMATIONS_MAP);
    const randomGesture = keys[Math.floor(Math.random() * keys.length)];
    await hostPlayGesture(randomGesture, randomGesture);
  };

  useEffect(() => {
    // const ioConnection = new io("http://localhost:3001");
    const ioConnection = new io(
      "https://tiktok-live-server-prod.herokuapp.com"
    );

    // On successful connection
    ioConnection.on("setUniqueIdSuccess", (state) => {
      // Reset stats
      viewerCount.current = 0;
      setLikeCount(0);
      diamondsCount.current = 0;
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
        viewerCount.current = msg.viewerCount;
      }
    });

    ioConnection.on("join", async (msg) => {
      if (viewerCount.current < 5 && !isManualSpeech.current) {
        isManualSpeech.current = true;
        await hostSpeak(
          GRATITUDE_PHRASES[
            Math.floor(Math.random() * GRATITUDE_PHRASES.length)
          ]
        );
        await asyncTimeout(1000);
        await handlePlayGesture();
        await asyncTimeout(1000);
        isManualSpeech.current = false;
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
      return data.gift?.gift_type === 1 && !data.gift?.repeat_end;
    }

    // Process tiktok event
    ioConnection.on("tiktokEvent", (event) => {
      let text = "";
      const { data, mqMsg } = event;

      switch (data.type) {
        case "like":
          if (data.likeCount) {
            text = `sent ❤️ x ${data.likeCount} to Phendran`;
          }
          break;
        case "social":
          text = data.label.replace("{0:user}", "");
          isAutomaticSpeech.current = true;
          break;
        case "gift":
          if (data.gift && data.extendedGiftInfo) {
            if (
              !isPendingStreak(data) &&
              data.extendedGiftInfo.diamond_count > 0
            ) {
              diamondsCount.current =
                data.extendedGiftInfo.diamond_count * data.gift.repeat_count;
              text = {
                repeatCount: data.gift.repeat_count,
                diamondsCount: diamondsCount.current,
                giftIcon:
                  data.extendedGiftInfo.image.url_list[0] ||
                  data.extendedGiftInfo.icon.url_list[0],
              };
              isAutomaticSpeech.current = true;
            }
          }
          break;
        default:
          return;
      }

      const modifiedData = { ...data, text };

      if (isManualSpeech.current) {
        setTimeout(() => {
          processTiktokEvent(modifiedData, mqMsg);
        }, 14000);
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
        return (
          item.text && (
            <>
              {typeof item.text === "string" ? (
                <animated.div className="message-text" style={{ opacity, x }}>
                  {item.profilePictureUrl && (
                    <img
                      style={{
                        opacity,
                        x,
                        transform: x
                          .to({
                            range: [0, 1],
                            output: [0, 1],
                          })
                          .to((x) => `scale(${x})`),
                      }}
                      src={item.profilePictureUrl}
                      className="avatar"
                      alt="img"
                    />
                  )}
                  <div>
                    <span className="username">{item.uniqueId} </span>
                    <span className="text"> {sanitizeText(item.text)}</span>
                  </div>
                </animated.div>
              ) : (
                <animated.div className="message-text" style={{ opacity, x }}>
                  {item.profilePictureUrl && (
                    <img
                      style={{
                        opacity,
                        x,
                      }}
                      src={item.profilePictureUrl}
                      className="avatar"
                      alt="img"
                    />
                  )}
                  <div>
                    <span className="username">{item.uniqueId} </span>
                    <span className="text">sent </span>
                    {item.text.giftIcon && (
                      <img
                        src={item.text.giftIcon}
                        className="gift-icon"
                        alt="img"
                      />
                    )}
                    <span className="text">
                      x{" "}
                      {`${item.text.repeatCount} (${item.text.diamondsCount} x diamonds)`}
                    </span>
                  </div>
                </animated.div>
              )}
            </>
          )
        );
      })}
      {/* <header className="header">
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
              <span className="metric username">
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
              </span>
      </div>
      )} 
     </div>
       </header> */}
      {/* <div>
          <textarea
            size="46"
            cols="40"
            rows="10"
            type="text"
            className="text-entry"
            value={manualSpeech}
            onChange={onChangeManualSpeech}
          ></textarea>
        </div>*/}
      {loaded && connectedRoom && (
        <div>
          <div className="greeting">
            <span>Hi, my name is Phendran!</span>
            <span>Like and follow to interact with me!</span>
            <span>Sorry for the small delay :)</span>
          </div>
          <div className="waitlist">
            <span className="label">Waitlist:</span>
            <span className="count">{waitingList ?? 0}</span>
          </div>
          <div className="legend">
            <span className="offer">
              Follow / Share / Gift{" "}
              <span style={{ color: "orange" }}>&#8594;</span> Greeting
            </span>
            <span className="offer">
              Gift {`>`} 50 x diamonds{" "}
              <span style={{ color: "orange" }}>&#8594;</span> Performance
            </span>
          </div>
        </div>
      )}
      {!loaded && (
        <button onClick={onStartBtnClick} id="play" className="playBtn">
          Play
        </button>
      )}
      {/* <div>
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
        </div> */}
    </div>
  );
}

export default App;
