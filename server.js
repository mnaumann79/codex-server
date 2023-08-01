/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

import express from "express";
import fetch from "node-fetch";
import * as dotenv from "dotenv";
import cors from "cors";
import { Transform } from "stream";
import fs from "fs";

// import fs from 'fs';
// import {fsPromise} from 'fs/promises';
// import path from 'path';

dotenv.config();

const app = express();
import conversation from "./model/conversation.js";
let model = "";

const saveConversation = async (conversation) => {
  // console.log(`The conversation is: ${JSON.stringify(conversation)}`);
  fs.writeFileSync(
    "./model/conversation.js",
    `const conversation = ${conversation};\nexport default conversation;`
  );
};

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // Add express.urlencoded() middleware

app.post("/reset", async (req, res) => {
  // console.log(conversation);
  try {
    const data = req.body;
    // console.log(data.reset);
    if (data.reset) {
      conversation.splice(0, conversation.length);
      conversation.push({
        role: "system",
        content:
          "The following is a conversation with an AI assistant named Winston. The assistant is helpful, creative, clever, and very friendly. The assistant uses markdown output whenever possible.\n",
      });
      saveConversation(JSON.stringify(conversation));
      // console.log(conversation);
      // model = data.model;
      res.status(200).json({ message: "conversation was reset" });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/chat-history", async (req, res) => {
  try {
    res.status(200).json({ message: "success", conversation: conversation });
  } catch (error) {
    console.log(error);
  }
});

app.post("/chat-data", async (req, res) => {
  // console.log(conversation);
  try {
    const data = req.body;
    // console.log(data.userMessage);
    if (conversation[conversation.length - 1].role !== "user") {
      conversation.push({ role: "user", content: `${data.userMessage}\n` });
    }
    // console.log(conversation);
    model = data.model;
    res.status(200).json({ message: "success", conversation: conversation });
  } catch (error) {
    console.log(error);
  }
});

app.get("/chat-answer", async (req, res) => {
  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // make the request to the OpenAI API
    const response = await fetch(process.env.OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4",
        messages: conversation,
        max_tokens: 1000,
        stream: true, //for the streaming purpose
      }),
    });

    // let assistantContent = "";
    conversation.push({ role: "assistant", content: "" });

    try {
      if (!response.ok) {
        throw new Error(
          `OpenAI API responded with status code ${response.status}`
        );
      }
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({
          message: `OpenAI API responded with status code ${response.status}`,
        })}\n\n`
      );
    }

    await new Promise((resolve, reject) => {
      response.body
        .pipe(
          new Transform({
            transform(chunk, encoding, callback) {
              const lines = chunk.toString().split("\n");
              // console.log(lines);
              const parsedLines = lines
                .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
                .filter((line) => line !== "") // Remove empty lines and "[DONE]"
                .filter((line) => line !== "[DONE]") // Remove empty lines and "[DONE]"
                .map((line) => JSON.parse(line)); // Parse the JSON string
              // console.log(parsedLines);
              parsedLines.forEach((parsedLine) => {
                const { choices } = parsedLine;
                const { delta } = choices[0];
                const { content } = delta;
                if (content) {
                  const botResponse = content;
                  // assistantContent += botResponse;
                  conversation[conversation.length - 1].content += botResponse;
                  res.write(`data: ${JSON.stringify({ conversation })}\n\n`);
                }
              });
              callback();
            },
          })
        )
        .on("data", () => {
          // Consume the data to trigger the 'end' event
        })
        .on("end", () => {
          saveConversation(JSON.stringify(conversation));
          res.end();
          resolve();
        })
        .on("error", () => {
          console.log("Error:", err);
          reject(err);
        });
    });
  } catch (err) {
    console.log(`This error is caught: ${err}`);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is listening at port ${process.env.PORT}`);
});
