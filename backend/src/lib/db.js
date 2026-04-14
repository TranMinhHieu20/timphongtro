import mongoose from "mongoose";
import {ENV} from '../lib/ENV.js'

const connectDB = async () => {
    try {
        if(!ENV.MONGO_URI){
            throw new Error("Please provide MONGO_URI in the environment variables")
        }
        await mongoose.connect(ENV.MONGO_URI)
        console.log("MongoDB connected")
    } catch (error) {
        console.log(error)
    }
}

export default  connectDB