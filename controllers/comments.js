import db from "../database/database.js";
import sortByDate from "../helpers/sortByCreatedAt.js";
import { UserMiniModel } from "../models/user.js";
import CommentModel from "../models/comment.js";

class Comment {
	async getComments(req, res) {
		try {
			const { postId } = req.query;

			await db.read();
			const { comments, users } = db.data;

			const commentsFromDb = comments
				.filter((comment) => comment.postId === String(postId))
				.map((comment) => {
					const author = users.find((user) => user.id === comment.authorId);
					const newAuthor = new UserMiniModel({
						id: author.id,
						avatar: author.avatar,
						name: `${author.firstname} ${author.lastname}`,
					});

					return {
						...comment,
						authorId: undefined,
						author: newAuthor,
					};
				})
				.sort(sortByDate);

			return res.json(commentsFromDb);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async putComments(req, res) {
		try {
			const { commentId } = req.query;

			await db.read();
			const { comments } = db.data;

			const deleteCommentIndex = comments.findIndex((comment) => comment.id === commentId);

			comments.splice(deleteCommentIndex, 1);

			await db.write();

			return res.json(comments[deleteCommentIndex]);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async postComments(req, res) {
		try {
			const { authorId, text, postId } = req.body;

			await db.read();
			const { comments } = db.data;

			const newComment = new CommentModel({
				text,
				authorId,
				postId,
			});

			comments.push(newComment);

			await db.write();

			return res.json(newComment);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}
}

export default Comment;
