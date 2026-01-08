# Vehicle Invoice

A smart vehicle service tracking and invoice management system built with Next.js. This application allows users to manage their vehicles, upload and track service invoices, and interact with invoice data using AI-powered chat.

## Features

-   **Vehicle Management**: Add and manage vehicles with details like Make, Model, and Registration Number.
-   **Invoice Tracking**: Upload service invoices, track service dates, costs, and odometer readings.
-   **AI-Powered Chat**: Chat with your invoices to extract details or ask questions using Google Gemini or OpenAI.
-   **Dashboard**: Get a comprehensive overview of your vehicles and service history.
-   **Secure Authentication**: User authentication and management via Clerk.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/) ORM
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Authentication**: [Clerk](https://clerk.com/)
-   **File Storage**: [UploadThing](https://uploadthing.com/)
-   **AI Integration**: [Google Generative AI (Gemini)](https://ai.google.dev/) / [OpenAI](https://openai.com/)

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

-   Node.js (v18 or higher)
-   PostgreSQL database

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd vehicle-invoice
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up environment variables:

    Copy the `.env.example` file to `.env` and fill in the required values.

    ```bash
    cp .env.example .env
    ```

    **Required Variables:**
    -   `DATABASE_URL`: Your PostgreSQL connection string.
    -   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`: Clerk authentication keys.
    -   `UPLOADTHING_TOKEN`: Token for UploadThing file storage.
    -   `OPENAI_API_KEY` or `GEMINI_API_KEY`: API keys for AI features.
    -   `CONVERT_API_SECRET`: Secret for file conversion services (if used).

4.  Initialize the database:

    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  Run the development server:

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm start`: Starts the production server.
-   `npm run postinstall`: Generates Prisma client.

## License

[MIT](LICENSE)
