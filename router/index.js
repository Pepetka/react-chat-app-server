import { Router } from 'express';
import Auth from '../controllers/auth.js';
import Profile from '../controllers/profile.js';
import Post from '../controllers/post.js';
import Comment from '../controllers/comments.js';
import Chat from '../controllers/chat.js';
import Group from '../controllers/group.js';
import { upload } from '../storage/storage.js';

const authController = new Auth();
const profileController = new Profile();
const postController = new Post();
const commentController = new Comment();
const chatController = new Chat();
const groupController = new Group();

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.delete('/user', authController.deleteUser);

router.get('/profile', profileController.profile);
router.get('/social', profileController.getSocial);
router.get('/friends', profileController.getFriends);
router.post('/friends', profileController.postFriends);
router.get('/relations', profileController.getRelations);
router.get('/online', profileController.getOnline);
router.post('/online', profileController.postOnline);
router.get('/getUsers', profileController.getUsers);

router.get('/posts', postController.getPosts);
router.delete('/posts', postController.deletePosts);
router.post('/posts', upload.array('images'), postController.postPosts);
router.get('/postStats', postController.getPostStats);
router.post('/share', postController.share);
router.post('/like', postController.like);
router.post('/dislike', postController.dislike);

router.get('/comments', commentController.getComments);
router.delete('/comments', commentController.deleteComments);
router.post('/comments', commentController.postComments);

router.get('/getChats', chatController.getChats);
router.get('/getChatId', chatController.getChatId);
router.post('/chat', chatController.createChat);
router.delete('/chat', chatController.deleteChat);
router.get('/messages', chatController.getMessages);
router.post('/messages', upload.array('images'), chatController.postMessages);

router.get('/group', groupController.group);
router.post('/group', groupController.createGroup);
router.delete('/group', groupController.deleteGroup);
router.get('/getGroups', groupController.getGroups);
router.get('/group-members', groupController.groupMembers);

export default router;
