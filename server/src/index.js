const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: "http://localhost:3000",
  methods: ["GET", "POST"],
});

const PORT = 5000;

io.on("connection", (socket) => {
  socket.emit("me", socket.id);

  socket.on("call_user", (data) => {
    io.to(data.room).emit("call_user", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("answer_call", (data) => {
    io.to(data.to).emit("call_accepted", data.signal);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("end_call");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
