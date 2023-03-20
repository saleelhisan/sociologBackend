import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from "../models/User.js";
import cloudinary from '../config/cloudinery.js';
import { OAuth2Client } from "google-auth-library";
import Notification from '../models/Notification.js';


/* REGISTER USER */
export const register = async (req, res) => {
    try {
        const { firstName,
            lastName,
            username,
            email,
            phone,
            password

        } = req.body;
        const userExist = await User.findOne({
            $or: [
                { email },
                { username },
                { phone }
            ]
        });
        if (userExist) return res.status(400).json({ msg: "User Already Exists " });
        const salt = await bcrypt.genSalt();

        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: passwordHash,
            phone,
            firstName,
            lastName,
        });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);


    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: err.message });
    }
};

/* LOGGING IN */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) return res.status(400).json({ msg: "User does not exist. " });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials. " });

        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
        delete user.password;
        res.status(200).json({ token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const verify = async (client_id, jwtToken) => {
    const client = new OAuth2Client(client_id);
    // Call the verifyIdToken to
    // varify and decode it
    const ticket = await client.verifyIdToken({
        idToken: jwtToken,
        audience: client_id,
    });
    // Get the JSON with all the user info
    const payload = ticket.getPayload();
    // This is a JSON object that contains
    // all the user info
    console.log(payload, '-------------------');
    return payload;
}


export const googleSignup = async (req, res) => {

    try {

        console.log(req.body);
        const { token } = req.body
        const { name, email, picture, given_name, family_name } = await verify(CLIENT_ID, token);
        const user = await User.findOne({ email: email });
        if (user) {
            const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
            res.status(200).json({ token, user })
        } else {
            const newUser = new User({
                firstName: given_name,
                lastName: family_name,
                username: name,
                email,
                profilePic: picture
            });

            const svedUser = await newUser.save();
            const token = jwt.sign({ id: svedUser._id }, process.env.SECRET_KEY);
            res.status(200).json({ token, user: svedUser })
        }
    } catch (error) {
        console.log(error.message);
        res.status(401).json({ success: false, message: "Invalid token" });
    }
}

export const googleLogin = async (req, res) => {

    try {

        console.log(req.body);
        const { token } = req.body
        const { name, email, picture } = await verify(CLIENT_ID, token);
        const user = await User.findOne({ email: email });
        if (user) {
            const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
            res.status(200).json({ token, user })
        } else {
            const newUser = new User({
                username: name,
                email,
                profilePic: picture
            });

            const svedUser = await newUser.save();
            const token = jwt.sign({ id: svedUser._id }, process.env.SECRET_KEY);
            res.status(200).json({ token, user: svedUser })
        }
    } catch (error) {
        res.status(401).json({ success: false, message: "Invalid token" });
    }
}
export const getUser = async (req, res) => {

    const userId = req.params.id
    try {
        const user = await User.findById(userId);

        res.status(200).json(user)
    } catch (error) {
        res.status(500).json(error)
    }
}

export const addProfilePic = async (req, res) => {
    try {
        const { userId } = req.body;
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "Users"
        });
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: result.secure_url },
            { new: true }
        )


        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json(error)
    }
}


export const editUserProfile = async (req, res) => {

    try {
        const { firstName, lastName, bio, phone, userId } = req.body
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                firstName: firstName,
                lastName: lastName,
                bio: bio,
                phone: phone
            },
            { new: true }
        )

        res.status(200).json(updatedUser)
    } catch {
        res.status(500).json(error)
    }
}

export const getAllUsers = async (req, res) => {
    const userId = req.params.id;
    try {
        const users = await User.find({ _id: { $ne: userId } }, { password: 0 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).send('Error retrieving users from database');
    }
};


export const followTheUser = async (req, res) => {
    try {
        const { userId, userIdToFollow } = req.body;
        const friend = await User.findById(userIdToFollow);
        if (!friend) {
            return res.status(400).json({ msg: "User does not exist" })
        }
        if (!friend.followers.includes(userId)) { // Check if userId is not already in followers
            friend.followers.push(userId);
            await friend.save();

            const notification = new Notification({
                type: "follow",
                user: friend._id,
                friend: userId,
                content: 'Started Following You'
            })
            await notification.save();
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(400).json({ msg: "User does not exist" })
        }
        if (!currentUser.following.includes(userIdToFollow)) { // Check if userIdToFollow is not already in following
            currentUser.following.push(userIdToFollow);
            await currentUser.save();
        }
        res.status(200).json(currentUser);
    } catch (error) {
        res.status(500).json(error)
    }
}


export const unFollowTheUser = async (req, res) => {


    try {
        const { userId, userIdToUnFollow } = req.body;
        const user = await User.findById(userIdToUnFollow);
        if (!user) {
            return res.status(400).json({ msg: "User does not exist" })
        }
        if (user.followers.includes(userId)) { // Check if userId is already in followers
            const index = user.followers.indexOf(userId);
            user.followers.splice(index, 1); // Remove it from the array
            await user.save();
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(400).json({ msg: "User does not exist" })
        }
        if (currentUser.following.includes(userIdToUnFollow)) { // Check if userIdToUnFollow is already in following
            const index = currentUser.following.indexOf(userIdToUnFollow);
            currentUser.following.splice(index, 1); // Remove it from the array
            await currentUser.save();
        }
        res.status(200).json(currentUser);
    } catch (error) {
        res.status(500).json(error)
    }
}



export const getNotifications = async (req, res)=>{
    try {
        const { id } = req.user;
        const notifiactions = await Notification.find({ user: id })
            .populate('friend', 'username profilePic')
            .populate('postId', 'image')
            .sort({ createdAt: -1 })
            .exec();
        res.status(200).json(notifiactions);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
}



