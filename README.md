# Interview Question Generator

This project is a small Next.js app that accepts a generic job title and returns 3 thoughtful interview questions tailored to that role.

## Requirements

- Node.js 20 or newer
- A Gemini API key from Google AI Studio

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `GEMINI_API_KEY` in `.env.local`.
3. Install dependencies with `npm install`.
4. Start the development server with `npm run dev`.
5. Open `http://localhost:3000`.

## How it works

- The page sends the job title to `POST /api/interview-questions`.
- The server route validates the input, calls Gemini, and normalizes the response.
- The client renders a loading state, error state, and exactly 3 returned questions.

## Privacy and security

- The prompt only uses generic job titles.
- The Gemini API key stays server-side in an environment variable.
- The route does not accept personal resumes or private profile data.

## Deployment

Deploy to Vercel with the same `GEMINI_API_KEY` environment variable configured in the project settings. The default Next.js build command works as-is.

## Smoke test

1. Submit `Customer Success Manager` and confirm the page shows 3 questions.
2. Submit another generic role such as `Product Manager` and confirm the output changes by role.
3. Remove the API key and confirm the UI shows a controlled error state.
