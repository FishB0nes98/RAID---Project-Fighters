// Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyCqhxq6sPDU3EmuvvkBIIDJ-H6PsBc42Jg", // Replace with your actual API key if different
    authDomain: "project-fighters-by-fishb0nes.firebaseapp.com",
    databaseURL: "https://project-fighters-by-fishb0nes-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "project-fighters-by-fishb0nes",
    storageBucket: "project-fighters-by-fishb0nes.appspot.com",
    messagingSenderId: "867339299995",
    appId: "1:867339299995:web:99c379940014b9c05cea3e",
    measurementId: "G-LNEM6HR842"
};

// Initialize Firebase only if it hasn't been initialized yet
let firebaseApp;
let firebaseAuth;
let firebaseDatabase;

try {
    if (!firebase.apps.length) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully.");
    } else {
        firebaseApp = firebase.app(); // if already initialized, use that instance
        console.log("Firebase already initialized.");
    }
    firebaseAuth = firebase.auth();
    firebaseDatabase = firebase.database();
} catch (error) {
    console.error("Error initializing Firebase:", error);
    // Display error to the user maybe?
    alert("Could not connect to game services. Please check your internet connection and try again.");
}

// Helper function to get current user UID
function getCurrentUserId() {
    return firebaseAuth.currentUser ? firebaseAuth.currentUser.uid : null;
}

// Helper function to check if user is logged in
function isUserLoggedIn() {
    return !!firebaseAuth.currentUser;
}

// Export to window for global access
window.auth = firebaseAuth;
window.database = firebaseDatabase;
window.firebase = firebase;

// Add a listener for auth state changes for debugging/logging
firebaseAuth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is signed in:", user.uid, user.email);
    } else {
        console.log("User is signed out.");
    }
}); 