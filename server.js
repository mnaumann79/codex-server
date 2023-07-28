/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

import express from 'express';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Transform } from 'stream';

// const express = require('express');
// const fetch = require('node-fetch');
// // const dotenv = require('dotenv')
// const cors = require('cors');
// const Transform = require('stream').Transform;



// Only for testing purposes, do not use in production
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();
// console.log(process.env.OPENAI_API_URL);

const app = express();
const conversation = [];
let model = '';

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // Add express.urlencoded() middleware

app.post('/chat', async (req, res) => {
  try {
    const data = req.body;
    // console.log(JSON.stringify(data));
    conversation.push(...data.conversation);
    model = data.model;
    res.status(200).json({"message":"success"});
  } catch (error) {
    console.log(error);
  }
  console.log(model);
});

app.get('/chat', async (req, res) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // make the request to the OpenAI API
    const response = await fetch(process.env.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: conversation,
        max_tokens: 1000,
        stream: true, //for the streaming purpose
      }),
    });

    let assistantContent = '';

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
    console.log()
    await new Promise((resolve, reject) => {
      response.body
        .pipe(
          new Transform({
            transform(chunk, encoding, callback) {
              const lines = chunk.toString().split('\n');
              // console.log(lines);
              const parsedLines = lines
                .map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
                .filter((line) => line !== '') // Remove empty lines and "[DONE]"
                .filter((line) => line !== '[DONE]') // Remove empty lines and "[DONE]"
                .map((line) => JSON.parse(line)); // Parse the JSON string
              // console.log(parsedLines);
              parsedLines.forEach((parsedLine) => {
                const { choices } = parsedLine;
                const { delta } = choices[0];
                const { content } = delta;
                if (content) {
                  const botResponse = content;
                  assistantContent += botResponse;
                  res.write(`data: ${JSON.stringify({ botResponse })}\n\n`);
                }
              });
              callback();
            },
          })
        )
        .on('data', () => {
          // Consume the data to trigger the 'end' event
        })
        .on('end', () => {
          // check the time for the response
          res.end();
          resolve();
        })
        .on('error', () => {
          console.log('Error:', err);
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
