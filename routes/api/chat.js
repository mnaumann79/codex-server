// const express = require('express');
// const router = express.Router();
// const chatController = require('../../controllers/chatController');

import express from "express";

import {
	resetChat,
	setUserMessage,
	getHistory,
	getAnswer,
	getAnswerAI
} from "../../controllers/chatController.js";

const router = express.Router();

router.route("/").get((req, res) => {
	res.send("Hello from Codex-Server!");
});

router.route("/reset").post(resetChat);

router.route("/usermessage").post(setUserMessage);

router.route("/history").get(getHistory);

router.route("/answer-ai").get(getAnswerAI);

router.route("/answer").get(getAnswer);

export default router;
