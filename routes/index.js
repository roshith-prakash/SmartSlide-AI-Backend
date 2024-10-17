import { Router } from "express"
import { createDocument, createPPT } from "../controllers/index.js"

// Create a router.
const router = Router()

// Default route to check if auth routes are accessible.
router.get("/", (req, res) => {
    res.status(200).send({ data: "Default Route" })
})

// Route to create a presentation
router.post("/create-ppt", createPPT)

// Route to create a document
router.post("/create-document", createDocument)

export default router