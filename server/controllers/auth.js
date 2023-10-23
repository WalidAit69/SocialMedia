import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

/* REGISTER USER */
export const register = async (req, res) => {
  const { path, originalname, mimetype } = req.file;
  const newpath = path.replace(/\\/g, "/");
  const url = await uploadToS3(newpath, originalname, mimetype);

  try {
    const {
      firstName,
      lastName,
      email,
      password,
      picturePath,
      friends,
      location,
      occupation,
    } = req.body;

    const user = await User.findOne({ email: email });
    if (user) return res.status(400).json({ msg: "Email Used" });

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      picturePath:url,
      friends,
      location,
      occupation,
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });
    const savedUser = await newUser.save();
    res.status(201).json({ msg: "register successful", savedUser });
  } catch (err) {
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    delete user.password;
    res.status(200).json({ msg: "login successful", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
