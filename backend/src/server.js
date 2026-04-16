import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ENV } from "./lib/ENV.js";
import authRouter from "./routes/auth.routes.js"
import roomRouter from "./routes/room.routes.js"
import leadRouter from "./routes/lead.routes.js"
import userRouter from "./routes/user.routes.js"
import chatRouter from "./routes/chat.routes.js"
import connectDB from "./lib/db.js";
import path from 'path'
import { createServer } from 'http';
import { Server } from 'socket.io';

const __dirname = path.resolve()
const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ENV.CLIENT_URL,
        credentials: true
    }
});

// Store user socket connections
export const userSockets = new Map();

const onlineUsers = new Map(); // userId -> count of active sockets

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        // Tham gia vào phòng riêng của User
        socket.join(userId);
        
        // Track online status
        const count = onlineUsers.get(userId) || 0;
        onlineUsers.set(userId, count + 1);
        
        // Broadcast online users list
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    }

    socket.on('disconnect', () => {
        if (userId) {
            const count = onlineUsers.get(userId) || 0;
            if (count <= 1) {
                onlineUsers.delete(userId);
            } else {
                onlineUsers.set(userId, count - 1);
            }
            io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
        }
    });
});

export { io };

const PORT = ENV.PORT
app.use(express.json())
app.use(cookieParser())
app.use(cors({origin:ENV.CLIENT_URL, credentials:true}))
app.use(express.urlencoded({ extended: true }))

app.use("/api/auth", authRouter)
app.use("/api/rooms", roomRouter)
app.use("/api/leads", leadRouter)
app.use("/api/users", userRouter)
app.use("/api/chat", chatRouter)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')))

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  })
}

httpServer.listen(PORT, ()=>{
    console.log(`Server running on PORT http://localhost:${PORT}`)
    connectDB()
})