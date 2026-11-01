
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const axios = require("axios");
const { auth } = require("express-openid-connect");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth0 middleware
app.use(
    auth({
        authRequired: false,
        auth0Logout: true,
        secret: process.env.SECRET,
        baseURL: process.env.BASE_URL,
        clientID: process.env.CLIENT_ID,
        issuerBaseURL: process.env.ISSUER_BASE_URL
    })
);

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);
let moviesCollection;

// File upload configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// Helper: require login for protected routes
function requireLogin(req, res, next) {
    if (!req.oidc.isAuthenticated()) {
        return res.status(401).json({
            error: "Please log in to continue",
            loginUrl: "/login"
        });
    }

    next();
}

// Signup
app.get("/signup", (req, res) => {
    res.oidc.login({
        returnTo: "/",
        authorizationParams: {
            screen_hint: "signup"
        }
    });
});

// Profile
app.get("/profile", (req, res) => {
    if (!req.oidc.isAuthenticated()) {
        return res.redirect("/login");
    }

    res.json({
        message: "Login successful!",
        user: req.oidc.user
    });
});

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// GET: retrieve all movies
app.get("/movies", async (req, res) => {
    try {
        const movies = await moviesCollection.find({}).toArray();
        res.json(movies);
    } catch (error) {
        console.error("Error fetching movies:", error.message);
        res.status(500).json({
            error: "Failed to fetch movies"
        });
    }
});

// POST: add a movie (login required)
app.post("/movies", requireLogin, async (req, res) => {
    try {
        const { title, genre, year, rating } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                error: "Movie title is required"
            });
        }

        const movie = {
            title: title.trim(),
            genre: genre || "",
            year: year || "",
            rating: rating || "",
            posterUrl: "",
            createdAt: new Date(),
            createdBy: req.oidc.user.sub
        };

        const result = await moviesCollection.insertOne(movie);

        res.status(201).json({
            message: "Movie added successfully",
            movie: {
                ...movie,
                _id: result.insertedId
            }
        });
    } catch (error) {
        console.error("Error adding movie:", error.message);
        res.status(500).json({
            error: "Failed to add movie"
        });
    }
});

// POST: upload a movie poster to Dropbox (login required)
app.post(
    "/movies/:id/poster",
    requireLogin,
    upload.single("poster"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "Please select a poster image"
                });
            }

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    error: "Invalid movie ID"
                });
            }

            const token = process.env.DROPBOX_ACCESS_TOKEN;

            if (!token) {
                return res.status(500).json({
                    error: "Dropbox access token is missing"
                });
            }

            const movieId = new ObjectId(req.params.id);

            const dropboxPath =
                `/MovieVault/${Date.now()}-${path.basename(req.file.originalname)}`;

            // Upload image to Dropbox
            await axios.post(
                "https://content.dropboxapi.com/2/files/upload",
                req.file.buffer,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Dropbox-API-Arg": JSON.stringify({
                            path: dropboxPath,
                            mode: "add",
                            autorename: true,
                            mute: false
                        }),
                        "Content-Type": "application/octet-stream"
                    }
                }
            );

            // Create a shared link
            let posterUrl;

            try {
                const linkResponse = await axios.post(
                    "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
                    {
                        path: dropboxPath
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                posterUrl = linkResponse.data.url
                    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
                    .replace("?dl=0", "");
            } catch (linkError) {
                if (linkError.response?.status === 409) {
                    const existingLink = await axios.post(
                        "https://api.dropboxapi.com/2/sharing/list_shared_links",
                        {
                            path: dropboxPath,
                            direct_only: true
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    if (existingLink.data.links.length > 0) {
                        posterUrl = existingLink.data.links[0].url
                            .replace(
                                "www.dropbox.com",
                                "dl.dropboxusercontent.com"
                            )
                            .replace("?dl=0", "");
                    } else {
                        throw linkError;
                    }
                } else {
                    throw linkError;
                }
            }

            // Save poster URL in MongoDB
            const updateResult = await moviesCollection.updateOne(
                { _id: movieId },
                { $set: { posterUrl } }
            );

            if (updateResult.matchedCount === 0) {
                return res.status(404).json({
                    error: "Movie not found"
                });
            }

            res.json({
                message: "Poster uploaded successfully",
                posterUrl
            });
        } catch (error) {
            console.error(
                "Poster upload error:",
                error.response?.data || error.message
            );

            res.status(500).json({
                error: "Poster upload failed. Check the server terminal."
            });
        }
    }
);

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.path
    });
});

// Connect to MongoDB and start server
async function startServer() {
    try {
        if (
            !process.env.MONGODB_URI ||
            !process.env.SECRET ||
            !process.env.CLIENT_ID ||
            !process.env.ISSUER_BASE_URL ||
            !process.env.BASE_URL
        ) {
            throw new Error(
                "Missing required .env configuration. Check MongoDB and Auth0 settings."
            );
        }

        await client.connect();

        const db = client.db("MovieVault");
        moviesCollection = db.collection("movies");

        console.log("MongoDB Atlas Connected Successfully!");

        app.listen(PORT, () => {
            console.log(`MovieVault running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Startup error:", error.message);
    }
}

startServer();
