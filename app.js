import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./router/index.js";
// import clearOnline from "./helpers/clearOnline.js";
import {verificationAuth, verificationAuthSocket} from "./middleware/auth.js";
import {Server} from "socket.io";
import http from "http";
import SocketController from "./controllers/socket.js";

dotenv.config();
// await clearOnline();

const app = express();
app.use(cors());
app.use(express.json());
app.use(verificationAuth);
app.use('/', router);

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});
io.use(verificationAuthSocket);

const socketController = new SocketController();

io.on('connection', (socket) => {
	console.log(`A user connected: ${socket.id}`);
	socketController.connectedUsers = socket;

	socket.on('init', (userId) => {
		socket.userId = userId;
		socketController.onlineUsers = userId;
		io.emit('online', socketController.onlineUsers);
	});

	socket.on('online', () => {
		socket.emit('online', socketController.onlineUsers);
	});

	socket.on('join_chat', (chatId) => {
		socket.join(`chat: ${chatId}`);
	});

	socket.on('leave_chat', (chatId) => {
		socket.leave(`chat: ${chatId}`);
	});

	socket.on('comments', async (postId) => {
		try {
			const comments = await socketController.getComments(postId);

			socket.emit('comments', {postId: postId, comments});
		} catch (e) {
			console.log(e);
			return new Error(e.message);
		}
	});

	socket.on('new_comment', async (data, cb) => {
		try {
			const newComment = await socketController.addComment(data);
			const comments = await socketController.getComments(data.postId);

			io.emit('comments', {postId: data.postId, comments});

			cb(newComment);
		} catch (e) {
			console.log(e);
			return new Error(e.message);
		}
	});

	socket.on('delete_comment', async (data, cb) => {
		try {
			const deleteCommentId = await socketController.deleteComment(data.commentId);
			const comments = await socketController.getComments(data.postId);

			io.emit('comments', {postId: data.postId, comments});

			cb(deleteCommentId)
		} catch (e) {
			console.log(e);
			return new Error(e.message);
		}
	});

	socket.on('typing', (chatId) => {
		socket.to(`chat: ${chatId}`).emit('typing', {friendId: socket.userId, isTyping: true});
	});

	socket.on('stop_typing', (chatId) => {
		socket.to(`chat: ${chatId}`).emit('typing', {friendId: socket.userId, isTyping: false});
	});

	socket.on('get_messages', async (chatData) => {
		try {
			const messages = await socketController.getChatMessages(chatData);

			socket.emit('messages', messages);
		} catch (e) {
			console.log(e)
			return new Error(e.message)
		}
	});

	socket.on('new_message', async (chatData) => {
		try {
			await socketController.postChatMessages(chatData);

			const messages = await socketController.getChatMessages(chatData);
			io.to(`chat: ${chatData.chatId}`).emit('messages', messages);
		} catch (e) {
			console.log(e)
			return new Error(e.message)
		}
	});

	socket.on('disconnect', () => {
		socketController.removeOnlineUser(socket.userId);
		socketController.removeConnectedUser(socket.id);
		io.emit('online', socketController.onlineUsers);
		console.log(`A user disconnected: ${socket.id}`);
	});
});

export default server;
export {
	socketController,
};
