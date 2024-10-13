# Powerpoint Presentation Generator

This project allows you to create a PowerPoint presentation dynamically using Generative AI for generating content and pptxgenjs for creating PowerPoint files. The application takes a topic and a specified number of slides, generates relevant content, and returns a downloadable PowerPoint presentation.

### Features

- Generate a presentation with a title, subtitle, and multiple content slides based on a given topic.
- Automatically create contrasting background and text colors for better readability.
- Customizable number of slides and bullet points per slide.
- Sends the generated PowerPoint file as a response for download.

### Technologies Used

- **Node.js**: JavaScript runtime for building the server-side application.
- **Express.js**: Web framework for Node.js to handle requests.
- **Google Gemini API**: Used for generating content for the presentation.
- **pptxgenjs**: Library for creating PowerPoint presentations programmatically.
- **dotenv**: Module to load environment variables from a `.env` file.

### Prerequisites

- Node.js (v12 or higher)
- NPM (Node Package Manager)
- Google Cloud account with access to the Gemini API.
