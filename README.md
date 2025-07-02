# Intro

[Chroma](https://www.trychroma.com/) and [ChatGPT](https://chatgpt.com/) based chatbot. Provides
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
`message` field; newest message first.

The response is a stream of chunks as returned by OpenAI's API. See the [reference implementation
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
JINA_API_KEY=<key>
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
.env is the path to your .env file (relative to the current working directory).

## Chatbot Server

To start the fetcher, run:
```bash
npx website-chatbot serve --env .env
```
.env is the path to your .env file (relative to the current working directory).

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