
const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const { MongoClient } = require('mongodb');
require('dotenv').config()

app.use(fileUpload({
    debug: false,
    useTempFiles: true,
    abortOnLimit: true,
    limits: { fileSize: +process.env.MAX_FILE_SIZE_MB * 1024 * 1024 },
    responseOnLimit: `File is too big! ${process.env.MAX_FILE_SIZE_MB} MB max`
}));
var files_collection;

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', process.env.SITE_URL);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');    
    next();
});


app.use(express.static("./static"))
app.get('/:fileId',async function(req, res) {
    const fileId = req.params.fileId
    const file = await files_collection.findOne({
        fileId
    })
    if (!file) return res.send("File doesn't exists")

    res.download(file.dir, file.fileName);
})

app.post('/upload',async function(req, res) {

    if (!req.files || Object.keys(req.files).length === 0 || !req.files.sampleFile) {
        return res.status(400).send('No files were uploaded.');
    }

    const sampleFile = req.files.sampleFile;
    const fileHash = sampleFile.md5
    const fileName = decodeURI(req.headers.filename)
    const uploadPath = __dirname+'/files/' + fileName + "." + fileHash;
    
    const fileId = makeid(6)
    const duplicate = await files_collection.findOne({
        fileName,
        fileHash
    })

    if (duplicate){
        return res.send(duplicate.fileId)
    }
    const duplicateAnotherName = await files_collection.findOne({
        fileHash
    })
    if (duplicateAnotherName){
        await files_collection.insertOne({
            fileName,
            fileHash,
            fileId,
            dir: duplicateAnotherName.dir
        })
        return res.send(fileId)
    }
    await files_collection.insertOne({
        fileName,
        fileHash,
        fileId,
        dir: uploadPath
    })
    console.log("New file",fileName,formatBytes(sampleFile.size))
    sampleFile.mv(uploadPath, function(err) {
        if (err)
            return res.status(500).send(err);

        res.send(fileId);
    });
});


var server = app.listen(3030, function() {
    console.log('Listening on port %d', server.address().port);
});

MongoClient.connect(process.env.MONGO_URL,async function(err, client) {
    if(err) { console.error(err) }
    files_collection = client.db('filesSite').collection('files');
    console.log("Mongo connected")
})

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function formatBytes(bytes, decimals = 0) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}