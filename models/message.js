import { v4 as createId } from "uuid";
import getCurrentDate from "../helpers/getCurrentDate.js";

function MessageModel({chatId, userId, type, text, img}) {
	this.id = createId();
	this.chatId = chatId;
	this.userId = userId;
	this.type = type;
	this.text = text;
	this.img = img;
	this.createdAt = getCurrentDate(true);
}

export default MessageModel;
