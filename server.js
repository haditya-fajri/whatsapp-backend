//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
app.disable("x-powered-by");
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1101352",
  key: "75a85298d6c204acde75",
  secret: "4cb06c26ef00381eb745",
  cluster: "ap1",
  useTLS: true,
});

//middleware
app.use(express.json());
app.use(cors());

// DB Config
const connection_string =
  "mongodb+srv://admin:2V6yjBALSXERzlQL@cluster0.n87xu.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_string, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => {
  console.log("DB Connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

// ???

// api routes
app.get("/", (req, res) => res.status(200).send("Hello world"));

app.get("/api/v1/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(data);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/api/v1/messages/new", (req, res) => {
  const dbMessages = req.body;

  Messages.create(dbMessages, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

//listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
