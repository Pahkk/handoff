# Opryn deployment configuration

Opryn keeps every OpenAI credential and model setting server-side. Configure
these variables in Vercel for Production, Preview, and Development:

```env
OPENAI_API_KEY=<secret>
OPENAI_TEXT_MODEL=gpt-5.6-luna
OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

`OPENAI_TEXT_MODEL` is used for structured process extraction, company Q&A,
reusable owner rules, and starting-plan recommendations.

`OPENAI_TRANSCRIPTION_MODEL` receives audio only. Uploaded video is converted
to a temporary MP3 audio track inside the server function before transcription.
The temporary files are deleted after each request.

`OPENAI_EMBEDDING_MODEL` remains separate because pgvector retrieval requires
embedding vectors rather than generated text.

Never prefix these variables with `NEXT_PUBLIC_`. After changing a production
model variable, redeploy the application so every server function uses the new
configuration.
