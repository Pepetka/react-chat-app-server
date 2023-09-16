import db from '../database/database.js';
import { UserMiniModel } from '../models/user.js';
import sortByDate from '../helpers/sortByDate.js';
import MessageModel from '../models/message.js';
import getCurrentDate from '../helpers/getCurrentDate.js';
import CommentModel from '../models/comment.js';

class SocketController {
	#onlineUsers = new Set();

	#connectedUsers = {};

	get onlineUsers() {
		return Array.from(this.#onlineUsers);
	}

	set onlineUsers(userId) {
		this.#onlineUsers.add(userId);
	}

	removeOnlineUser(userId) {
		this.#onlineUsers.delete(userId);
	}

	get connectedUsers() {
		return this.#connectedUsers;
	}

	set connectedUsers(socket) {
		this.#connectedUsers[socket.id] = socket;
	}

	removeConnectedUser(socketId) {
		this.#connectedUsers[socketId] = undefined;
	}

	async postChatMessages(
		{ chatId, userId, friendId, text, img },
		fullHostName,
	) {
		await db.read();
		const { users, messages, chats, 'chat-members': chatMembers } = db.data;

		const newMessage = new MessageModel({
			chatId,
			userId,
			type: 'text',
			text,
			img,
		});

		messages.push(newMessage);

		if (!chats.find((chat) => chat.id === chatId)) {
			const friend = users.find((user) => user.id === userId);

			chats.push({
				id: chatId,
				name: `${friend.firstname} ${friend.lastname}`,
				createdAt: getCurrentDate(true),
				ownerId: userId,
			});

			chatMembers.push(
				{ userId, chatId, createdAt: getCurrentDate() },
				{ userId: friendId, chatId, createdAt: getCurrentDate() },
			);
		}

		await db.write();

		const user = users.find((user) => userId === user.id);

		const array = newMessage.createdAt.split(' ')[0].split(':');

		const time = `${array[0]}:${array[1]}`;
		const date = newMessage.createdAt.split(' ')[1];

		const currentData = {
			id: newMessage.id,
			authorId: newMessage.userId,
			name: `${user.firstname} ${user.lastname}`,
			text: newMessage.text,
			img: newMessage.img?.map((image) => `${fullHostName}/images/${image}`),
			time,
			createdAt: newMessage.createdAt,
		};

		return [date, [currentData]];
	}

	async getComments(postId, fullHostName) {
		await db.read();
		const { comments, users } = db.data;

		const commentsFromDb = comments
			.filter((comment) => comment.postId === String(postId))
			.map((comment) => {
				const author = users.find((user) => user.id === comment.authorId);
				const newAuthor = new UserMiniModel({
					id: author.id,
					avatar: `${fullHostName}/images/${author.avatar}`,
					name: `${author.firstname} ${author.lastname}`,
				});

				return {
					...comment,
					authorId: undefined,
					author: newAuthor,
				};
			})
			.sort((prev, current) => sortByDate(prev.createdAt, current.createdAt));

		return commentsFromDb;
	}

	async addComment({ authorId, text, postId }, fullHostName) {
		await db.read();
		const { comments, users } = db.data;

		const newComment = new CommentModel({
			text,
			authorId,
			postId,
		});

		comments.push(newComment);

		await db.write();

		const commentsFromDb = comments
			.filter((comment) => comment.postId === String(postId))
			.map((comment) => {
				const author = users.find((user) => user.id === comment.authorId);
				const newAuthor = new UserMiniModel({
					id: author.id,
					avatar: `${fullHostName}/images/${author.avatar}`,
					name: `${author.firstname} ${author.lastname}`,
				});

				return {
					...comment,
					authorId: undefined,
					author: newAuthor,
				};
			})
			.sort((prev, current) => sortByDate(prev.createdAt, current.createdAt));

		return commentsFromDb;
	}

	async deleteComment(commentId) {
		await db.read();
		const { comments } = db.data;

		const deleteCommentIndex = comments.findIndex(
			(comment) => comment.id === commentId,
		);

		comments.splice(deleteCommentIndex, 1);

		await db.write();

		return comments[deleteCommentIndex];
	}
}

export default SocketController;
