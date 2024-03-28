import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from 'firebase-admin';
import serviceAccountKey from './medium-clone-1-firebase-adminsdk-eigtq-d5667abee3.json' assert { type: 'json' };
import User from './Schema/User.js';
import { getAuth } from 'firebase-admin/auth';
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'; // Updated AWS SDK v3 imports
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

// Connect to MongoDB
mongoose.connect(process.env.DB_LOCATION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true,
});

// Initialize S3 client with region, accessKeyId, and secretAccessKey
const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY1,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// async function getObjectURL(key) {
//   const command = new GetObjectCommand({
//     Bucket: 'kishanrokk',
//     Key: key,
//   });
//   const uploadURL = await getSignedUrl(s3Client, command, {
//     expiresIn: 3600,
//   });

//   return uploadURL;
// }
// function iniit() {
//   console.log('url', getObjectURL);
// }
// iniit();

async function putObjectURL() {
  const imgName = `${nanoid()}-${Date.now()}.jpeg`;
  const command = new PutObjectCommand({
    Bucket: 'kishanrokk',
    Key: imgName,
    ContentType: 'image/jpeg',
  });
  const uploadURL = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  });

  return uploadURL;
}
// Middleware
server.use(express.json());
server.use(cors());

// Regex patterns
const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

// Utility function to generate unique username
const generateUsername = async (email) => {
  let username = email.split('@')[0];
  const isUsernameNotUnique = await User.exists({
    'personal_info.username': username,
  });
  if (isUsernameNotUnique) {
    username += nanoid().substring(0, 5);
  }
  return username;
};

// Format user data for sending in response
const formatUserDatatoSend = (user) => {
  const access_token = jwt.sign(
    { id: user._id },
    process.env.SECREAT_ACCESS_KEY
  );
  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
};

server.get('/get-upload-url', (req, res) => {
  putObjectURL()
    .then((url) => res.status(200).json({ uploadURL: url }))
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

// Signup route
server.post('/signup', async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Validate input data
    if (fullname.length < 3) {
      return res
        .status(403)
        .json({ error: 'Fullname must be at least 3 letters long' });
    }
    if (!email.length || !emailRegex.test(email)) {
      return res.status(403).json({ error: 'Enter a valid Email' });
    }
    if (!passwordRegex.test(password)) {
      return res.status(403).json({
        error:
          'Password should be 6 to 20 characters long with at least one numeric, one lowercase, and one uppercase letter',
      });
    }

    // Hash password and create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = await generateUsername(email);
    const newUser = new User({
      personal_info: { fullname, email, password: hashedPassword, username },
    });
    await newUser.save();

    res.status(200).json(formatUserDatatoSend(newUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Signin route
server.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ 'personal_info.email': email });
    if (!user) {
      return res.status(403).json({ error: 'Email not found' });
    }

    if (!user.google_auth) {
      // Compare passwords
      const isPasswordValid = await bcrypt.compare(
        password,
        user.personal_info.password
      );
      if (!isPasswordValid) {
        return res.status(403).json({ error: 'Incorrect password' });
      }
      res.status(200).json(formatUserDatatoSend(user));
    } else {
      return res.status(403).json({
        error: 'Account was created using Google. Try Login with Google. ',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Google authentication route
server.post('/google-auth', async (req, res) => {
  try {
    const { access_token } = req.body;

    // Verify the access token and decode user data
    const decodedUser = await getAuth().verifyIdToken(access_token);
    const { email, name, picture } = decodedUser;
    const updatedPicture = picture.replace('s96-c', 's384-c');

    // Check if the user exists in the database
    let user = await User.findOne({ 'personal_info.email': email }).select(
      'personal_info.fullname personal_info.username personal_info.profile_img google_auth'
    );

    if (!user) {
      // User does not exist, perform signup
      const username = await generateUsername(email);
      user = new User({
        personal_info: {
          fullname: name,
          email,
          profile_img: updatedPicture,
          username,
        },
        google_auth: true,
      });
      user = await user.save();
    } else if (!user.google_auth) {
      // User exists but has not signed up with Google
      return res.status(403).json({
        error:
          'This email was signed up without Google. Please log in with a password to access the account.',
      });
    }

    // Update the user's profile image URL if it's different from the Google-provided URL
    if (user.personal_info.profile_img !== updatedPicture) {
      user.personal_info.profile_img = updatedPicture;
      await user.save();
    }

    return res.status(200).json(formatUserDatatoSend(user));
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        'Failed to authenticate with Google. Try logging in with a different Google account.',
    });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
