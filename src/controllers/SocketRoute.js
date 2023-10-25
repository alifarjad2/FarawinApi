const express = require("express");

const router = express.Router();

const {
  authenticate,
  getContact,
  sendToEita,
  writeFile,
  readFile,
  ErrorHandler,
} = require("../middlewares/auth");

router.ws("/ws/:token", function (ws, req) {
  /* 
    #swagger.tags = ['WebSocket']
    #swagger.summary = 'سوکت'
   */

  let username = "";
  try {
    const userToken = JSON.parse(decodeURIComponent(atob(req.params.token)));
    username = userToken?.username;
  } catch (e) {}
  if (!username) {
    ws.terminate();
    return;
  }

  ws.username = username;
  // ws.on("message", function (msg) {
  //   // console.log(Array.from(wsInstance.getWss().clients).map((i) => i.test));
  //   console.log(msg + "\n" + ws.username);
  //   ws.send(msg + "\n" + ws.username);
  // });
});

module.exports = router;
