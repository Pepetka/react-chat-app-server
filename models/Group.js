import { v4 as createId } from 'uuid';
import getCurrentDate from '../helpers/getCurrentDate.js';

function GroupModel({ ownerId, name, tags, description, avatar }) {
	this.id = createId();
	this.ownerId = ownerId;
	this.name = name;
	this.tags = tags;
	this.description = description;
	this.avatar = avatar;
	this.createdAt = getCurrentDate();
}

export default GroupModel;
