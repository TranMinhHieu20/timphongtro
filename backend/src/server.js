import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ENV } from "./lib/ENV.js";
import authRouter from "./routes/auth.routes.js"
import roomRouter from "./routes/room.routes.js"
import leadRouter from "./routes/lead.routes.js"
import userRouter from "./routes/user.routes.js"
import connectDB from "./lib/db.js";

const app = express()

const PORT = ENV.PORT
app.use(express.json())
app.use(cookieParser())
app.use(cors({origin:ENV.CLIENT_URL, credentials:true}))
app.use(express.urlencoded({ extended: true }))

app.use("/api/auth", authRouter)
app.use("/api/rooms", roomRouter)
app.use("/api/leads", leadRouter)
app.use("/api/users", userRouter)



app.listen(PORT, ()=>{
    console.log(`Server running on PORT http://localhost:${PORT}`)
    connectDB()
})