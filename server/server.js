require('dotenv').config();
const mongoose = require("mongoose")
const Document = require("./document")

const defaultValue = "";

mongoose.connect('mongodb+srv://'+ process.env.DBUSERNAME +':'+ process.env.DBPASSWORD +'@cluster0.bccral0.mongodb.net/documentDB', (err)=>{
    if(err){
        console.log(err);
    }
    else{
        console.log("Database connected successfully");
    }
});

async function findOrCreateDoc(docID){
    if(docID == null) return;
    
    const document = await Document.findById(docID);

    if (document) return document;

    return await Document.create({ _id: docID, data: defaultValue})
}

const io = require("socket.io")(3001, {
    cors: {
        origin : "http://localhost:3000",
        methods : ["GET", "POST"],
    }
})

io.on("connection", socket => {
    socket.on("request-document", async docID => {

        // find if present else create new
        const document = await findOrCreateDoc(docID);

        // add the client to a room ( with document id as room id )
        socket.join(docID);

        // send the found document or new document
        socket.emit("load-document", document.data);

        // send the changes to all clients accessing the same document.
        socket.on("send-changes", delta => {
            // console.log(delta);
            socket.broadcast.to(docID).emit("receive-changes", delta);
        })

        // update database
        socket.on("save-document", async document => {
            await Document.findByIdAndUpdate(docID,  { data : document })
        })
    })
    // console.log('connected');
})



