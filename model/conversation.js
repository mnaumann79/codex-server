const conversation = [
	{
		role: "system",
		content:
			"The following is a conversation with an AI assistant named Winston. The assistant is helpful, creative, clever, and very friendly. The assistant uses markdown output whenever possible. Keep your answers within 100 words.\n"
	},
	{ role: "user", content: "what is react?" },
	{
		role: "assistant",
		content:
			"React, also known as React.js, is a popular JavaScript library for building user interfaces, primarily for single-page applications. It's used for handling the view layer of the web and mobile apps. React allows you to design simple views for each state in your application, and it will efficiently update and render the right components when your data changes. \n\nOne of the unique aspects of React is the concept of reusable components and the virtual DOM which optimizes rendering in the browser, improving performance. It was developed by Facebook and is maintained by Facebook and a community of individual developers and companies."
	}
];
export default conversation;
