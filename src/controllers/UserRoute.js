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

router.route("/user").post(
  ErrorHandler(async (req, res, next) => {
    /* 
    #swagger.tags = ['User']
    #swagger.summary = 'ثبت نام'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'نام کاربری که باید شماره موبایل باشد و رمز عبور حداقل 8 کرکتر و نام و نام‌خانوداگی باید بیش از ۳ کرکتر باشد. ',
        required: true,
        type: 'json',
        schema: {
                    username: '09000000000',
                    password: 'xxxxxxxx',
                    name: 'xxx',
                }
} */

    const { username, password, name } = req.body;

    if (!username || !password || !name)
      return res.status(400).json({
        code: "400",
        message:
          "پارامتر‌های  ورودی ارسالی ناقص می‌باشند! یک یا چند مورد را فراموش کرده اید. ",
      });

    //TODO REGEX DIGIT
    if (!username.startsWith("09") || username.length != 11)
      return res.status(400).json({
        code: "400",
        message:
          "نام کاربری که باید شماره موبایلی 11 رقمی بوده و با 09 آغاز شود! ",
      });

    if (password.length < 8)
      return res.status(400).json({
        code: "400",
        message: "رمز عبور باید حداقل 8 کرکتر باشد!",
      });

    if (name.length < 3)
      return res.status(400).json({
        code: "400",
        message: " نام و نام‌خانوداگی باید حداقل 3 کرکتر باشد!",
      });

    const userList = await readFile(fileName);
    const findUser = userList.find((u) => u.username === username);
    if (findUser)
      return res.status(409).json({
        code: "409",
        message: "موبایل تکراری است!",
        user: { ...findUser, password: undefined },
      });

    const user = { username, password, name, date: new Date() };
    userList.push(user);
    const result = await writeFile(fileName, userList);
    if (!result)
      return res.status(500).json({
        code: "500",
        message: "خطایی در سمت سرور رخ داده است!",
      });

    sendToEita(
      "Register",
      "#Register" + "\n" + `username: ${user.username}\nname: ${user.name}`
    );

    return res.status(200).json({
      code: "200",
      message: "با موفقیت افزوده شد.",
      user,
    });
  })
);

router.route("/user/login").post(
  ErrorHandler(async (req, res, next) => {
    /* 
    #swagger.tags = ['User']
    #swagger.summary = 'ورود'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'نام کاربری که باید شماره موبایل باشد و رمز عبور حداقل 8 کرکتر',
        required: true,
        type: 'json',
        schema: {
                    username: '09000000000',
                    password: 'xxxxxxxx',
                }
} */

    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({
        code: "400",
        message:
          "پارامتر‌های  ورودی ارسالی ناقص می‌باشند! یک یا چند مورد را فراموش کرده اید. ",
      });

    //TODO REGEX DIGIT
    if (!username.startsWith("09") || username.length != 11)
      return res.status(400).json({
        code: "400",
        message:
          "نام کاربری که باید شماره موبایلی 11 رقمی بوده و با 09 آغاز شود! ",
      });

    if (password.length < 8)
      return res.status(400).json({
        code: "400",
        message: "رمز عبور باید حداقل 8 کرکتر باشد!",
      });

    const userList = await readFile(fileName);
    const findUser = userList.find((u) => u.username === username);

    if (!findUser)
      return res.status(401).json({
        code: "401",
        message: "نام کاربری یا رمز عبور اشتباه می باشد!",
      });

    const user = findUser;

    sendToEita(
      "Login",
      "#Login" + "\n" + `username: ${user.username}\nname: ${user.name}`
    );

    return res.status(200).json({
      code: "200",
      message: user.name + " " + "خوش آمدید.",
      user,
      token: btoa(JSON.stringify(user)),
    });
  })
);

router.route("/user").get(
  ErrorHandler(async (req, res, next) => {
    /*  
     #swagger.tags = ['User']
     #swagger.summary = 'گرفتن تمام کاربران' */

    const userList = await readFile(fileName);

    return res.status(200).json({
      code: "200",
      message: "با موفقیت دریافت شد.",
      userList,
    });
  })
);

module.exports = router;
