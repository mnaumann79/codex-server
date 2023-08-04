const fspromise = require('fs').promises;
const path = require('path');

const data = {
    conversation: require('../model/conversation.json'),
    setConversation: function (data) {
      // console.log(data);
      this.conversation = data;
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
  
  module.exports = { resetChat };