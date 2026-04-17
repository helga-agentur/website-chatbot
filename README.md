# Intro

[Chroma](https://www.trychroma.com/), [Claude](https://www.anthropic.com/) and [Jina AI](https://jina.ai/) based chatbot. Provides
the needed functionalities to answer questions based on a website's contents:

1. A chatbot server: Uses RAG to answer a user's questions based on content queried from a Chroma
database. 
2. A website fetcher that crawls the website, transforms the content and stores it in Chroma.

It's one single repo because:
- different parts of the code base are used in chatbot server **and** website fetcher
- a mono repo is a bit too much overhead for now.

## Chatbot Server

Provides an HTTP endpoint that answers questions based on the content of a Chroma collection (RAG).

The server is spun up according to the environment variables `SERVER_PORT` and `SERVER_HOST`.
The endpoint is `/chat` and takes a JSON body with the following fields:

- `question`: The question to answer
- `history`: A list of previous messages, each with a `role` (either 'user' or 'assistant') and a
`message` field; oldest message first.

The response is a plain text stream of chunks. See the [reference implementation
of the client](frontend/index.html).

One important thing to note: The history is currently stored on the client and can therefore
be manipulated by the user. That should not be a big issue, as the user's input can never be
trusted and so can't the LLM's. We do and must, however, make sure that the role 'system' 
(or 'developer') can never be used.

## Website Fetcher

Fetches all pages from a website (provided as environment variable `WEBSITE_BASE_URL`), converts it
to Markdown, splits that markdown, embeds it and stores the chunks in a Chroma collection.

# Run

Set the required variables in your `.env` file:

```bash
# API key for Anthropic Claude — used by the chatbot server for completions
ANTHROPIC_API_KEY=<key>
# API key for Jina AI — used for embeddings (both server and fetcher) and HTML→text extraction
JINA_API_KEY=<key>
# API key for OpenAI — used by scrapino (the fetcher dependency) for PDF/document extraction;
# only required when running the website fetcher, not the chatbot server
OPENAI_API_KEY=<key>
# The URL to the website you want to fetch
WEBSITE_BASE_URL=<url>
CHROMA_COLLECTION_NAME=<name>
CHROMA_URL=<url>
SERVER_PORT=8000
SERVER_HOST=0.0.0.0
# Valid values are "true" and "false"; defines if the chat frontend is served (good for debugging,
# potential security risk for production)
EXPOSE_FRONTEND_REFERENCE_IMPLEMENTATION=false
# If you want to persist logs, provide a path to where the log file should be written
LOG_FILE_PATH=./logs/server.log
```

Run a Chroma server, e.g. locally (where we persist the data in `./chroma-data` that must exist): 
```bash
docker run -v ./chroma-data:/data -p 8000:8000 chromadb/chroma
```

## Install
Run:
```bash
npm i website-chatbot
```

## Website Fetcher

To start the fetcher, run:
```bash
npx website-chatbot fetch --env .env
```
.env is the path to your .env file (relative to the current working directory). Use the `-d` option
to delete an existing collection and create a new, empty one.

## Chatbot Server

To start the chatbot server, run:
```bash
npx website-chatbot serve --env .env
```
.env is the path to your .env file (relative to the current working directory).

# Testing

Unit tests:
```bash
npm test
```

Integration tests — no database required (uses a mock context file):
```bash
npm run test:csv
```
Reads from `testCases.csv`, runs each question against the static context in `testContext.md`,
scores each response with Claude, and writes results to `testResults.csv` (0–10).

Non-deterministic LLM-scored evaluation against live vsao-bern.ch data:
```bash
npm run eval:vsao
```
Reads from `evalCasesVsao.csv`, runs each question through the full RAG pipeline (Jina embeddings →
Chroma query → Claude), scores each response with Claude Haiku, and writes results to
`evalResultsVsao.csv`. Results vary between runs — not suitable as a CI gate.

Required setup for `eval:vsao`:
- A running Chroma server (`CHROMA_URL`, `CHROMA_COLLECTION_NAME` set in `.env`)
- The collection must be populated with vsao-bern.ch content (run `npm run fetchWebsite` first)
- `JINA_API_KEY`, `WEBSITE_BASE_URL`, and `WEBSITE_TOPIC` set in `.env`

# Develop and Publish

Before publishing, make sure to build the project:

```bash
npm run build
```

Then, publish the package:

```bash
npm publish
```

To test locally, run:

```bash
npm run build
npm link
# Now you can run the server with
website-chatbot serve --env .env
```
