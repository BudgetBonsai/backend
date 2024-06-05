import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, getDoc, query, where, collection, Timestamp, getDocs, addDoc } from 'firebase/firestore';
import admin from 'firebase-admin';
import serviceAccount from '../../firebase.json' assert { type: 'json' }; // Adjust the path to your service account JSON file
// // Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://capstone-424513.firebaseio.com" // Adjust the databaseURL if necessary
});
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

export const verifyToken = async (request, h) => {
    const idToken = request.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return h.response({ error: true, message: 'Authorization token not provided' }).code(401);
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        request.user = decodedToken;
        return h.continue;
    } catch (error) {
        console.error('Token verification error:', error);
        return h.response({ error: true, message: 'Invalid or expired token' }).code(401);
    }
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
            return h.response({ error: true, message: 'Registration failed, ' + error.message}).code(400);
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
            return h.response({ error: true, message: 'Login failed ' + error.message }).code(401);
        }
    } else {
        // Handle missing email or password for email/password login
        return h.response({ error: true, message: 'Please provide email and password' }).code(400);
    }
};

export const addTransaction = async (request, h) => {
    const { date, name, amount, category, type } = request.payload;
    const { firestore } = initFirebase();

    // Validate input fields
    if (!date || !name || !amount || !category) {
        return h.response({ 
            error: true, 
            message: 'All fields (date, name, amount, category, type) are required.' 
        }).code(400);
    }

    try {
        // Get the currently signed-in user
        const user = request.user;
        if (!user) {
            return h.response({ error: true, message: 'User is not authenticated' }).code(401);
        }

        // Create a new expense object
        const transactionData = {
            date: Timestamp.fromDate(new Date(date)),  // Store date as Firestore Timestamp
            name: name.trim(),
            amount: parseFloat(amount),
            category: category.trim(),
            type: type.trim(),
            userId: user.uid,
        };

        // Add the expense to Firestore under the user's expenses collection
        const transactionRef = collection(firestore, 'users', user.uid, 'transaction');
        const transactionDoc = await addDoc(transactionRef, transactionData);

        return h.response({
            error: false,
            message: 'Transaction added successfully',
            data: { id: transactionDoc.id, ...transactionData }
        }).code(201);
    } catch (error) {
        console.error(error);
        return h.response({ error: true, message: 'Failed to add transaction '+ error.message }).code(500);
    }
};

export const getTransaction = async (request, h) => {
    const { firestore } = initFirebase();

    try {
        // Get the currently signed-in user
        const user = request.user;
        if (!user) {
            return h.response({ error: true, message: 'User is not authenticated' }).code(401);
        }

        // Query expenses collection for the user
        const transactionRef = collection(firestore, 'users', user.uid, 'transaction');
        const q = query(transactionRef);

        const querySnapshot = await getDocs(q);
        const transaction = [];

        querySnapshot.forEach((doc) => {
            transaction.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return h.response({
            error: false,
            message: 'transaction retrieved successfully',
            data: transaction
        }).code(200);
    } catch (error) {
        console.error(error);
        return h.response({ error: true, message: 'Failed to get trasaction' + error.message }).code(500);
    }
};