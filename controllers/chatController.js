const fspromise = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const { Transform } = require('stream');

const data = {
  conversation: require('../model/conversation.json'),
  setConversation: function (data) {
    // console.log(data);
    this.conversation = data;
  },
  model: '',
  setModel: function (data) {
    // console.log(data);
    this.model = data;
  },
}; // data object to be passed to the routes

const saveConversation = async (data) => {
  fspromise.writeFile(
    path.join(__dirname, '..', 'model', 'conversation.json'),
    JSON.stringify(data)
  );
};

const resetChat = (req, res) => {
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
    saveConversation(data.conversation);

    // console.log(data.conversation);
    // model = data.model;
    res.status(200).json({ message: 'conversation was reset' });
  }
};

const setUserMessage = (req, res) => {
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
    saveConversation(data.conversation);
  }

  data.setModel(reqBody.model);
  
  res.status(200).json({
    message: 'success',
    conversation: data.conversation,
  });
};

const getHistory = (req, res) => {
  res.status(200).json({
    message: 'success',
    conversation: data.conversation,
  });
};

const getAnswer = async (req, res) => {
  // make the request to the OpenAI API
  const response = await fetch(process.env.OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: data.model,
      messages: data.conversation,
      max_tokens: 1000,
      stream: true, //for the streaming purpose
    }),
  });

  if (!response.ok) {
    res.write(
      `data: ${JSON.stringify({
        message: `OpenAI API responded with status code ${response.status}`,
      })}\n\n`
    );
    return;
    // throw new Error(
    //   `OpenAI API responded with status code ${response.status}`
    // );
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  data.setConversation([
    ...data.conversation,
    { role: 'assistant', content: '' },
  ]);

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
        saveConversation(data.conversation);

        // saveConversation(JSON.stringify(conversation));
        res.end();
        resolve();
      })
      .on('error', () => {
        console.log('Error:', err);
        reject(err);
      });
  });
};

module.exports = { resetChat, setUserMessage, getHistory, getAnswer };
