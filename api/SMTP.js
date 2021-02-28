// SMTP Server
const SMTPServer = require("smtp-server").SMTPServer;
const server = new SMTPServer();

server.on("error", err => {
  console.log("Error %s", err.message);
});

server.listen(465);