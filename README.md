# 🎬 MovieVault

MovieVault is a movie management web application that allows users to securely manage their movie collections.

## 📌 Project Overview

MovieVault provides a platform to manage movie information with secure authentication, database storage, and movie poster uploads.

## ✨ Features

- 🔐 **Login and Signup:** Secure user authentication using Auth0.
- 🎥 **Add Movies:** Add movie details such as title, genre, and release year.
- 📋 **View Movies:** Display stored movie information.
- 🔍 **Search Movies:** Search for movies in the collection.
- ✏️ **Manage Movies:** Manage existing movie records.
- 🗄️ **Database Storage:** MongoDB Atlas stores movie details and poster URLs.
- 🖼️ **Poster Upload:** Dropbox API is used specifically to upload and store movie poster images and generate links for displaying them.
- 🌐 **Frontend Hosting:** Firebase Hosting is used to deploy the frontend.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | Server runtime |
| Express.js | Backend and API handling |
| MongoDB Atlas | Movie data storage |
| Auth0 | Login and signup authentication |
| Dropbox API | Movie poster uploads |
| Axios | HTTP requests |
| Multer | File upload handling |
| HTML, CSS, JavaScript | Frontend |

## 📋 Prerequisites

- Node.js and npm
- MongoDB Atlas account
- Auth0 account
- Dropbox account and API configuration

## 🚀 Installation and Setup

### Step 1: Clone the repository

```bash
git clone https://github.com/sweshree11-dotcom/MovieVault.git
cd MovieVault
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Configure environment variables

Create a `.env` file in the project root and configure the MongoDB, Auth0, and Dropbox credentials using the exact variable names required by `server.js`.

**Important:** Never upload your `.env` file or private API credentials to GitHub.

### Step 4: Start the application

```bash
npm start
```

Open the local application in your browser using the port configured in `server.js` (for example, `http://localhost:3000`).

## 📁 Project Structure

```text
MovieVault/
│
├── public/
│   ├── index.html
│   └── 404.html
│
├── server.js
├── package.json
├── package-lock.json
├── firebase.json
├── .firebaserc
├── .gitignore
└── README.md
```

## 🔒 Security

- Keep API credentials in environment variables.
- Do not upload `.env` to GitHub.
- Use secure authentication through Auth0.
- Protect database credentials and access permissions.

## 📄 License

This project specifies the ISC License in `package.json`.

## 👩‍💻 Author

GitHub: [sweshree11-dotcom](https://github.com/sweshree11-dotcom)

## 🔗 Project Repository

[MovieVault – GitHub](https://github.com/sweshree11-dotcom/MovieVault)
