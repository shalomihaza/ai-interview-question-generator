"use client";

import { FormEvent, useState } from "react";

type ApiSuccess = {
  jobTitle: string;
  questions: string[];
};

const exampleTitle = "Customer Success Manager";

export default function HomePage() {
  const [jobTitle, setJobTitle] = useState(exampleTitle);
  const [questions, setQuestions] = useState<string[]>([]);
  const [submittedTitle, setSubmittedTitle] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitle = jobTitle.trim();

    if (!nextTitle) {
      setError("Enter a job title before generating questions.");
      setQuestions([]);
      return;
    }

    setIsLoading(true);
    setError("");
    setQuestions([]);

    try {
      const response = await fetch("/api/interview-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobTitle: nextTitle }),
      });

      const payload = (await response.json()) as
        | ApiSuccess
        | { error?: string };

      if (!response.ok) {
        const message =
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Unable to generate questions right now.";

        throw new Error(message);
      }

      if (!("questions" in payload)) {
        throw new Error("The server returned an unexpected response.");
      }

      setQuestions(payload.questions);
      setSubmittedTitle(payload.jobTitle);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to generate questions right now.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="card">
        <p className="eyebrow">AI interview practice</p>
        <h1>Generate 3 thoughtful interview questions</h1>
        <p className="intro">
          Enter a generic job title and the app will return role-specific
          interview questions. Use {exampleTitle} as the primary example.
        </p>

        <form className="question-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="job-title">
            Job title
          </label>
          <input
            id="job-title"
            name="jobTitle"
            type="text"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder={exampleTitle}
            autoComplete="off"
            className="text-input"
          />
          <button className="submit-button" type="submit" disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate questions"}
          </button>
        </form>

        {isLoading ? (
          <p className="status-message">Fetching interview questions...</p>
        ) : null}

        {error ? (
          <p className="status-message error" role="alert">
            {error}
          </p>
        ) : null}

        {questions.length === 3 ? (
          <section className="results" aria-live="polite">
            <h2>Questions for {submittedTitle}</h2>
            <ol>
              {questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </section>
        ) : null}
      </section>
    </main>
  );
}
