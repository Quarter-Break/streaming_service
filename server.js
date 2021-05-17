/* 
    CRUD tutorial: https://medium.com/@nmayurashok/crud-app-using-node-js-express-mongodb-61529ce12fba
    Streaming audio: https://medium.com/@richard534/uploading-streaming-audio-using-nodejs-express-mongodb-gridfs-b031a0bcb20f
    Node.js streams: https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93/
*/

/**
 * NPM Module dependencies.
 */
const express = require('express');
const trackRoute = express.Router();
const multer = require('multer');
const cors = require('cors');

const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

/**
 * NodeJS Module dependencies.
 */
const { Readable } = require('stream');

/**
 * Create Express server && Express Router configuration.
 */
const app = express();
app.use('/api/track', trackRoute, cors()); // Enable cors

/**
* Connect Mongo Driver to MongoDB.
*/
require('dotenv').config({ path: '.env' });

let db;
MongoClient.connect(process.env.DATABASE, {
    useUnifiedTopology: true
}, (err, database) => {
    if (err) {
        console.log('MongoDB Connection Error. ' + err.message);
        process.exit(1);
    }
    console.log(process.env.DATABASE);
    console.log('Connected...');
    db = database.db('qb_track_db');
});

/**
 * GET /api/track/:trackID
 */
trackRoute.get('/:trackID', (req, res) => {
    try {
        var trackID = new ObjectID(req.params.trackID);
    } catch (err) {
        return res.status(400).json({ message: "Invalid trackID in URL parameter. Must be a single String of 12 bytes or a string of 24 hex characters" });
    }
    res.set('content-type', 'audio/mp3');
    res.set('accept-ranges', 'bytes');

    let bucket = new mongodb.GridFSBucket(db, {
        bucketName: 'tracks'
    });

    let downloadStream = bucket.openDownloadStream(trackID);

    /* 
        Listener functions:
    */

    // Emitted each time a chunk is available.
    downloadStream.on('data', (chunk) => {
        res.write(chunk);
    });

    // Called in case of error. Should be parsed properly.
    downloadStream.on('error', () => {
        res.sendStatus(404);
    });

    // Called when stream runs out of data.
    downloadStream.on('end', () => {
        res.end();
    });
});

/**
 * POST /api/track
 */
trackRoute.post('/', (req, res) => {
    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage, limits: { fields: 1, fileSize: 100000000, files: 1, parts: 2 } }); // Max filesize 100mb

    upload.single('track')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: "Upload Request Validation Failed" });
        } else if (!req.body.name) {
            return res.status(400).json({ message: "No track name in request body" });
        }

        let trackName = req.body.name;

        // Covert buffer to Readable Stream
        const readableTrackStream = new Readable();
        readableTrackStream.push(req.file.buffer);
        readableTrackStream.push(null);

        let bucket = new mongodb.GridFSBucket(db, {
            bucketName: 'tracks'
        });

        let uploadStream = bucket.openUploadStream(trackName);
        let id = uploadStream.id;
        readableTrackStream.pipe(uploadStream);

        uploadStream.on('error', () => {
            return res.status(500).json({ message: "Error uploading file" });
        });

        uploadStream.on('finish', () => {
            return res.status(201).json({ message: "File uploaded successfully, stored under Mongo ObjectID: " + id });
        });
    });
});

// start server on port 4343
const server = app.listen(4343, () => {
    console.log(`Express running -> PORT ${server.address().port}`);
})