import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import pptxgen from "pptxgenjs";
import path from "path";
import fs from "fs"
import { fileURLToPath } from "url";
import crypto from "crypto"
dotenv.config();

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

// Choose the model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const createPPT = async (req, res) => {
    try {

        // Prompt to generate Multiple Choice Questions// Prompt to generate Multiple Choice Questions
        const inputString = `
            Hey gemini, i want to create a presentation on Mumbai.
            Provide a title and subtitle for the presentation.
            Can you suggest an appropriate background color relating to the topic and create some slides on it.
            Provide the text color as well. Make sure that the background color and text color contrast.
            Each slide must contain 3 points. Make sure the content is relavent and useful.
            Create 5 slides.
            Return a json object of the following format.
            {
                  background:"",
                  textColor:""
                  title:"",
                  subtitle:"",
                  slides:[
                  {
                        title:"",
                        content:[""],
                  }
                  ]
            }
            Do not return anything else.
            `

        // Create content for the prompt using Gemini
        const result = await model.generateContent(inputString);

        // Get the response from the result
        const response = await result.response;

        // Convert response to text
        const text = response.text();

        // Remove json keyword & remove `
        let JSONtext = text.replace("json", "")
        JSONtext = JSONtext.replaceAll("`", "")

        // Parse the formatted response to create a JSON Object
        const jsonValues = JSON.parse(JSONtext)

        if (jsonValues) {
            // The text and background color for the slides
            let bgColor = jsonValues.background.replace("#", "");
            let textColor = jsonValues.textColor.replace("#", "");

            //Create a Presentation
            let pres = new pptxgen();

            // Add the title slide
            let slide = pres.addSlide();
            slide.background = { fill: bgColor };

            // Add title text
            slide.addText(jsonValues.title, {
                x: "10%",
                y: "30%",
                w: "80%",
                h: "10%",
                fontSize: 48,
                align: "center",
                bold: true,
                fontFace: "Times New Roman",
                color: textColor,
            });

            // Add subtitle text
            slide.addText(jsonValues.subtitle, {
                x: "10%",
                y: "65%",  // Adjusted position for subtitle
                w: "80%",
                h: "10%",
                fontSize: 24,  // Smaller font size for subtitle
                align: "center",
                fontFace: "Times New Roman",
                color: textColor,
                italic: true
            });

            // Create the content titles
            jsonValues.slides.forEach((item) => {

                // Add new slide
                let slide = pres.addSlide();
                slide.background = { fill: bgColor };

                // Add the title at the center of the slide
                slide.addText(item.title, {
                    x: "10%",  // Position from the left
                    y: "10%",  // Position from the top
                    h: "5%",   // Height of the text box
                    fontSize: 32,  // Font size for the title
                    align: "center",  // Align text to the center
                    bold: true,
                    fontFace: "Times New Roman",
                    color: textColor,
                });

                // Add content
                item.content.forEach((text, i) => {
                    slide.addText(text, {
                        x: "5%",  // Position from the left
                        y: 2 + (i * 1),  // Position based on the index
                        w: "90%",
                        color: textColor,
                        bullet: { type: "diamond" }, // Add bullet points
                        fontSize: 20,  // Font size for content
                        fontFace: "Times New Roman",
                        align: "justify", // Align text to the left
                    });
                });
            });

            // Add the end slide
            slide = pres.addSlide();
            slide.background = { fill: bgColor };

            // Add the thank you slide
            slide.addText("Thank You", {
                x: "10%",  // Position from the left
                y: "40%",  // Position from the top
                w: "80%",  // Width of the text box
                h: "20%",  // Height of the text box
                fontSize: 48,  // Large font size
                align: "center",  // Align text to the center
                bold: true,
                fontFace: "Times New Roman",
                color: textColor,
            });

            const randomString = crypto.randomBytes(4).toString('hex'); // Generates a random 8-character hex string
            const fileName = `Presentation_${randomString}.pptx`; // Replace spaces in topic with underscores

            const filePath = path.join(__dirname, fileName);
            await pres.writeFile({ fileName: filePath });

            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error("Send file error:", err);
                    return res.status(500).send({ data: "Failed to send the file." });
                }

                // Delete the file after sending it
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete file:", unlinkErr);
                });
            });
        }
    } catch (error) {
        console.error("An error occurred:", error);
        return res.status(500).send({ data: "Something went wrong." })
    }

}

