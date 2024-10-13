import { Router } from "express"
import { createPPT } from "../controllers/index.js"

// Create a router.
const router = Router()

// Default route to check if auth routes are accessible.
router.get("/", (req, res) => {
    res.status(200).send({ data: "Default Route" })
})

// Route to get presentation
router.post("/create-ppt", createPPT)

export default router