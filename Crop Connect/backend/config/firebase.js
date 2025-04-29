// backend/config/firebase.js
const admin = require('firebase-admin');
let serviceAccount;

// Check if Firebase is already initialized to avoid duplicate initialization
let firebaseApp;
try {
  firebaseApp = admin.app();
  console.log('Firebase app already initialized, reusing existing instance');
} catch (error) {
  // Firebase is not initialized yet, continue with initialization
  console.log('Initializing Firebase for the first time');
}

// If Firebase is already initialized, just export the existing services
if (firebaseApp) {
  const db = admin.firestore();
  const auth = admin.auth();
  const storage = admin.storage().bucket();
  
  module.exports = { admin, db, auth, storage };
} else {
  // First-time initialization process
  try {
    // First try to load from a provided service account file
    serviceAccount = require('../serviceAccountKey.json');
  } catch (error) {
    console.warn('Service account key file not found, using environment variables...');
    
    // If file not found, try to use environment variables
    // You can set these environment variables in your .env file
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_PRIVATE_KEY && 
        process.env.FIREBASE_CLIENT_EMAIL) {
      
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      };
    } else {
      // For development/demo purposes, you can use a placeholder
      console.warn('No Firebase credentials found. Using development mode with in-memory database.');
      
      // The app will work with in-memory database instead of Firestore
      const inMemoryDB = require('./db').inMemoryDB;
      
      // Provide mock Firebase functions
      module.exports = {
        admin: {
          firestore: {
            FieldValue: {
              serverTimestamp: () => new Date()
            }
          }
        },
        db: {
          collection: (collectionName) => {
            return {
              doc: (id) => {
                return {
                  set: (data) => {
                    let collection;
                    if (collectionName === 'users') collection = inMemoryDB.users;
                    else if (collectionName === 'crops') collection = inMemoryDB.crops;
                    else if (collectionName === 'orders') collection = inMemoryDB.orders;
                    else collection = [];
                    
                    const item = { ...data, id };
                    collection.push(item);
                    return Promise.resolve(item);
                  },
                  get: () => {
                    let collection;
                    if (collectionName === 'users') collection = inMemoryDB.users;
                    else if (collectionName === 'crops') collection = inMemoryDB.crops;
                    else if (collectionName === 'orders') collection = inMemoryDB.orders;
                    else collection = [];
                    
                    const item = collection.find(item => item.id === id);
                    return Promise.resolve({
                      exists: !!item,
                      data: () => item
                    });
                  },
                  update: (data) => {
                    let collection;
                    if (collectionName === 'users') collection = inMemoryDB.users;
                    else if (collectionName === 'crops') collection = inMemoryDB.crops;
                    else if (collectionName === 'orders') collection = inMemoryDB.orders;
                    else collection = [];
                    
                    const index = collection.findIndex(item => item.id === id);
                    if (index !== -1) {
                      collection[index] = { ...collection[index], ...data };
                    }
                    return Promise.resolve();
                  },
                  delete: () => {
                    let collection;
                    if (collectionName === 'users') collection = inMemoryDB.users;
                    else if (collectionName === 'crops') collection = inMemoryDB.crops;
                    else if (collectionName === 'orders') collection = inMemoryDB.orders;
                    else collection = [];
                    
                    const index = collection.findIndex(item => item.id === id);
                    if (index !== -1) {
                      collection.splice(index, 1);
                    }
                    return Promise.resolve();
                  }
                };
              },
              where: () => {
                return {
                  get: () => {
                    let collection;
                    if (collectionName === 'users') collection = inMemoryDB.users;
                    else if (collectionName === 'crops') collection = inMemoryDB.crops;
                    else if (collectionName === 'orders') collection = inMemoryDB.orders;
                    else collection = [];
                    
                    return Promise.resolve({
                      forEach: (callback) => {
                        collection.forEach(item => {
                          callback({
                            data: () => item,
                            id: item.id
                          });
                        });
                      }
                    });
                  },
                  orderBy: () => {
                    return {
                      get: () => {
                        let collection;
                        if (collectionName === 'users') collection = inMemoryDB.users;
                        else if (collectionName === 'crops') collection = inMemoryDB.crops;
                        else if (collectionName === 'orders') collection = inMemoryDB.orders;
                        else collection = [];
                        
                        return Promise.resolve({
                          forEach: (callback) => {
                            collection.forEach(item => {
                              callback({
                                data: () => item,
                                id: item.id
                              });
                            });
                          }
                        });
                      }
                    };
                  }
                };
              },
              get: () => {
                let collection;
                if (collectionName === 'users') collection = inMemoryDB.users;
                else if (collectionName === 'crops') collection = inMemoryDB.crops;
                else if (collectionName === 'orders') collection = inMemoryDB.orders;
                else collection = [];
                
                return Promise.resolve({
                  forEach: (callback) => {
                    collection.forEach(item => {
                      callback({
                        data: () => item,
                        id: item.id
                      });
                    });
                  }
                });
              }
            };
          },
          runTransaction: async (callback) => {
            // Simple mock for transactions
            await callback({
              get: async (ref) => {
                return await ref.get();
              },
              update: async (ref, data) => {
                return await ref.update(data);
              },
              set: async (ref, data) => {
                return await ref.set(data);
              }
            });
            return Promise.resolve();
          }
        },
        auth: {
          createUser: ({ email, password, displayName }) => {
            const user = {
              uid: Date.now().toString(),
              email,
              displayName
            };
            inMemoryDB.users.push(user);
            return Promise.resolve(user);
          },
          getUserByEmail: (email) => {
            const user = inMemoryDB.users.find(u => u.email === email);
            if (!user) {
              const error = new Error('User not found');
              error.code = 'auth/user-not-found';
              return Promise.reject(error);
            }
            return Promise.resolve(user);
          },
          setCustomUserClaims: () => Promise.resolve(),
          createCustomToken: () => Promise.resolve('mock-token'),
          verifyIdToken: () => Promise.resolve({ uid: 'mock-uid' })
        },
        storage: {
          bucket: () => ({
            file: () => ({
              createWriteStream: () => ({
                on: () => {},
                end: () => {}
              }),
              makePublic: () => Promise.resolve(),
              delete: () => Promise.resolve()
            })
          })
        }
      };
      
      return; // Exit early
    }
  }

  // Initialize Firebase Admin if we have credentials
  try {
    // Only initialize if not already initialized
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "cropconnect.appspot.com"
    }, 'cropconnect-app'); // Add a name to the app
    
    console.log('Firebase Admin SDK initialized successfully');
    
    const db = admin.firestore();
    const auth = admin.auth();
    const storage = admin.storage().bucket();
    
    module.exports = { admin, db, auth, storage };
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    
    // Provide a fallback with empty mock implementations
    module.exports = {
      admin: {
        firestore: {
          FieldValue: {
            serverTimestamp: () => new Date()
          }
        }
      },
      db: {},
      auth: {},
      storage: {}
    };
  }
}