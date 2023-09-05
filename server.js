/* 
https://www.youtube.com/watch?v=2FeymQoKvrk&ab_channel=JavaScriptMastery
*/
import express from "express";
const app = express();
import cors from "cors";
import router from "./routes/api/chat.js";
import mongoose from "mongoose";

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.DATABASE_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		console.log("MongoDB connected");
	} catch (error) {
		console.log(error.message);
		process.exit(1);
	}
};

connectDB();

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());

// built-in middleware for json
app.use(express.json());

app.use(express.urlencoded({ extended: true })); // Add express.urlencoded() middleware

app.use(express.static("dist"));

//routes
app.use("/chat", router);

mongoose.connection.once("open", () => {
	console.log("MongoDB connection ready!");
	app.listen(process.env.PORT, () => {
		console.log(`Server is listening at port ${process.env.PORT}`);
	});
});
