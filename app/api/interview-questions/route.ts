import { NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_JOB_TITLE_LENGTH = 80;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type ParsedQuestions = {
  questions?: unknown;
};

function normalizeJobTitle(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized || normalized.length > MAX_JOB_TITLE_LENGTH) {
    return null;
  }

  if (!/^[\p{L}\p{N}][\p{L}\p{N}\s&/,+().'-]*$/u.test(normalized)) {
    return null;
  }

  return normalized;
}

function buildPrompt(jobTitle: string) {
  return [
    "You create interview preparation content.",
    "Use only the generic job title provided by the user.",
    "Do not reference resumes, names, companies, personal history, or private information.",
    `Generate exactly 3 thoughtful interview questions for the role: ${jobTitle}.`,
    "Make the questions specific to the role and varied across behavioral, situational, and role-specific judgment.",
    'Return JSON only in this exact format: {"questions":["question 1","question 2","question 3"]}',
  ].join(" ");
}

function parseQuestions(rawText: string) {
  const parsed = JSON.parse(rawText) as ParsedQuestions;

  if (!Array.isArray(parsed.questions) || parsed.questions.length !== 3) {
    throw new Error("The model did not return exactly 3 questions.");
  }

  const normalizedQuestions = parsed.questions.map((value) => {
    if (typeof value !== "string") {
      throw new Error("The model returned a non-text question.");
    }

    const question = value.trim();

    if (!question) {
      throw new Error("The model returned an empty question.");
    }

    return question;
  });

  return normalizedQuestions;
}

export async function POST(request: Request) {
  let body: { jobTitle?: unknown };

  try {
    body = (await request.json()) as { jobTitle?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const jobTitle = normalizeJobTitle(body.jobTitle);

  if (!jobTitle) {
    return NextResponse.json(
      {
        error:
          "Provide a job title using letters, numbers, and common punctuation only.",
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "The server is missing the Gemini API key configuration." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildPrompt(jobTitle) }],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    const payload = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      const upstreamMessage =
        payload.error?.message ?? "Gemini request failed.";
      throw new Error(upstreamMessage);
    }

    const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    const questions = parseQuestions(rawText);

    return NextResponse.json({ jobTitle, questions });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate interview questions.";

    return NextResponse.json(
      {
        error:
          message === "The model did not return exactly 3 questions." ||
          message === "The model returned a non-text question." ||
          message === "The model returned an empty question."
            ? "The AI response could not be validated. Please try again."
            : "Unable to generate interview questions right now. Please try again.",
      },
      { status: 502 }
    );
  }
}
