import { Server } from 'socket.io';
import { verificationAuthSocket } from '../middleware/auth.js';
import { getFullHostName } from '../helpers/getFullHostName.js';
import { saveImage } from '../storage/storage.js';
import SocketController from '../controllers/socket.js';

class Socket {
	constructor(server) {
		this.server = server;
		this.io = new Server(server, {
			cors: {
				origin: '*',
			},
		});
		this.controller = new SocketController();
		this.initializeSocket = this.initializeSocket.bind(this);
	}

	initializeSocket() {
		this.io.use(verificationAuthSocket);

		this.io.on('connection', (socket) => {
			const fullHostName = getFullHostName(socket.handshake);
			console.log(`A user connected: ${socket.id}`);
			this.controller.connectedUsers = socket;

			socket.on('init', (userId) => {
				socket.userId = userId;
				this.controller.onlineUsers = userId;
				this.io.emit('online', this.controller.onlineUsers);
			});

			socket.on('online', () => {
				socket.emit('online', this.controller.onlineUsers);
			});

			socket.on('join_chat', (chatId) => {
				socket.join(`chat: ${chatId}`);
			});

			socket.on('leave_chat', (chatId) => {
				socket.leave(`chat: ${chatId}`);
			});

			socket.on('new_comment', async (data, cb) => {
				try {
					const newComment = await this.controller.addComment(
						data,
						fullHostName,
					);

					this.io.emit('comments', {
						postId: data.postId,
						comment: newComment,
					});

					cb(newComment);
				} catch (e) {
					console.log(e);
					return new Error(e.message);
				}
			});

			socket.on('delete_comment', async (data, cb) => {
				try {
					const deleteCommentId = await this.controller.deleteComment(
						data.commentId,
					);
					const comments = await this.controller.getComments(data.postId);

					this.io.emit('comments', { postId: data.postId, comments });

					cb(deleteCommentId);
				} catch (e) {
					console.log(e);
					return new Error(e.message);
				}
			});

			socket.on('typing', (chatId) => {
				socket
					.to(`chat: ${chatId}`)
					.emit('typing', { friendId: socket.userId, isTyping: true });
			});

			socket.on('stop_typing', (chatId) => {
				socket
					.to(`chat: ${chatId}`)
					.emit('typing', { friendId: socket.userId, isTyping: false });
			});

			socket.on('new_message', async (chatData) => {
				try {
					const images = [];

					if (chatData.files) {
						for (const file of chatData.files) {
							const image = await saveImage(file);
							images.push(image);
						}
					}

					chatData.files = undefined;
					chatData.img = images.length ? images : undefined;

					const newMessage = await this.controller.postChatMessages(
						chatData,
						fullHostName,
					);

					this.io.to(`chat: ${chatData.chatId}`).emit('messages', newMessage);
				} catch (e) {
					console.log(e);
					return new Error(e.message);
				}
			});

			socket.on('disconnect', () => {
				this.controller.removeOnlineUser(socket.userId);
				this.controller.removeConnectedUser(socket.id);
				this.io.emit('online', this.controller.onlineUsers);
				console.log(`A user disconnected: ${socket.id}`);
			});
		});
	}

	static createSocket() {
		const createSocketInstance = (server) => {
			const socketInstance = new Socket(server);

			return socketInstance.initializeSocket();
		};

		return {
			SocketInstance: createSocketInstance,
		};
	}
}

export default Socket;
