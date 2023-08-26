/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

// const express = require('express');
// const dotenv = require('dotenv');
// const cors = require('cors');

import express from 'express';

import cors from 'cors';

import router from './routes/api/chat.js';
import conversation from './model/conversation.js';

const app = express();


app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());

// built-in middleware for json
app.use(express.json());

app.use(express.urlencoded({ extended: true })); // Add express.urlencoded() middleware

//routes
app.use('/', router);

// app.post('/reset', async (req, res) => {
//   console.log(conversation);
// try {
//   const data = req.body;
//   // console.log(data.reset);
//   if (data.reset) {
//     conversation.splice(0, conversation.length);
//     conversation.push({
//       role: "system",
//       content:
//         "The following is a conversation with an AI assistant named Winston. The assistant is helpful, creative, clever, and very friendly. The assistant uses markdown output whenever possible.\n",
//     });
//     // saveConversation(JSON.stringify(conversation));
//     // console.log(conversation);
//     // model = data.model;
//     res.status(200).json({ message: "conversation was reset" });
//   }
// } catch (error) {
//   console.log(error);
// }
// });

app.listen(process.env.PORT, () => {
  console.log(`Server is listening at port ${process.env.PORT}`);
});
