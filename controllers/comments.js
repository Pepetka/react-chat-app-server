import db from '../database/database.js';
import sortByDate from '../helpers/sortByCreatedAt.js';
import { UserMiniModel } from '../models/user.js';
import { getFullHostName } from '../helpers/getFullHostName.js';
import SocketController from './socket.js';

const socketController = new SocketController();

class Comment {
	async getComments(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const { postId } = req.query;

			// await db.read();
			const { comments, users } = db.data;

			const commentsFromDb = comments
				.filter((comment) => comment.postId === String(postId))
				.map((comment) => {
					const author = users.find((user) => user.id === comment.authorId);
					const newAuthor = new UserMiniModel({
						id: author.id,
						avatar: `${fullHostName}/images/${author.avatar}`,
						name: `${author.firstname} ${author.lastname}`,
					});

					return {
						...comment,
						authorId: undefined,
						author: newAuthor,
					};
				})
				.sort((prev, current) => sortByDate(prev, current));

			return res.json(commentsFromDb);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async deleteComments(req, res) {
		try {
			const { commentId } = req.body;

			const deletedComment = await socketController.deleteComment(commentId);

			return res.json(deletedComment);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async postComments(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const commentData = req.body;

			const newComment = await socketController.addComment(
				commentData,
				fullHostName,
			);

			return res.json(newComment);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}
}

export default Comment;
