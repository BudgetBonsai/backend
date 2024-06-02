// Import necessary Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDPFz9k-SxQH2DApVjTdQ-WtB15fmd4rH4",
    authDomain: "capstone-424513.firebaseapp.com",
    projectId: "capstone-424513",
};

const initFirebase = () => {
    const firebaseApp = initializeApp(firebaseConfig);
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    const googleProvider = new GoogleAuthProvider();

    return { auth, firestore, googleProvider };
};

export const register = async (request, h) => {
    const { email, password, name } = request.payload;
    const { auth, firestore } = initFirebase();

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userData = { // Store only non-sensitive user data (replace with desired fields)
            uid: userCredential.user.uid,
            email: email,
            name: name
        };

        const userRef = await addDoc(collection(firestore, 'users'), userData);
        userData.id = userRef.id; // Add generated document ID to user data (optional)

        return h.response({ message: 'Registration successful', data: userData }).code(201);
    } catch (error) {
        console.error(error);
        return h.response({ message: 'Registration failed' }).code(400);
    }
};

export const loginGoogle = async (request, h) => {
    const { auth, googleProvider } = initFirebase();

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const userCredential = result;
        const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName
        };

        // You can potentially check for existing user in Firestore based on UID and handle accordingly
        // (e.g., retrieve additional user data or create a new user document if it doesn't exist)

        return h.response({ message: 'Login successful', data: userData }).code(200);
    } catch (error) {
        console.error(error);
        return h.response({ message: 'Login failed' }).code(401);
    }
};

export const loginEmail = async (request, h) => {
    const { email, password } = request.payload;
    const { auth } = initFirebase();

    if (email && password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userData = {
                uid: userCredential.user.uid,
                email: email
            };

            return h.response({ message: 'Login successful', data: userData }).code(200);
        } catch (error) {
            console.error(error);
            return h.response({ message: 'Login failed' }).code(401);
        }
    } else {
        // Handle missing email or password for email/password login
        return h.response({ message: 'Please provide email and password' }).code(400);
    }
};