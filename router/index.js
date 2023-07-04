import { Router } from "express";
import Auth from "../controllers/auth.js";
import Profile from "../controllers/profile.js";
import Post from "../controllers/post.js";
import Comment from "../controllers/comments.js";
import Chat from "../controllers/chat.js";

const authController = new Auth();
const profileController = new Profile();
const postController = new Post();
const commentController = new Comment();
const chatController = new Chat();

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', profileController.profile);
router.get('/group', profileController.group);
router.get('/social', profileController.getSocial);
router.get('/friends', profileController.getFriends);
router.post('/friends', profileController.postFriends);
router.get('/relations', profileController.getRelations);
router.get('/online', profileController.getOnline);
router.post('/online', profileController.postOnline);
router.get('/getUsers', profileController.getUsers);
router.get('/getGroups', profileController.getGroups);
router.get('/group-members', profileController.groupMembers);

router.get('/posts', postController.getPosts);
router.put('/posts', postController.putPosts);
router.post('/posts', postController.postPosts);
router.get('/postStats', postController.getPostStats);
router.post('/share', postController.share);
router.post('/like', postController.like);
router.post('/dislike', postController.dislike);

router.get('/comments', commentController.getComments);
router.put('/comments', commentController.putComments);
router.post('/comments', commentController.postComments);

router.get('/getChats', chatController.getChats);
router.get('/getChatId', chatController.getChatId);
router.get('/messages', chatController.getMessages);
router.post('/messages', chatController.postMessages);

export default router;
