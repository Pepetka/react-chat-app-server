import server from './app.js';

const port = 8000;

server.listen(port, () => {
	console.log(`server is running on ${port} port`);
});
