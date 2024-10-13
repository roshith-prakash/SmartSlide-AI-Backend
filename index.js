import http from "http";
import express from "express";
import dotenv from "dotenv"
import helmet from "helmet"
import cors from "cors"
dotenv.config()


// Importing Routes ----------------------------------------------------------------------------------------------

import routes from "./routes/index.js"

// Initializing Server -------------------------------------------------------------------------------------------


const app = express();
let server = http.createServer(app, { allowEIO3: true });


// Using Middleware -------------------------------------------------------------------------------------------

// Whitelist for domains
const whitelist = ['http://localhost:3000', "https://ppt-creator.vercel.app"]

// Function to deny access to domains except those in whitelist.
const corsOptions = {
    origin: function (origin, callback) {
        // Find request domain and check in whitelist.
        if (whitelist.indexOf(origin) !== -1) {
            // Accept request
            callback(null, true)
        } else {
            // Send CORS error.
            callback(new Error('Not allowed by CORS'))
        }
    }
}

// Parses request body.
app.use(express.urlencoded({ extended: true }));
// Parses JSON passed inside body.
app.use(express.json())
// Enable CORS
app.use(cors(corsOptions))
// Add security to server.
app.use(helmet())

// Routes -------------------------------------------------------------------------------------------

// Default route to check if server is working.
app.get("/", (req, res) => {
    res.status(200).send("We are good to go!")
})

// Routes -----------------------------------------------------------------------------------------

app.use("/api/v1", routes)

// Listening on PORT -------------------------------------------------------------------------------------------

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
