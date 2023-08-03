/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const { Transform } = require('stream');

const app = express();

const data = {
  conversation: require('./model/conversation.json'),
  setConversation: function (data) {
    // console.log(data);
    this.conversation = data;
  },
}; // data object to be passed to the routes
dotenv.config();

let model = '';

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());

// built-in middleware for json
app.use(express.json());

app.use(express.urlencoded({ extended: true })); // Add express.urlencoded() middleware

app.post('/reset', async (req, res) => {
  try {
    // console.log(data.conversation);
    const reqBody = req.body;
    // console.log(reqBody.reset);
    if (reqBody.reset) {
      data.setConversation([
        {
          role: 'system',
          content:
            'The following is a conversation with an AI assistant named Winston. The assistant is helpful, creative, clever, and very friendly. The assistant uses markdown output whenever possible.\n',
        },
      ]);
      // console.log(data.conversation);
      // model = data.model;
      res.status(200).json({ message: 'conversation was reset' });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post('/data', async (req, res) => {
  // console.log(conversation);
  try {
    const reqBody = req.body;
    // console.log(reqBody);
    if (data.conversation[data.conversation.length - 1].role !== 'user') {
      data.setConversation([
        ...data.conversation,
        {
          role: 'user',
          content: reqBody.userMessage,
        },
      ]);
    }
    // console.log(data.conversation);
    model = reqBody.model;
    res
      .status(200)
      .json({ message: 'success', conversation: data.conversation });
  } catch (error) {
    console.log(`here is the error: ${error}`);
  }
});

app.get('/history', async (req, res) => {
  try {
    res
      .status(200)
      .json({ message: 'success', conversation: data.conversation });
  } catch (error) {
    console.log(error);
  }
});

app.get('/answer', async (req, res) => {
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
        model: model || 'gpt-4',
        messages: data.conversation,
        max_tokens: 1000,
        stream: true, //for the streaming purpose
      }),
    });

    // let assistantContent = "";
    // conversation.push({ role: 'assistant', content: '' });
    data.setConversation([
      ...data.conversation,
      { role: 'assistant', content: '' },
    ]);

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
                  // const botResponse = content;
                  const conversation = data.conversation;
                  // assistantContent += botResponse;

                  conversation[conversation.length - 1].content += content;
                  data.setConversation(conversation);
                  res.write(`data: ${JSON.stringify(data.conversation)}\n\n`);
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
          // saveConversation(JSON.stringify(conversation));
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
