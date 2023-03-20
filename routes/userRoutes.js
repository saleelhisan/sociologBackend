import express from "express";
import { getUser, login, googleLogin,googleSignup,register, addProfilePic, editUserProfile, getAllUsers, followTheUser, unFollowTheUser, getNotifications } from "../controllers/userController.js";
import { verifyToken } from '../middleware/auth.js';
import upload from "../config/multer.js";
import { createPost, getPosts, likePost, commentPost, getUserPost } from "../controllers/postController.js";
import { addStory, getFriendsStories, getUserStories } from "../controllers/storyController.js";



const router = express.Router();

router.post('/signup', register);
router.post('/login', login);


router.post("/google-login", googleLogin);
router.post("/google-signup", googleSignup);



router.post('/add-post', verifyToken, upload.single('image'), createPost);
router.post('/profile-pic', verifyToken, upload.single('image'), addProfilePic);
router.post('/add-story', verifyToken, upload.single('file'), addStory);

router.get('/getPost', verifyToken, getPosts);
router.get('/user/:id', verifyToken, getUser);
router.get('/user-post/:id', verifyToken, getUserPost);
router.get('/user-stories', getUserStories);
router.get('/users/:id',getAllUsers)

router.put("/user/profile",verifyToken,editUserProfile);
router.put("/users/follow",verifyToken,followTheUser)
router.put("/users/unfollow",verifyToken,unFollowTheUser)

router.get('/notifications', verifyToken, getNotifications)


router.get('/user-stories', verifyToken, getUserStories);
router.get('/firends-stories', verifyToken, getFriendsStories);






/* UPDATE */
router.patch("/posts/:id/like", verifyToken, likePost);
router.patch("/posts/:id/comment", verifyToken, commentPost);


export default router;