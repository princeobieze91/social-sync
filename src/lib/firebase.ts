import { initializeApp } from "firebase/app";
import { getAuth, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBM2h31HAGJ9RZ3R5O_4VvegM-G6CikCRw",
  authDomain: "socialsync-500708.firebaseapp.com",
  projectId: "socialsync-500708",
  storageBucket: "socialsync-500708.firebasestorage.app",
  messagingSenderId: "521869218651",
  appId: "1:521869218651:web:6b65ecb3691857039c807e",
  measurementId: "G-XSN9142X1E",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope("pages_show_list");
facebookProvider.addScope("pages_read_engagement");
facebookProvider.addScope("instagram_basic");
facebookProvider.addScope("instagram_content_publish");
