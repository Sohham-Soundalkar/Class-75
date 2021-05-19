import * as firebase from 'firebase';
require('@firebase/firestore')

var firebaseConfig = {
    apiKey: "AIzaSyCXY_s72wBNDWnz8teLWZ3viTyHiArI7zc",
    authDomain: "wireless-library-1a439.firebaseapp.com",
    projectId: "wireless-library-1a439",
    storageBucket: "wireless-library-1a439.appspot.com",
    messagingSenderId: "543695612666",
    appId: "1:543695612666:web:59706b29a03f6a55ae7743"
  };

firebase.initializeApp(firebaseConfig);

export default firebase.firestore()