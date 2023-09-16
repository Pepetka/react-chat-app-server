import { v4 as createId } from 'uuid';
import db from '../database/database.js';
import getContains from '../helpers/getContains.js';
import { UserMiniModel } from '../models/user.js';
import sortByDate from '../helpers/sortByDate.js';
import getCurrentDate from '../helpers/getCurrentDate.js';
import ChatModel from '../models/chat.js';
import { getFullHostName } from '../helpers/getFullHostName.js';
import sortByCreatedAt from '../helpers/sortByCreatedAt.js';
import SocketController from './socket.js';

const socketController = new SocketController();

class Chat {
	constructor() {
		this.getChats = this.getChats.bind(this);
	}

	async getChatId(req, res) {
		try {
			const { userId, friendId } = req.query;

			await db.read();
			const { 'chat-members': chatMembers } = db.data;

			const obj = {};

			chatMembers.forEach((chat) => {
				if (chat.userId === userId || chat.userId === friendId) {
					obj[chat.chatId] = obj[chat.chatId] === false;
				}
			});

			let chatId = createId();

			Object.entries(obj).forEach(([key, value]) => {
				if (value) {
					chatId = key;
				}
			});

			return res.json(chatId);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async createChat(req, res) {
		try {
			const { userId, friendId, chatName } = req.body;

			await db.read();
			const { chats, 'chat-members': chatMembers, users } = db.data;

			const userChats = chatMembers
				.filter((member) => member.userId === userId)
				.map((member) => member.chatId);
			const existChat = chatMembers.find(
				(member) =>
					member.userId === friendId && userChats.contains(member.chatId),
			);

			if (existChat) {
				return res.status(400).json({ message: 'Chat already exists' });
			}

			const friend = users.find((user) => user.id === friendId);

			const newChat = new ChatModel({
				name: chatName ?? `${friend.firstname} ${friend.lastname}`,
				ownerId: userId,
			});

			chats.push(newChat);

			chatMembers.push(
				{ userId, chatId: newChat.id, createdAt: getCurrentDate() },
				{
					userId: friendId,
					chatId: newChat.id,
					createdAt: getCurrentDate(),
				},
			);

			await db.write();

			return res.json(newChat);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async deleteChat(req, res) {
		try {
			const { chatId } = req.body;

			await db.read();
			const { chats, messages, 'chat-members': chatMembers } = db.data;

			chats.mutationFilter((chat) => chat.id !== chatId);

			messages.mutationFilter((message) => message.chatId !== chatId);

			chatMembers.mutationFilter((member) => member.chatId !== chatId);

			await db.write();

			return res.json(chatId);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	#searchFilter(search) {
		return (el) =>
			getContains(el.user.username, search) ||
			getContains(el.user.firstname, search) ||
			getContains(el.user.lastname, search) ||
			getContains(el.user.email, search) ||
			getContains(el.name, search);
	}

	async getChats(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const { userId, search = '' } = req.query;

			await db.read();
			const { users, chats, messages, 'chat-members': chatMembers } = db.data;

			const response = chatMembers
				.filter((chat) => chat.userId === userId)
				.map((currentChat) => {
					const chatId = currentChat.chatId;

					const chat = chats.find((chat) => chat.id === chatId);
					const chatName = chat.name;
					const chatCreatedAt = `${chat.createdAt
						.split(' ')[0]
						.split(':')
						.splice(2, 1)
						.join(':')} ${chat.createdAt.split(' ')[1]}`;

					const friendChat = chatMembers.find(
						(chat) => chat.userId !== userId && chatId === chat.chatId,
					);

					const user = users.find((user) => user.id === friendChat.userId);

					const lastMessageFromDB = messages
						.filter((message) => message.chatId === chatId)
						.sort((prev, current) =>
							sortByDate(prev.createdAt, current.createdAt),
						)?.[0];

					let createdAt = chatCreatedAt;

					if (lastMessageFromDB) {
						const timeDate = lastMessageFromDB.createdAt.split(' ');
						const time = `${timeDate[0].split(':')[0]}:${
							timeDate[0].split(':')[1]
						}`;

						createdAt = `${time} ${timeDate[1]}`;
					}

					return {
						id: chatId,
						name: chatName,
						user,
						createdAt,
						lastMessage: lastMessageFromDB
							? lastMessageFromDB.text || '[image]'
							: '',
					};
				})
				.filter(this.#searchFilter(search))
				.map((chat) => {
					const chatUser = new UserMiniModel({
						id: chat.user.id,
						avatar: `${fullHostName}/images/${chat.user.avatar}`,
						name: `${chat.user.firstname} ${chat.user.lastname}`,
					});

					return { ...chat, user: chatUser };
				})
				.sort((prev, current) => sortByDate(prev.createdAt, current.createdAt));

			return res.json(response);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async getMessages(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const { chatId, userId, friendId, page, limit } = req.query;

			await db.read();
			const { users, messages, chats } = db.data;

			if (!chats.find((chat) => chat.id === chatId)) {
				const friend = users.find((user) => user.id === friendId);

				const friendMini = new UserMiniModel({
					id: friend.id,
					avatar: friend.avatar,
					name: `${friend.firstname} ${friend.lastname}`,
				});

				return {
					friend: friendMini,
					messages: [],
					endReached: false,
					totalCount: 0,
				};
			}

			const friend = users.find((user) => friendId === user.id);

			const user = users.find((user) => userId === user.id);

			const messagesResponse = {};

			const chatMessages = messages
				.filter((message) => message.chatId === chatId)
				.map((message) => {
					const array = message.createdAt.split(' ')[0].split(':');

					const time = `${array[0]}:${array[1]}`;
					const date = message.createdAt.split(' ')[1];

					const currentData = {
						id: message.id,
						authorId: message.userId,
						name:
							user.id === message.userId
								? `${user.firstname} ${user.lastname}`
								: `${friend.firstname} ${friend.lastname}`,
						text: message.text,
						img: message.img?.map((image) => `${fullHostName}/images/${image}`),
						time,
						date,
						createdAt: message.createdAt,
					};

					return currentData;
				})
				.sort((prev, current) => sortByCreatedAt(prev, current, 'up'));

			const endIndex = chatMessages.length;
			const startIndex = Math.max(
				endIndex - (Number(page) * Number(limit) + Number(limit)),
				0,
			);
			const endReached = startIndex === 0;

			chatMessages
				.slice(startIndex, endIndex)
				.forEach(({ date, ...currentData }) => {
					if (messagesResponse[date]) {
						messagesResponse[date] = [...messagesResponse[date], currentData];
					} else {
						messagesResponse[date] = [currentData];
					}
				});

			const chatFriend = new UserMiniModel({
				id: friend.id,
				avatar: `${fullHostName}/images/${friend.avatar}`,
				name: `${friend.firstname} ${friend.lastname}`,
			});

			const chatUser = new UserMiniModel({
				id: user.id,
				avatar: `${fullHostName}/images/${user.avatar}`,
				name: `${user.firstname} ${user.lastname}`,
			});

			const response = {
				chatMembers: {
					[chatFriend.id]: chatFriend,
					[chatUser.id]: chatUser,
				},
				messages: Object.entries(messagesResponse).sort((prev, current) =>
					sortByDate(prev[0], current[0], 'up'),
				),
			};

			return res.json({
				friend: chatFriend,
				messages: response.messages,
				endReached,
				totalCount: endIndex,
			});
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async postMessages(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const chatData = req.body;

			const newMessage = await socketController.postChatMessages(
				chatData,
				fullHostName,
			);

			return res.json(newMessage);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}
}

export default Chat;
