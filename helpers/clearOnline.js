import db from '../database/database.js';

const clearOnline = async () => {
	// await db.read();
	const { online: onlineFromDb } = db.data;

	Object.keys(onlineFromDb).forEach((key) => {
		onlineFromDb[key] = 'offline';
	});

	// await db.write();
};

export default clearOnline;
