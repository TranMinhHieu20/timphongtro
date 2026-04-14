import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ENV } from "./lib/ENV.js";
import authRouter from "./routes/auth.routes.js"
import roomRouter from "./routes/room.routes.js"
import leadRouter from "./routes/lead.routes.js"
import userRouter from "./routes/user.routes.js"
import connectDB from "./lib/db.js";
import path from 'path'

const __dirname = path.resolve()

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

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')))

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  })
}

app.listen(PORT, ()=>{
    console.log(`Server running on PORT http://localhost:${PORT}`)
    connectDB()
})