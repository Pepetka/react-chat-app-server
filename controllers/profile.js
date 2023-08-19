import db from '../database/database.js';
import { UserMiniModel } from '../models/user.js';
import getContains from '../helpers/getContains.js';
import { socketController } from '../app.js';
import { saveImage } from '../storage/storage.js';
import { getFullHostName } from '../helpers/getFullHostName.js';

class Profile {
	constructor() {
		this.postOnline = this.postOnline.bind(this);
		this.getUsers = this.getUsers.bind(this);
	}

	async profile(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const { profileId } = req.query;

			// await db.read();
			const { users } = db.data;

			const profile = users.find((user) => user.id === profileId);

			if (!profile) {
				return res.status(400).json({ message: 'profile not found' });
			}

			return res.json({
				...profile,
				avatar: `${fullHostName}/images/${profile.avatar}`,
			});
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async editProfile(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const { status, email, firstname, lastname, age } = req.body;
			const file = req.file;
			const { id } = req.user;

			let avatar;

			if (file) {
				avatar = await saveImage(file);
			}

			// await db.read();
			const { users } = db.data;

			const editableProfile = users.find((user) => user.id === id);

			editableProfile.status = status;
			if (email) editableProfile.email = email;
			if (firstname) editableProfile.firstname = firstname;
			if (lastname) editableProfile.lastname = lastname;
			if (age) editableProfile.age = age;
			if (avatar) editableProfile.avatar = avatar;

			// await db.write();

			return res.json({
				...editableProfile,
				avatar: `${fullHostName}/images/${editableProfile.avatar}`,
			});
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async getRelations(req, res) {
		try {
			const { userId, friendId } = req.query;

			if (userId === friendId) {
				return res.json({ relations: 'nobody' });
			}

			// await db.read();
			const { friends, followers } = db.data;

			const friend = friends.find(
				(friend) =>
					(friend.friendId === friendId && friend.userId === userId) ||
					(friend.friendId === userId && friend.userId === friendId),
			);

			if (friend) {
				return res.json({ relations: 'friend' });
			}

			const follower = followers.find(
				(follower) =>
					follower.userId === userId && follower.followerId === friendId,
			);

			if (follower) {
				return res.json({ relations: 'follower' });
			}

			const following = followers.find(
				(follower) =>
					follower.followerId === userId && follower.userId === friendId,
			);

			if (following) {
				return res.json({ relations: 'following' });
			}

			return res.json({ relations: 'nobody' });
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async getSocial(req, res) {
		try {
			const { userId } = req.query;

			// await db.read();
			const { followers, 'group-members': groupMembers } = db.data;

			const followersFromDb = followers.filter(
				(follower) => follower.userId === userId,
			);

			const followingFromDb = followers.filter(
				(follower) => follower.followerId === userId,
			);

			const groupsFromDb = groupMembers.filter(
				(group) => group.userId === userId,
			);

			return res.json({
				followersNum: String(followersFromDb.length),
				followingNum: String(followingFromDb.length),
				groupsNum: String(groupsFromDb.length),
			});
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async getFriends(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const { userId } = req.query;

			// await db.read();
			const { friends, users } = db.data;

			const friendsFromDb = friends
				.filter(
					(friend) => friend.userId === userId || friend.friendId === userId,
				)
				.map((friend) => {
					const user = users.find((user) =>
						userId === friend.friendId
							? user.id === friend.userId
							: user.id === friend.friendId,
					);

					const newUserMiniModel = new UserMiniModel({
						id: user.id,
						avatar: `${fullHostName}/images/${user.avatar}`,
						name: `${user.firstname} ${user.lastname}`,
					});

					return newUserMiniModel;
				});

			return res.json(friendsFromDb);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async postFriends(req, res) {
		try {
			const { userId, friendId } = req.body;

			// await db.read();
			const { friends, followers } = db.data;

			const friendIndex = friends.findIndex(
				(friend) =>
					(friend.userId === userId && friend.friendId === friendId) ||
					(friend.userId === friendId && friend.friendId === userId),
			);

			if (friendIndex >= 0) {
				const newFollower = {
					userId,
					followerId: friendId,
					createdAt: new Date().toLocaleDateString(),
				};

				friends.splice(friendIndex, 1);
				followers.push(newFollower);

				// await db.write();

				return res.json({ message: 'Now unfriend' });
			}

			const followerIndex = followers.findIndex(
				(follower) =>
					follower.userId === userId && follower.followerId === friendId,
			);

			if (followerIndex >= 0) {
				const newFriend = {
					userId,
					friendId,
					createdAt: new Date().toLocaleDateString(),
				};

				followers.splice(followerIndex, 1);
				friends.push(newFriend);

				// await db.write();

				return res.json({ message: 'Now friends' });
			}

			const followingIndex = followers.findIndex(
				(follower) =>
					follower.followerId === userId && follower.userId === friendId,
			);

			if (followingIndex >= 0) {
				followers.splice(followingIndex, 1);

				// await db.write();

				return res.json({ message: 'Now nobody' });
			}

			const newFollower = {
				userId: friendId,
				followerId: userId,
				createdAt: new Date().toLocaleDateString(),
			};

			followers.push(newFollower);

			// await db.write();

			return res.json({ message: 'Now following' });
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async getOnline(req, res) {
		try {
			// const { userId } = req.query;

			// await db.read();

			// const { online } = db.data;

			// const response = online[userId] ?? 'offline';
			return res.json(socketController.onlineUsers);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	#timerId = {};

	async postOnline(req, res) {
		try {
			const { userId } = req.body;

			// await db.read();
			const { online } = db.data;

			clearTimeout(this.#timerId[userId]);

			online[userId] = 'online';

			// await db.write();

			this.#timerId[userId] = setTimeout(async () => {
				// await db.read();
				const { online } = db.data;

				online[userId] = 'offline';

				// await db.write();
			}, 10000);

			return res.json('online');
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	#searchFilter(search) {
		return ({ username, firstname, lastname, email }) =>
			getContains(username, search) ||
			getContains(firstname, search) ||
			getContains(lastname, search) ||
			getContains(email, search);
	}

	async getUsers(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const { userId, search = '' } = req.query;

			// await db.read();
			const { friends, followers, users } = db.data;

			const friendsFromDb = friends.filter(
				(friend) => friend.userId === userId || friend.friendId === userId,
			);

			const followersFromDb = followers.filter(
				(follower) => follower.userId === userId,
			);

			const followingFromDb = followers.filter(
				(follower) => follower.followerId === userId,
			);

			const Friends = friendsFromDb
				.map((friend) => {
					const currentId =
						friend.userId === userId ? friend.friendId : friend.userId;
					const user = users.find((user) => user.id === currentId);

					return user;
				})
				.filter(this.#searchFilter(search))
				.map((user) => {
					const userMini = new UserMiniModel({
						id: user.id,
						avatar: `${fullHostName}/images/${user.avatar}`,
						name: `${user.firstname} ${user.lastname}`,
					});

					return userMini;
				});

			const Followers = followersFromDb
				.map((follower) => {
					const user = users.find((user) => user.id === follower.followerId);

					return user;
				})
				.filter(this.#searchFilter(search))
				.map((user) => {
					const userMini = new UserMiniModel({
						id: user.id,
						avatar: `${fullHostName}/images/${user.avatar}`,
						name: `${user.firstname} ${user.lastname}`,
					});

					return userMini;
				});

			const Following = followingFromDb
				.map((follower) => {
					const user = users.find((user) => user.id === follower.userId);

					return user;
				})
				.filter(this.#searchFilter(search))
				.map((user) => {
					const userMini = new UserMiniModel({
						id: user.id,
						avatar: `${fullHostName}/images/${user.avatar}`,
						name: `${user.firstname} ${user.lastname}`,
					});

					return userMini;
				});

			const Others = users
				.filter((user) => {
					return (
						userId !== user.id &&
						!friendsFromDb.find(
							(friend) =>
								friend.userId === user.id || friend.friendId === user.id,
						) &&
						!followersFromDb.find(
							(follower) => follower.followerId === user.id,
						) &&
						!followingFromDb.find((follower) => follower.userId === user.id)
					);
				})
				.filter(this.#searchFilter(search))
				.map(({ id, avatar, firstname, lastname }) => {
					const userMini = new UserMiniModel({
						id,
						avatar: `${fullHostName}/images/${avatar}`,
						name: `${firstname} ${lastname}`,
					});

					return userMini;
				});

			const response = {
				Followers: Followers.length === 0 ? undefined : Followers,
				Following: Following.length === 0 ? undefined : Following,
				Friends: Friends.length === 0 ? undefined : Friends,
				Others: Others.length === 0 ? undefined : Others,
			};

			return res.json(response);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}
}

export default Profile;
