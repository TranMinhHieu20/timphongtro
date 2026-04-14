import mongoose from "mongoose";
import User from "./src/modules/User.js";
import { ENV } from "./src/lib/ENV.js";

const promoteToAdmin = async (email) => {
    try {
        await mongoose.connect(ENV.MONGO_URI);
        console.log("Connected to MongoDB");

        const user = await User.findOneAndUpdate(
            { email: email },
            { role: "admin" },
            { new: true }
        );

        if (!user) {
            console.log("User not found with email:", email);
        } else {
            console.log(`Success! User ${user.username} is now an admin.`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error promoting user:", error);
    }
};

// Replace with your email
const emailToPromote = process.argv[2];

if (!emailToPromote) {
    console.log("Please provide an email: node promote-admin.js your-email@example.com");
    process.exit(1);
}

promoteToAdmin(emailToPromote);
