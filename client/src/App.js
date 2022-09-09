import "./App.css";
import Peer from "simple-peer";
import React, { useState, useRef, useEffect } from "react";
import { TextField, Button, IconButton } from "@mui/material";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { AssignmentTurnedIn, Phone } from "@mui/icons-material";

import io from "socket.io-client";

const socket = io.connect("http://localhost:5000");
function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObejct = stream;
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("call_user", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });
  });

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("call_user", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObejct = stream;
    });

    socket.on("call_accepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answer_call", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObejct = stream;
    });

    peer.signal(callerSignal);

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };

  return (
    <>
      <div className="container">
        <div className="video-container">
          <div className="video">
            {stream && (
              <video
                playsInline
                muted
                ref={myVideo}
                autoPlay
                style={{ width: "300px", height: "300px" }}
              />
            )}
          </div>
          <div className="video">
            {callAccepted && !callEnded ? (
              <video
                playsInline
                ref={userVideo}
                autoPlay
                style={{
                  width: "300px",
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="myId">
          <TextField
            id="filled-basic"
            label="Name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />

          <CopyToClipboard text={me}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AssignmentTurnedIn fontSize="large" />}
            >
              Copy ID
            </Button>
          </CopyToClipboard>

          <TextField
            id="filled-basic"
            label="Id to call"
            value={idToCall}
            variant="filled"
            onChange={(e) => setIdToCall(e.target.value)}
          />

          <div className="call-button">
            {callAccepted && !callEnded ? (
              <Button variant="contained" color="secondary" onClick={leaveCall}>
                End call
              </Button>
            ) : (
              <IconButton
                color="primary"
                aria-label="call"
                onClick={() => callUser(idToCall)}
              >
                <Phone fontSize="large" />
              </IconButton>
            )}

            {idToCall}
          </div>
        </div>

        <div>
          {receivingCall && !callAccepted ? (
            <div className="caller">
              <h1>{name}is calling ...</h1>
              <Button
                variant="contained"
                color="primary"
                onClick={answerCall}
              />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default App;
