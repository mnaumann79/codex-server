const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chatController');

router.route('/reset').post(chatController.resetChat);
router.route('/usermessage').post(chatController.setUserMessage);
router.route('/history').get(chatController.getHistory);
router.route('/answer').get(chatController.getAnswer);

module.exports = router;
