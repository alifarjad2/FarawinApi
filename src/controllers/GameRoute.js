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

const fileName = "users.json";

router.route("/user/jsonDelete").get(
  ErrorHandler((req, res, next) => {
    // #swagger.ignore = true

    writeFile(fileName, "[]");
    return res.status(200).json({
      code: "200",
      message: "DELETED!",
    });
  })
);

const Game = {}

router.route("/game").post(
  ErrorHandler(async (req, res, next) => {
    
    const char = req.body;
    if(char && char.state) Game.char = char;

    return res.status(200).json({
      code: "200",
      message: "با موفقیت افزوده شد.",
      char: Game.char,
    });
  })
);


module.exports = router;
