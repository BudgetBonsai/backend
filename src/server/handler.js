// Import necessary Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore,setDoc, doc, getDoc } from 'firebase/firestore';

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
    const db = getFirestore(firebaseApp);
    return { auth, firestore, googleProvider, db };
};

export const register = async (request, h) => {
    const { email, password, name } = request.payload;
    const { auth, firestore } = initFirebase();

    // Validate the name field
    if (!name || name.trim().length < 3) {
        return h.response({ 
            error: true, 
            message: 'Invalid name. Please provide a name with at least 3 characters.' 
        }).code(400);
    }

    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        const userData = {
            uid: userId,
            email: email,
            name: name.trim()
        };

        // Set the document with UID as the document ID
        const userRef = doc(firestore, 'users', userId);
        await setDoc(userRef, userData);

        return h.response({ error: false, message: 'Registration successful', data: userData }).code(201);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            return h.response({ error: true, message: 'Email is already in use. Please use a different email.' }).code(400);
        } else {
            console.error(error);
            return h.response({ error: true, message: 'Registration failed', error: error.message }).code(400);
        }
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

        // Generate Firebase ID token
        const idToken = await auth.currentUser.getIdToken();

        return h.response({
            error: false,
            message: 'Login successful',
            data: {
                ...userData,
                token: idToken  // Include the ID token in the response
            }
        }).code(200);
    } catch (error) {
        console.error(error);
        return h.response({ error: true, message: 'Login failed' }).code(401);
    }
};


export const loginEmail = async (request, h) => {
    const { email, password } = request.payload;
    const { auth, db } = initFirebase();

    if (email && password) {
        try {
            // Sign in with email and password
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;
            const userData = {
                uid: userId,
                email: email
            };

            // Generate Firebase ID token
            const idToken = await auth.currentUser.getIdToken();

            // Reference the user document in Firestore using UID
            const userRef = doc(db, 'users', userId);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                console.log('No such document!');
                return h.response({ error: true, message: 'No such document!' }).code(404);
            } else {
                const userDoc = docSnap.data();
                console.log('Document data:', userDoc);

                // Retrieve the 'name' field from the document
                const name = userDoc.name;

                // Include the 'name' field and token in the JSON response
                return h.response({
                    error: false,
                    message: 'Login successful',
                    data: { 
                        ...userData,
                        name,
                        token : idToken
                    }
                }).code(200);
            }
        } catch (error) {
            console.error(error);
            return h.response({ error: true, message: 'Login failed', error: error.message }).code(401);
        }
    } else {
        // Handle missing email or password for email/password login
        return h.response({ error: true, message: 'Please provide email and password' }).code(400);
    }
};
