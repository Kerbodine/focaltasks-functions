const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true });
admin.initializeApp();
const welcomeEmail = require("./welcome");
const betaEmail = require("./beta");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: `${process.env.EMAIL}`,
    pass: `${process.env.PASSWORD}`,
  },
});

const db = admin.firestore();

exports.sendMail = functions.firestore
  .document("Users/{userId}")
  .onCreate((snap, context) => {
    const user = snap.data();
    const mailOptions = {
      from: `FocalTasks <${process.env.EMAIL}>`,
      to: user.email,
      subject: "Welcome to FocalTasks!", // email subject
      html: welcomeEmail
        .replace(
          "{unsubscribe}",
          `https://us-central1-focaltimer-dev.cloudfunctions.net/unsubscribe?email=${user.email}`
        )
        .replace("{name}", `${user.displayName.split(" ")[0]}`),
    };

    const userRef = db.doc(`EmailUsers/${user.email}`);

    userRef.set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      unsubscribed: false,
    });

    return transporter.sendMail(mailOptions, (erro, info) => {
      if (erro) {
        return res.send(erro.toString());
      }
      return res.send("Sent");
    });
  });

exports.unsubscribe = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { email } = req.query.email;
    const userRef = db.doc(`EmailUsers/${email}`);
    userRef.update({
      unsubscribed: true,
    });
    res.send("Unsubscribed");
  });
});

exports.sendBeta = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { email } = req.query;
    const mailOptions = {
      from: `FocalTasks <${process.env.EMAIL}>`,
      to: email,
      subject: "Welcome to the FocalTasks beta program!", // email subject
      html: betaEmail.replace(
        "{unsubscribe}",
        `https://us-central1-focaltimer-dev.cloudfunctions.net/unsubscribe?email=${email}`
      ),
    };

    return transporter.sendMail(mailOptions, (erro, info) => {
      if (erro) {
        return res.send(erro.toString());
      }
      return res.send("Sent");
    });
  });
});
