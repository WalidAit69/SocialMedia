import Post from "../models/Post.js";
import User from "../models/User.js";
import fs from "fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/* Upload to aws */
async function uploadToS3(newpath, originalFilename, mimetype) {
  const client = new S3Client({
    region: "eu-west-3",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });

  const ext = originalFilename.split(".")[1];
  const newFilename = Date.now() + "." + ext;

  try {
    const data = await client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKETNAME,
        Body: fs.readFileSync(newpath),
        Key: newFilename,
        ContentType: mimetype,
        ACL: "public-read",
      })
    );

    return `https://${process.env.BUCKETNAME}.s3.amazonaws.com/${newFilename}`;
  } catch (error) {
    console.log("Error adding photo");
  }
}

/* CREATE */
export const createPost = async (req, res) => {
  // let newpath = null;
  // let url = null;
  try {
    let url = null;
    if (req.file) {
      const { path, originalname, mimetype } = req.file;
      const newpath = path.replace(/\\/g, "/");
      url = await uploadToS3(newpath, originalname, mimetype);
    }

    const { userId, description, picturePath } = req.body;
    const user = await User.findById(userId);
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath: url,
      likes: {},
      comments: [],
    });
    await newPost.save();

    const post = await Post.find();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const post = await Post.find();
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const post = await Post.find({ userId });
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json({ updatedPost, likedposts: user.likedposts });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
