import db from '../database/database.js';
import sortByDate from '../helpers/sortByDate.js';
import getContains from '../helpers/getContains.js';
import GroupModel from '../models/Group.js';

class Group {
	constructor() {
		this.getGroups = this.getGroups.bind(this);
	}

	#searchFilterGroups(search) {
		return ({ name, description, tags }) =>
			getContains(name, search) ||
			getContains(description, search) ||
			tags.some(
				(tag) => getContains(tag, search) || getContains(tag, `#${search}`),
			);
	}

	async group(req, res) {
		try {
			const fullHostName = `${req.protocol || 'http'}://${req.get('host')}`;
			const { groupId } = req.query;

			await db.read();
			const { groups } = db.data;

			const group = groups.find((group) => group.id === groupId);

			if (!group) {
				return res.status(400).json({ message: 'Group not found' });
			}

			return res.json({
				...group,
				avatar: `${fullHostName}/images/${group.avatar}`,
			});
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async createGroup(req, res) {
		try {
			const fullHostName = `${req.protocol || 'http'}://${req.get('host')}`;
			const { userId, name, avatar, description, tags } = req.body;

			await db.read();
			const { groups, 'group-members': groupMembers } = db.data;

			const newGroup = new GroupModel({
				name,
				avatar: avatar ?? '3100405.png',
				description: description ?? '',
				ownerId: userId,
				tags: tags ?? [],
			});

			groups.push(newGroup);

			groupMembers.push({
				groupId: newGroup.id,
				userId,
				role: 'admin',
			});

			await db.write();

			return res.json({
				...newGroup,
				avatar: `${fullHostName}/images/${newGroup.avatar}`,
			});
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async deleteGroup(req, res) {
		try {
			const { groupId } = req.body;

			await db.read();
			const { groups, 'group-members': groupMembers } = db.data;

			groups.mutationFilter((group) => group.id !== groupId);
			groupMembers.mutationFilter((member) => member.groupId !== groupId);

			await db.write();

			return res.json(groupId);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async getGroups(req, res) {
		try {
			const fullHostName = `${req.protocol || 'http'}://${req.get('host')}`;
			const { userId, search = '' } = req.query;

			await db.read();
			const { groups, 'group-members': groupMembers } = db.data;

			const response = groupMembers
				.filter((group) => group.userId === userId)
				.map((currentGroup) => {
					const groupId = currentGroup.groupId;

					const groupData = groups.find((group) => group.id === groupId);

					return {
						...groupData,
						avatar: `${fullHostName}/images/${groupData.avatar}`,
						createdAt: groupData.createdAt.split(' ')[1],
					};
				})
				.filter(this.#searchFilterGroups(search))
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

			const member = groupMembers.find(
				(groupMember) =>
					groupMember.userId === userId && groupMember.groupId === groupId,
			);

			if (!member) {
				return res.status(400).json({ message: 'Group member not found' });
			}

			return res.json(member);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}
}

export default Group;
