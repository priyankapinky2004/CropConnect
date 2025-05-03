# CropConnect

**CropConnect** is a web-based platform that directly connects farmers (sellers) with buyers (customers) – eliminating middlemen and ensuring fair pricing, better transparency, and seamless transactions. Built for the BGSIT IGNITEX Hackathon, CropConnect features distinct dashboards for sellers and customers, a real-time cart system, and image upload functionality powered by Firebase.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation and Setup](#installation-and-setup)
- [Usage](#usage)
- [Deployment](#deployment)
- [Future Enhancements](#future-enhancements)
- [Acknowledgments](#acknowledgments)

## Features

- **Seller Dashboard**:
  - Add new products with details (name, description, price, category) and upload images using Firebase Storage.
  - Edit and delete existing products.
  - Product data and image URLs are stored in Firestore under the `products` collection.

- **Customer Dashboard**:
  - Browse products fetched from Firestore.
  - Add products to a personal cart.
  - View detailed product information.

- **Real-time Cart Updates**:
  - The cart uses Firestore’s real-time listener (`onSnapshot`) to sync cart data dynamically.
  - Update item quantities or remove items from the cart with immediate UI feedback.

- **User Authentication (Optional)**:
  - Firebase Authentication to manage login/signup and enforce role-based access control (seller vs. customer).

## Tech Stack

- **Frontend**: 
  - React.js
  - HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend & Database**:
  - Firebase Firestore for real-time database operations
  - Firebase Storage for handling image uploads
  - Firebase Authentication (for managing users and roles)
- **Deployment**:
  - Firebase Hosting (for static assets)

## Installation and Setup

1. Clone the Repository

   ```bash
   git clone https://github.com/priyankapinky2004/CropConnect.git
   cd cropconnect
   ```
2. Install Dependencies

Navigate to the frontend folder (if applicable) and install dependencies:
```
npm install
```
3. Setup Firebase

Create a Firebase project at Firebase Console.

Enable Authentication, Firestore Database, and Storage.

Create a Firebase configuration file (firebase-config.js) in the appropriate directory:

```
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "cropconnect.firebaseapp.com",
  projectId: "cropconnect",
  storageBucket: "cropconnect.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

Feel free to modify the sections to best fit your project's details and any additional features you implement.
