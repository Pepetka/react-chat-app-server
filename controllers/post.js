import db from '../database/database.js';
import PostModel from '../models/post.js';
import { UserMiniModel } from '../models/user.js';
import sortByCreatedAt from '../helpers/sortByCreatedAt.js';
import { saveImage } from '../storage/storage.js';
import { getFullHostName } from '../helpers/getFullHostName.js';

class Post {
	async getPosts(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const { userId, page, limit } = req.query;

			await db.read();
			const { 'user-posts': userPosts, posts, users, groups } = db.data;

			const userPostsFromDb = userPosts
				.filter((post) => post.userId === userId)
				.map(({ postId }) => postId);

			const postsFromDb = posts
				.filter((post) => userPostsFromDb.includes(post.id))
				.map((post) => {
					let authorData = users.find((user) => user.id === post.authorId);
					let author;

					if (!authorData) {
						authorData = groups.find((group) => group.id === post.authorId);
						author = new UserMiniModel({
							id: authorData.id,
							avatar: authorData.avatar,
							name: authorData.name,
						});
					} else {
						author = new UserMiniModel({
							id: authorData.id,
							avatar: authorData.avatar,
							name: `${authorData.firstname} ${authorData.lastname}`,
						});
					}

					return {
						...post,
						img: post.img?.map((image) => `${fullHostName}/images/${image}`),
						authorId: undefined,
						author: {
							...author,
							avatar: `${fullHostName}/images/${author.avatar}`,
						},
					};
				})
				.sort(sortByCreatedAt);

			const startIndex = 0;
			const endIndex = Math.min(page * limit + limit, postsFromDb.length);
			const endReached = endIndex === postsFromDb.length;

			return res.json({
				posts: postsFromDb.slice(startIndex, endIndex),
				endReached,
			});
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async deletePosts(req, res) {
		try {
			const { postId, userId } = req.body;

			await db.read();
			const { 'user-posts': userPosts, posts } = db.data;

			const deletePost = posts.find((post) => post.id === postId);

			const deletePostIndex = posts.findIndex((post) => post.id === postId);

			const userPostsFromBd = userPosts.filter(
				(userPost) => userPost.postId === postId,
			);

			const deleteUserPostIndex = userPosts.findIndex(
				(userPost) => userPost.postId === postId && userPost.userId === userId,
			);

			if (userPostsFromBd.length === 1) {
				posts.splice(deletePostIndex, 1);
			}

			userPosts.splice(deleteUserPostIndex, 1);

			await db.write();

			return res.json(deletePost);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async postPosts(req, res) {
		try {
			const fullHostName = getFullHostName(req);
			const { text, authorId, profileId } = req.body;
			const files = req.files;

			const img = [];

			for (const file of files) {
				const image = await saveImage(file);
				img.push(image);
			}

			await db.read();
			const {
				'user-posts': userPosts,
				posts,
				'group-members': groupMembers,
			} = db.data;

			const groupMember = groupMembers.find(
				(member) => member.userId === authorId && member.groupId === profileId,
			);

			const newPost = new PostModel({
				authorId: groupMember ? groupMember.groupId : authorId,
				text,
				img,
			});

			const newUserPost = {
				userId: profileId,
				postId: newPost.id,
			};

			posts.push(newPost);
			userPosts.push(newUserPost);

			await db.write();

			return res.json({
				...newPost,
				img: `${fullHostName}/images/${newPost.img}`,
			});
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async getPostStats(req, res) {
		try {
			const { postId, userId } = req.query;

			await db.read();
			const {
				'user-posts': userPosts,
				posts,
				'post-likes': postLikes,
				'post-dislikes': postDislikes,
				comments,
			} = db.data;

			const postLikesFromDb = postLikes.filter(
				(like) => like.postId === String(postId),
			);

			const postDislikesFromDb = postDislikes.filter(
				(dislike) => dislike.postId === String(postId),
			);

			const postCommentsFromDb = comments.filter(
				(comment) => comment.postId === String(postId),
			);

			const postFromDb = posts.find((post) => post.id === String(postId));

			const postSharedFromDb = userPosts.filter(
				(post) =>
					post.postId === String(postId) && postFromDb.authorId !== post.userId,
			);

			const response = {
				likes: String(postLikesFromDb.length),
				isLiked: Boolean(
					postLikesFromDb.find((like) => like.userId === userId),
				),
				dislikes: String(postDislikesFromDb.length),
				isDisliked: Boolean(
					postDislikesFromDb.find((dislike) => dislike.userId === userId),
				),
				comments: String(postCommentsFromDb.length),
				shared: String(postSharedFromDb.length),
				isShared: Boolean(
					postSharedFromDb.find((shared) => shared.userId === userId),
				),
			};

			return res.json(response);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async like(req, res) {
		try {
			const { postId, userId } = req.body;

			await db.read();
			const { 'post-likes': postLikes, 'post-dislikes': postDislikes } =
				db.data;

			const newPostLikes = {
				userId,
				postId,
			};

			const postLikesIndex = postLikes.findIndex(
				(like) => like.userId === userId && like.postId === String(postId),
			);

			if (postLikesIndex >= 0) {
				postLikes.splice(postLikesIndex, 1);
			} else {
				postLikes.push(newPostLikes);
			}

			const postDislikesIndex = postDislikes.findIndex(
				(dislike) =>
					dislike.postId === String(postId) && dislike.userId === userId,
			);

			postDislikes.splice(postDislikesIndex, 1);

			await db.write();

			return res.json(newPostLikes);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async dislike(req, res) {
		try {
			const { postId, userId } = req.body;

			await db.read();
			const { 'post-likes': postLikes, 'post-dislikes': postDislikes } =
				db.data;

			const newPostDislikes = {
				userId,
				postId,
			};

			const postDislikesIndex = postDislikes.findIndex(
				(dislike) =>
					dislike.userId === userId && dislike.postId === String(postId),
			);

			if (postDislikesIndex >= 0) {
				postDislikes.splice(postDislikesIndex, 1);
			} else {
				postDislikes.push(newPostDislikes);
			}

			const postLikesIndex = postLikes.findIndex(
				(like) => like.postId === String(postId) && like.userId === userId,
			);

			postLikes.splice(postLikesIndex, 1);

			await db.write();

			return res.json(newPostDislikes);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}

	async share(req, res) {
		try {
			const { postId, userId } = req.body;

			await db.read();
			const { 'user-posts': userPosts, posts } = db.data;

			const userPostFromDb = userPosts.find(
				(post) => post.userId === userId && post.postId === String(postId),
			);

			const newUserPost = {
				userId,
				postId,
			};

			if (!userPostFromDb) {
				userPosts.push(newUserPost);
			}

			await db.write();

			return res.json(newUserPost);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: e.message });
		}
	}
}

export default Post;
