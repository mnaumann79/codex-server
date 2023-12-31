// import fetch from "node-fetch";
// import { Transform } from "stream";

import OpenAI from "openai";
import conversation from "../model/conversation2.js";
import dotenv from "dotenv";
// import mongoose from "mongoose";
// import Message from "../model/Message.js";
dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

const data = {
	conversation: conversation,
	// conversation: await Message.find(),
	setConversation: function (data) {
		this.conversation = data;
	},
	model: "gpt-4",
	setModel: function (data) {
		this.model = data;
	}
}; // data object to be passed to the routes

const resetChat = (req, res) => {
	const reqBody = req.body;
	data.setConversation(reqBody.conversation);
	res.status(200).json({ message: "conversation was reset", conversation: data.conversation });
};

const setUserMessage = (req, res) => {
	const reqBody = req.body;
	if (data.conversation[data.conversation.length - 1].role !== "user") {
		data.setConversation([
			...data.conversation,
			{
				role: "user",
				content: reqBody.userMessage
			}
		]);
	}

	data.setModel(reqBody.model);

	res.status(200).json({
		message: "success"
		// conversation: data.conversation
	});
};

const getHistory = (req, res) => {
	res.status(200).json({
		// message: "success",
		conversation: data.conversation
	});
};

const getAnswerAI = async (req, res) => {
	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive"
	});

	let assistantContent = "";

	try {
		// console.log(data.conversation);
		const response = await openai.chat.completions.create({
			model: data.model,
			messages: data.conversation,
			max_tokens: 250,
			stream: true
		});

		for await (const chunk of response) {
			const { choices } = chunk;
			const { delta } = choices[0];
			const { content } = delta;

			if (content) {
				res.write(`data: ${content}\n\n`);
				assistantContent += content;
			}
		}
	} catch (error) {
		console.log(error);
		res.write(
			`data: ${JSON.stringify({
				message: `${error.message}`
			})}\n\n`
		);
	} finally {
		const conversation = [...data.conversation, { role: "assistant", content: assistantContent }];
		data.setConversation(conversation);
		res.end();
	}
};

const getAnswer = async (req, res) => {
	// make the request to the OpenAI API
	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive"
	});

	let assistantContent = "";

	const response = await fetch(process.env.OPENAI_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model: data.model,
			messages: data.conversation,
			max_tokens: 250,
			stream: true //for the streaming purpose
		})
	});
	// console.log(response.ok);

	if (!response.ok) {
		res.write(
			`data: ${JSON.stringify({
				message: `OpenAI API responded with status code ${response.status}`
			})}\n\n`
		);
		return;
	}

	// data.setConversation([...data.conversation, { role: "assistant", content: "" }]);

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
								// console.log(content);
								// const conversation = data.conversation;
								// conversation[conversation.length - 1].content += content;
								res.write(`data: ${content}\n\n`);
								assistantContent += content;
								// data.setConversation(conversation);
							}
						});
						callback();
					}
				})
			)
			.on("data", () => {
				// Consume the data to trigger the 'end' event
			})
			.on("end", () => {
				const conversation = [
					...data.conversation,
					{ role: "assistant", content: assistantContent }
				];
				data.setConversation(conversation);
				res.end();
				resolve();
			})
			.on("error", () => {
				console.log("Error:", err);
				reject(err);
			});
	});
};
export { resetChat, setUserMessage, getHistory, getAnswerAI };