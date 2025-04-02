import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import PptxGenJS from "pptxgenjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { Request, Response } from "express";
dotenv.config();

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY as string);

// Choose the model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// Function to create a PPT presentation on a provided topic
export const createPPT = async (req: Request, res: Response): Promise<void> => {
  try {
    // Creating Content using Gemini
    // ---------------------------------------------------------------------------------------------------------------------------------------------

    // Prompt to generate Presentation on the provided topic
    const inputString = `
          I want to create a presentation on ${req?.body?.topic}.  
          Provide a title and subtitle for the presentation.  
          Each slide must contain ${req?.body?.points} points.  
          Ensure the content is relevant, useful, and flows logically from one slide to the next.  
          Create ${req?.body?.slides} slides.  
          Do NOT include a thank you slide.  

          Slide Types:  
          - Content (text-based slides)  
          - Table (tabular data)  
          - Chart (graphical data visualization)  

          Content must be in plaintext.  

          ${
            req?.body?.includeChart
              ? "Include relevant charts if possible. Chart types: line, bar, scatter, pie, area, bubble, radar, doughnut. Each chart must have a title, labels (x-axis), and values (y-axis)."
              : "Do NOT include charts."
          }  

          ${
            req?.body?.includeTable
              ? "Include tabular data where relevant."
              : "Do NOT include tabular data."
          }  

          Return JSON in the following format:  

          {
              "title": "",
              "subtitle": "",
              "slides": [ 
                  {
                      "type": "",
                      "title": "", 
                      "content": [""],  
                      "chartType": "", 
                      "chart": {
                          "name": "Actual Sales",
                          "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                          "values": [1500, 4600, 5156, 3167, 8510, 8009, 6006, 7855, 12102, 12789, 10123, 15121]
                      },  
                      "rows": [[],[]] 
                  }
              ]
          }

          If content cannot be created on the provided topic, return the following JSON:  
          { "error": "" }


          Do not return anything else.  
`;

    // Create content for the prompt using Gemini
    const result = await model.generateContent(inputString);

    // Get the response from the result
    const response = await result.response;

    // Convert response to text
    const text = response.text();

    // Remove json keyword & remove `
    let JSONtext = text.replace("json", "");
    JSONtext = JSONtext.replaceAll("`", "");

    // Parse the formatted response to create a JSON Object
    const jsonValues = JSON.parse(JSONtext);

    fs.writeFileSync("output.json", JSON.stringify(jsonValues));

    // Creating PPT
    // ---------------------------------------------------------------------------------------------------------------------------------------------

    if (jsonValues?.slides) {
      //Create a Presentation
      // @ts-ignore
      let presentation = new PptxGenJS();

      // Title - WORKING
      // ---------------------------------------------------------------------------------------------------------------------------------------------

      // Add the title slide
      let slide = presentation.addSlide();

      // Add title text
      slide.addText(jsonValues.title, {
        y: "30%",
        h: "10%",
        w: "100%",
        fontSize: 48,
        align: "center",
        bold: true,
        fontFace: "Times New Roman",
      });

      // Add subtitle text
      slide.addText(jsonValues.subtitle, {
        y: "65%", // Adjusted position for subtitle
        w: "100%",
        h: "10%",
        fontSize: 24, // Smaller font size for subtitle
        align: "center",
        fontFace: "Times New Roman",
        italic: true,
      });

      // Content - NOT WORKING
      // ---------------------------------------------------------------------------------------------------------------------------------------------

      // Create the content titles
      jsonValues.slides.forEach(
        (item: {
          title: string;
          type: string;
          content?: string[];
          chartType?: string;
          chart: {};
          rows: [];
        }) => {
          // Add new slide
          let slide = presentation.addSlide();

          // Add the title at the center of the slide
          slide.addText(item.title, {
            w: "100%",
            y: "5%", // Position from the top
            h: "5%", // Height of the text box
            fontSize: 32, // Font size for the title
            align: "center", // Align text to the center
            bold: true,
            fontFace: "Times New Roman",
          });

          if (item.type?.toLowerCase() == "content" && item?.content) {
            // Adding Content
            item.content.forEach((text, i, arr) => {
              const maxItems = 5;
              const minFontSize = 14; // Smallest font size for more items
              const maxFontSize = 20; // Largest font size for fewer items
              const slideHeight = 5; // Maximum height available for text placement (inches)

              // Calculate font size based on the number of items, decreasing if there are more items
              const fontSize = Math.max(
                minFontSize,
                maxFontSize - (arr.length - 1)
              );

              // Adjust the 'y' position to evenly distribute the items within the available height
              const yIncrement = slideHeight / Math.min(arr.length, maxItems);
              const yPosition = 1 + (i + 0.3) * yIncrement; // Start at y = 1 to leave space at the top

              slide.addText(text, {
                x: "5%", // Position from the left
                y: yPosition, // Dynamically calculated y position
                w: "90%",
                bullet: { type: "diamond" }, // Add bullet points
                fontSize: fontSize, // Adjusted font size
                fontFace: "Times New Roman",
                align: "justify", // Align text to the left
              });
            });
          } else if (item.type?.toLowerCase() === "chart") {
            const chartTypeMapping = {
              line: presentation.ChartType.line,
              bar: presentation.ChartType.bar,
              column: presentation.ChartType.bar,
              pie: presentation.ChartType.pie,
              doughnut: presentation.ChartType.doughnut,
              radar: presentation.ChartType.radar,
              area: presentation.ChartType.area,
              scatter: presentation.ChartType.scatter,
              bubble: presentation.ChartType.bubble,
              surface: presentation.ChartType.surface,
              stackedBar: presentation.ChartType.barStacked,
              stackedColumn: presentation.ChartType.barStacked,
              stackedArea: presentation.ChartType.areaStacked,
              waterfall: presentation.ChartType.waterfall,
              combo: presentation.ChartType.combo,
              tree: presentation.ChartType.treemap,
              sunburst: presentation.ChartType.sunburst,
              histogram: presentation.ChartType.histogram,
            };

            type ChartTypeKey =
              | "line"
              | "bar"
              | "column"
              | "pie"
              | "doughnut"
              | "radar"
              | "area"
              | "scatter"
              | "bubble"
              | "surface"
              | "stackedBar"
              | "stackedColumn"
              | "stackedArea"
              | "waterfall"
              | "combo"
              | "tree"
              | "sunburst"
              | "histogram";

            if (!!item?.chartType) {
              const chartType =
                chartTypeMapping[item.chartType as ChartTypeKey];

              let chartData = [item.chart];

              slide.addChart(chartType, chartData, {
                x: 0.5,
                y: 1.0,
                w: 9,
                h: 4.5,
                showLabel: true,
              });
            }
          } else if (item.type?.toLowerCase() === "table") {
            slide.addTable(item.rows, {
              x: 0.5,
              y: 1.0,
              w: 9,
              h: 4.5,
              border: { pt: 1, color: "000000" },
            });
          }
        }
      );

      // Thank You - WORKING
      // ---------------------------------------------------------------------------------------------------------------------------------------------

      // Add the end slide
      slide = presentation.addSlide();

      // Add the thank you slide
      slide.addText("Thank You", {
        x: "10%", // Position from the left
        y: "40%", // Position from the top
        w: "80%", // Width of the text box
        h: "20%", // Height of the text box
        fontSize: 48, // Large font size
        align: "center", // Align text to the center
        bold: true,
        fontFace: "Times New Roman",
      });

      // Writing File
      // ---------------------------------------------------------------------------------------------------------------------------------------------

      const randomString = crypto.randomBytes(4).toString("hex"); // Generates a random 8-character hex string
      const fileName = `Presentation_${randomString}.pptx`; // Replace spaces in topic with underscores

      const filePath = path.join(__dirname, fileName);
      await presentation.writeFile({ fileName: filePath });

      // Send File
      // ---------------------------------------------------------------------------------------------------------------------------------------------

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
    } else {
      res.status(400).send({ error: "Cannot create slides on provided topic" });
      return;
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send({ data: "Something went wrong." });
    return;
  }
};

// Function to create a Word document on a provided topic
export const createDocument = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Prompt to generate Document
    const inputString = `
      Write about ${req?.body?.topic}.
      Provide a title for the document.
      Ensure the content is relevant, useful, and flows logically from one paragraph to the next.
      Create ${req?.body?.paragraphs} paragraphs, with lengths appropriate to the topic.

      Formatting Rules:
      - The title must be the same as the heading in the first element.
      - The title/heading does not count as a paragraph.
      - The document should include a mix of plain paragraphs, bold text, italicized text, and subheadings for better readability.
      - Use bullet points and numbered lists where appropriate to enhance readability.
      - Add line breaks between paragraphs for better visual separation.

      Return JSON in the following format:
      {
        "title": "My Document",
        "content": [
          {
            "type": "paragraph",
            "text": "This is a sample paragraph in the document."
          },
          {
            "type": "paragraph",
            "text": "Here is another paragraph with some bold text.",
            "bold": true
          },
          {
            "type": "heading",
            "level": 2,
            "text": "Subsection"
          },
          {
            "type": "paragraph",
            "text": "This is a paragraph under the subsection with italicized text.",
            "italic": true
          },
          {
            "type": "list",
            "format": "bullet",
            "items": ["Item 1", "Item 2", "Item 3"]
          },
          {
            "type": "list",
            "format": "number",
            "items": ["First step", "Second step", "Third step"]
          }
        ]
      }

      If content cannot be created for the provided topic, return the following JSON:
      { "error": "" }

      Do not return anything else.
    `;

    // Create content for the prompt using Gemini
    const result = await model.generateContent(inputString);
    // Get the response from the result
    const response = await result.response;
    // Convert response to text
    const text = response.text();

    // Remove json keyword & remove `
    let JSONtext = text.replace("json", "");
    JSONtext = JSONtext.replaceAll("`", "");
    // Parse the formatted response to create a JSON Object
    const jsonValues = JSON.parse(JSONtext);

    fs.writeFileSync("output.json", JSON.stringify(jsonValues));

    if (jsonValues?.content) {
      // Create an array to hold all paragraphs
      const paragraphs = [];

      let paragraph = new Paragraph({
        children: [
          new TextRun({
            text: jsonValues.title,
            size: 36,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: {
          after: 200,
        },
      });

      paragraphs.push(paragraph);

      // Loop through the content array to build the paragraphs
      jsonValues.content.forEach(
        (item: {
          type: string;
          text?: string;
          bold?: boolean;
          italic?: boolean;
          level?: number;
          items?: string[];
          format?: string;
        }) => {
          let paragraph;

          if (item.type === "heading") {
            // Create a heading based on the specified level
            paragraph = new Paragraph({
              children: [
                new TextRun({
                  text: item.text || "",
                  size: 36,
                }),
              ],
              heading:
                item.level === 1
                  ? HeadingLevel.HEADING_1
                  : HeadingLevel.HEADING_2,
              spacing: {
                after: 200,
              },
            });
          } else if (item.type === "paragraph") {
            // Create a paragraph with optional styles
            paragraph = new Paragraph({
              children: [
                new TextRun({
                  text: item.text || "",
                  bold: item.bold || false,
                  italics: item.italic || false,
                  size: 24,
                  font: "Times New Roman",
                }),
              ],
              spacing: {
                before: 200, // Adjust the value for the desired space after the paragraph
                line: 300,
              },
            });
          } else if (item.type === "list" && item.items) {
            item.items.forEach((listItem) => {
              paragraph = new Paragraph({
                children: [
                  new TextRun({
                    text: listItem,
                    size: 24,
                    font: "Times New Roman",
                  }),
                ],
                bullet: item.format === "bullet" ? { level: 0 } : undefined,
                numbering:
                  item.format === "number"
                    ? { reference: "my-unique-list-id", level: 0 }
                    : undefined,
                spacing: {
                  before: 100,
                },
              });
              paragraphs.push(paragraph);
            });
            return;
          }

          // Add the paragraph to the children array of the document's section
          if (paragraph) {
            paragraphs.push(paragraph);
          }
        }
      );

      // Create a new document
      const doc = new Document({
        title: jsonValues.title,
        sections: [
          {
            children: paragraphs,
          },
        ],
      });

      // Create a buffer and write the document
      const buffer = await Packer.toBuffer(doc);

      // Writing File
      // ---------------------------------------------------------------------------------------------------------------------------------------------

      const randomString = crypto.randomBytes(4).toString("hex"); // Generates a random 8-character hex string
      const fileName = `Document-${randomString}.docx`; // Replace spaces in topic with underscores

      const filePath = path.join(__dirname, fileName);
      fs.writeFileSync(filePath, buffer);

      // Send File
      // ---------------------------------------------------------------------------------------------------------------------------------------------

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
    } else {
      res.status(400).send({ error: "Cannot create slides on provided topic" });
      return;
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send({ data: "Something went wrong." });
    return;
  }
};
