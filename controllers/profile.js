import db from "../database/database.js";
import { UserMiniModel } from "../models/user.js";
import getContains from "../helpers/getContains.js";
import sortByDate from "../helpers/sortByDate.js";
import { socketController } from "../app.js";

class Profile {
	constructor () {
		this.postOnline = this.postOnline.bind(this)
		this.getUsers = this.getUsers.bind(this)
		this.getGroups = this.getGroups.bind(this)
	}

	async profile(req, res) {
		try {
			const { profileId } = req.query;

			await db.read();
			const { users } = db.data;

			const profile = users.find((user) => user.id === profileId);

			if (!profile) {
				return res.status(400).json({ message: 'profile not found' });
			}

			return res.json(profile);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async group(req, res) {
		try {
			const { groupId } = req.query;

			await db.read();
			const { groups } = db.data;

			const group = groups.find((group) => group.id === groupId);

			if (!group) {
				return res.status(400).json({ message: 'Group not found' });
			}

			return res.json(group);
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

			await db.read();
			const { friends, followers } = db.data;

			const friend = friends.find(
				(friend) => (friend.friendId === friendId && friend.userId === userId) || (friend.friendId === userId && friend.userId === friendId)
			);

			if (friend) {
				return res.json({ relations: 'friend' });
			}

			const follower = followers.find((follower) => follower.userId === userId && follower.followerId === friendId);

			if (follower) {
				return res.json({ relations: 'follower' });
			}

			const following = followers.find((follower) => follower.followerId === userId && follower.userId === friendId);

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

			await db.read();
			const { followers, 'group-members': groupMembers } = db.data;

			const followersFromDb = followers.filter((follower) => follower.userId === userId);

			const followingFromDb = followers.filter((follower) => follower.followerId === userId);

			const groupsFromDb = groupMembers.filter((group) => group.userId === userId);

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
			const { userId } = req.query;

			await db.read();
			const { friends, users } = db.data;

			const friendsFromDb = friends
				.filter((friend) => friend.userId === userId || friend.friendId === userId)
				.map((friend) => {
					const user = users.find((user) =>
						userId === friend.friendId
							? user.id === friend.userId
							: user.id === friend.friendId,
					);

					const newUserMiniModel = new UserMiniModel({
						id: user.id,
						avatar: user.avatar,
						name: `${user.firstname} ${user.lastname}`
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

			await db.read();
			const { friends, followers } = db.data;

			const friendIndex = friends.findIndex(
				(friend) => (friend.userId === userId && friend.friendId === friendId) || (friend.userId === friendId && friend.friendId === userId)
			);

			if (friendIndex >= 0) {
				const newFollower = {
					userId: userId,
					followerId: friendId,
					createdAt: new Date().toLocaleDateString(),
				};

				friends.splice(friendIndex, 1);
				followers.push(newFollower);

				await db.write();

				return res.json({ message: 'Now unfriend' });
			}

			const followerIndex = followers.findIndex((follower) => follower.userId === userId && follower.followerId === friendId);

			if (followerIndex >= 0) {
				const newFriend = {
					userId,
					friendId,
					createdAt: new Date().toLocaleDateString(),
				};

				followers.splice(followerIndex, 1);
				friends.push(newFriend);

				await db.write();

				return res.json({ message: 'Now friends' });
			}

			const followingIndex = followers.findIndex((follower) => follower.followerId === userId && follower.userId === friendId);

			if (followingIndex >= 0) {
				followers.splice(followingIndex, 1);

				await db.write();

				return res.json({ message: 'Now nobody' });
			}

			const newFollower = {
				userId: friendId,
				followerId: userId,
				createdAt: new Date().toLocaleDateString(),
			};

			followers.push(newFollower);

			await db.write();

			return res.json({ message: 'Now following' });
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async getOnline(req, res) {
		try {
			// const { userId } = req.query;

			await db.read();

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

			await db.read();
			const { online } = db.data;

			clearTimeout(this.#timerId[userId]);

			online[userId] = 'online';

			await db.write();

			this.#timerId[userId] = setTimeout(async () => {
				await db.read();
				const { online } = db.data;

				online[userId] = 'offline';

				await db.write();
			}, 10000);

			return res.json('online');
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	#searchFilter(search) {
		return ({ name }) => getContains(name, search);
	}

	async getUsers(req, res) {
		try {
			const { userId, search = '' } = req.query;

			await db.read();
			const { friends, followers, users } = db.data;

			const friendsFromDb = friends.filter((friend) => friend.userId === userId || friend.friendId === userId);

			const followersFromDb = followers.filter((follower) => follower.userId === userId);

			const followingFromDb = followers.filter((follower) => follower.followerId === userId);

			const Friends = friendsFromDb
				.map((friend) => {
					const currentId = friend.userId === userId ? friend.friendId : friend.userId;

					const user = users.find((user) => user.id === currentId);

					const userMini = new UserMiniModel({
						id: user.id,
						avatar: user.avatar,
						name: `${user.firstname} ${user.lastname}`
					});

					return userMini;
				})
				.filter(this.#searchFilter(search));

			const Followers = followersFromDb
				.map((follower) => {
					const user = users.find((user) => user.id === follower.followerId);

					const userMini = new UserMiniModel({
						id: user.id,
						avatar: user.avatar,
						name: `${user.firstname} ${user.lastname}`
					});

					return userMini;
				})
				.filter(this.#searchFilter(search));

			const Following = followingFromDb
				.map((follower) => {
					const user = users.find((user) => user.id === follower.userId);

					const userMini = new UserMiniModel({
						id: user.id,
						avatar: user.avatar,
						name: `${user.firstname} ${user.lastname}`
					});

					return userMini;
				})
				.filter(this.#searchFilter(search));

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
				.map(({ id, avatar, firstname, lastname }) => {
					const userMini = new UserMiniModel({
						id: id,
						avatar: avatar,
						name: `${firstname} ${lastname}`
					});

					return userMini;
				})
				.filter(this.#searchFilter(search));

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

	async getGroups(req, res) {
		try {
			const { userId, search = '' } = req.query;

			await db.read();
			const { groups, 'group-members': groupMembers} = db.data;

			const response = groupMembers
				.filter((group) => group.userId === userId)
				.map((currentGroup) => {
					const groupId = currentGroup.groupId;

					const groupData = groups.find((group) => group.id === groupId);

					return {
						...groupData,
						createdAt: groupData.createdAt.split(' ')[1],
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

	async groupMembers(req, res) {
		try {
			const { userId, groupId } = req.query;

			await db.read();
			const { 'group-members': groupMembers } = db.data;

			const member = groupMembers.find((groupMember) => groupMember.userId === userId && groupMember.groupId === groupId);

			if (!member) {
				return res.status(400).json({ message: "Group member not found" });
			}

			return res.json(member);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}
}

export default Profile;
