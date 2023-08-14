import { v4 as createId } from 'uuid';
import getCurrentDate from '../helpers/getCurrentDate.js';

function ChatModel({ id, name, ownerId }) {
	this.id = id ?? createId();
	this.name = name;
	this.createdAt = getCurrentDate(true);
	this.ownerId = ownerId;
}

export default ChatModel;
