/* 
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/
import express from "express";

import cors from "cors";

import router from "./routes/api/chat.js";

const app = express();

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());

// built-in middleware for json
app.use(express.json());

app.use(express.urlencoded({ extended: true })); // Add express.urlencoded() middleware

app.use(express.static("dist"));

//routes
app.use("/chat", router);

// app.get("/", (req, res) => {
// 	res.send("Hello from Codex-Server!");
// });



app.listen(process.env.PORT, () => {
	console.log(`Server is listening at port ${process.env.PORT}`);
});
