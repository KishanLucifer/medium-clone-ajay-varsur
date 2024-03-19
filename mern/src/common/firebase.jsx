// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCYZ49fO89yKwOr0d7FPdR97jegUVxHzBA',
  authDomain: 'medium-clone-1.firebaseapp.com',
  projectId: 'medium-clone-1',
  storageBucket: 'medium-clone-1.appspot.com',
  messagingSenderId: '223197879793',
  appId: '1:223197879793:web:cfb22978cc034f6e0c7850',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Google auth
const provider = new GoogleAuthProvider();
const auth = getAuth();
export const authWithGoogle = async () => {
  let user = null;
  await signInWithPopup(auth, provider)
    .then((result) => {
      user = result.user;
    })
    .catch((err) => {
      console.log(err);
    });
  return user;
};
