import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db.json');

const adapter = new JSONFile(file);
const defaultData = {
	users: [],
	friends: [],
	followers: [],
	posts: [],
	'user-posts': [],
	'post-likes': [],
	'post-dislikes': [],
	comments: [],
	chats: [],
	messages: [],
	'chat-members': [],
	online: {},
	groups: [],
	'group-members': [],
};
const db = new Low(adapter, defaultData);

export default db;
