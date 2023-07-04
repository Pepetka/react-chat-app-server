import http from 'http';
import app from './app.js';

const server = http.createServer(app);

const port = 8000;

server.listen(port, () => {
	console.log(`server is running on ${port} port`);
});
