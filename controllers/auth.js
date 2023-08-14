import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/database.js';
import { UserModel } from '../models/user.js';

class Auth {
	async register(req, res) {
		try {
			const { username, password, firstname, lastname, age, email } = req.body;

			await db.read();

			const { users } = db.data;

			const existedUser = users.find((user) => {
				return user.username === username;
			});

			if (existedUser) {
				return res
					.status(403)
					.json({ message: 'User with this username already exists' });
			}

			const salt = await bcrypt.genSalt(10);
			const hashPassword = await bcrypt.hash(password, salt);

			const newUser = new UserModel({
				username,
				password: hashPassword,
				firstname,
				lastname,
				email,
				age,
				avatar: '3100405.png',
			});

			const token = jwt.sign(
				{ id: newUser.id, username: newUser.username },
				process.env.SECRET_KEY,
			);

			newUser.token = token;

			users.push(newUser);

			await db.write();

			return res
				.header('auth-token', token)
				.json({ ...newUser, password: undefined });
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async login(req, res) {
		try {
			const { username, password } = req.body;

			await db.read();
			const { users } = db.data;

			const userFromBd = users.find((user) => user.username === username);

			if (!userFromBd) {
				return res.status(403).json({ message: 'User not found' });
			}

			const validPassword = await bcrypt.compare(password, userFromBd.password);

			if (!validPassword) {
				return res.status(403).json({ message: 'Wrong password' });
			}

			const token = jwt.sign(
				{ id: userFromBd.id, username: userFromBd.username },
				process.env.SECRET_KEY,
			);

			userFromBd.token = token;

			await db.write();

			return res
				.header('auth-token', token)
				.json({ ...userFromBd, password: undefined });
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async deleteUser(req, res) {
		try {
			const { username, password } = req.body;

			await db.read();
			const { users } = db.data;

			let userIndex = -1;
			const userFromBd = users.find((user, index) => {
				if (user.username === username) userIndex = index;

				return user.username === username;
			});

			if (!userFromBd) {
				return res.status(403).json({ message: 'User not found' });
			}

			const validPassword = await bcrypt.compare(password, userFromBd.password);

			if (!validPassword) {
				return res.status(403).json({ message: 'Wrong password' });
			}

			if (userIndex >= 0) {
				users.splice(userIndex, 1);
			}

			await db.write();

			return res.json({ ...userFromBd, password: undefined });
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}
}

export default Auth;
