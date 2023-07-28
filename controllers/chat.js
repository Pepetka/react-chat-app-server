import db from "../database/database.js";
import { v4 as createId } from "uuid";
import getContains from "../helpers/getContains.js";
import {UserMiniModel} from "../models/user.js";
import sortByDate from "../helpers/sortByDate.js";
import sortByTime from "../helpers/sortByTime.js";
import getCurrentDate from "../helpers/getCurrentDate.js";
import MessageModel from "../models/message.js";

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

	#searchFilter(search) {
		return (el) => getContains(el.user.name, search);
	}

	async getChats(req, res) {
		try {
			const fullHostName = `${req.protocol || 'http'}://${req.get('host')}`;
			const { userId, search = '' } = req.query;

			await db.read();
			const { users, messages, 'chat-members': chatMembers } = db.data;

			const response = chatMembers
				.filter((chat) => chat.userId === userId)
				.map((currentChat) => {
					const chatId = currentChat.chatId;

					const friendChat = chatMembers.find((chat) => chat.userId !== userId && chatId === chat.chatId);

					const user = users.find((user) => user.id === friendChat.userId);

					const lastMessageFromDB = messages
						.filter((message) => message.chatId === chatId)
						.sort((prev, current) => sortByDate(prev.createdAt, current.createdAt))[0];

					const timeDate = lastMessageFromDB.createdAt.split(' ');
					const time = timeDate[0].split(':')[0] + ':' + timeDate[0].split(':')[1];

					const createdAt = time + ' ' + timeDate[1];

					const chatUser = new UserMiniModel({
						id: user.id,
						avatar: `${fullHostName}/images/${user.avatar}`,
						name: `${user.firstname} ${user.lastname}`,
					})

					return {
						id: chatId,
						user: chatUser,
						createdAt,
						lastMessage: lastMessageFromDB.text || '[image]',
					};
				})
				.filter(this.#searchFilter(search))
				.sort((prev, current) => sortByDate(prev.createdAt, current.createdAt));

			return res.json(response);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async getMessages(req, res) {
		try {
			const { chatId, userId, friendId } = req.query;

			await db.read();
			const {
				users,
				messages,
				'chat-members': chatMembers,
				chats,
			} = db.data;

			if (!chats.find((chat) => chat.id === chatId)) {
				const friend = users.find((user) => user.id === friendId);

				const friendMini = new UserMiniModel({
					id: friend.id,
					avatar: friend.avatar,
					name: `${friend.firstname} ${friend.lastname}`,
				});

				return res.json({
					friend: friendMini,
				});
			}

			const friend = users.find((user) => friendId === user.id);

			const user = users.find((user) => userId === user.id);

			const messagesResponse = {};

			messages.forEach((message) => {
				if (message.chatId !== chatId) {
					return;
				}

				const array = message.createdAt.split(' ')[0].split(':');

				const time = array[0] + ':' + array[1];
				const date = message.createdAt.split(' ')[1];

				const currentData = {
					authorId: message.userId,
					name:
						user.id === message.userId
							? `${user.firstname} ${user.lastname}`
							: `${friend.firstname} ${friend.lastname}`,
					text: message.text,
					img: message.img,
					time,
				};

				if (messagesResponse[date]) {
					messagesResponse[date] = [...messagesResponse[date], currentData];
				} else {
					messagesResponse[date] = [currentData];
				}
			});

			Object.values(messagesResponse).forEach((value) => {
				value.sort((prev, current) => sortByTime(prev.time, current.time, 'up'));
			});

			const chatFriend = new UserMiniModel({
				id: friend.id,
				avatar: friend.avatar,
				name: `${friend.firstname} ${friend.lastname}`,
			});

			const response = {
				friend: chatFriend,
				messages: Object.entries(messagesResponse).sort((prev, current) =>
					sortByDate(prev[0], current[0], 'up'),
				),
			};

			return res.json(response);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async postMessages(req, res) {
		try {
			const { chatId, userId, friendId, text, img } = req.body;

			await db.read();
			const {
				users,
				messages,
				chats,
				'chat-members': chatMembers,
			} = db.data;

			const newMessage = new MessageModel({
				chatId,
				userId,
				type: 'text',
				text: text || undefined,
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
					{ userId: userId, chatId, createdAt: getCurrentDate() },
					{ userId: friendId, chatId, createdAt: getCurrentDate() }
				);
			}

			await db.write();

			return res.json(newMessage.id);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}
}

export default Chat;
