import { Server, Socket } from "socket.io";

const RoomHandler = (io: Server, socket: Socket) => {
  const createRoom = () => {};
  const joinRoom = () => {};

  socket.on("room:create", createRoom);
  socket.on("room:join", joinRoom);
};

export default RoomHandler;
