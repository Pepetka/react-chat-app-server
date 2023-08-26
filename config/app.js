import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { filesDir } from '../storage/storage.js';
import { verificationAuth } from '../middleware/auth.js';
import router from '../router/express.js';
import Socket from '../router/socket.js';

class AppConfig {
	constructor(app) {
		const { SocketInstance } = Socket.createSocket();

		this.server = http.createServer(app);
		this.SocketInstance = SocketInstance;
	}

	initializeApp(app) {
		dotenv.config();
		app.use('/images', express.static(filesDir));
		app.use(cors());
		app.use(express.json());
		app.use(verificationAuth);
		app.use('/', router);

		this.SocketInstance(this.server);
	}

	listen(port) {
		this.server.listen(port, () => {
			console.log(`server is running on ${port} port`);
		});
	}
}

export default AppConfig;
