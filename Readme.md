# SmartSlide AI Server

This project allows you to create a PowerPoint presentation dynamically using Generative AI for generating content and pptxgenjs for creating PowerPoint files. The application takes a topic and a specified number of slides, generates relevant content, and returns a downloadable PowerPoint presentation. Also creates Word documents.

### Features

- Generate a presentation with a title, subtitle, and multiple content slides based on a given topic.
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

## Setup

To run this project locally, follow these steps:

Clone the repository:

    git clone https://github.com/roshith-prakash/SmartSlide-AI-Backend.git
    
    cd SmartSlide-AI-Backend

Install dependencies:

    npm install

Create an .env file and add the following keys: (Make sure to create a gemini api key on google's AI studio)

    GEMINI_KEY = ABCDEFGHIJKLMNOP

    PORT = 4000

Run the development server:

    npm run dev

The server should now be running on http://localhost:4000.
