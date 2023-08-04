/* 
hosted at https://render.com; connected with GitHub
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());

// built-in middleware for json
app.use(express.json());

app.use(express.urlencoded({ extended: true })); // Add express.urlencoded() middleware

//routes
app.use('/', require('./routes/api/chat'))

app.listen(process.env.PORT, () => {
  console.log(`Server is listening at port ${process.env.PORT}`);
});
