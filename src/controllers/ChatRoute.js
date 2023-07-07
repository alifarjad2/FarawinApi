const express = require("express");

const router = express.Router();
const { convert } = require("html-to-text"); // Import the library

const {
  authenticate,
  getContact,
  sendToEita,
  writeFile,
  readFile,
  ErrorHandler,
} = require("../middlewares/auth");

const fileName = "chats.json";

router.route("/chat/jsonDelete").get(
  ErrorHandler((req, res, next) => {
    // #swagger.ignore = true
    writeFile(fileName, "[]");

    return res.status(200).json({
      code: "200",
      message: "DELETED!",
    });
  })
);

router.route("/chat").post(
  authenticate,
  ErrorHandler(async (req, res, next) => {
    /* 
    #swagger.tags = ['Chat']
    #swagger.summary = 'افزودن پیام'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'نام کاربری که باید شماره موبایل مخاطب باشد و پیام ارسالی که فرمت متن یا اچ تی ام ال. ',
        required: true,
        type: 'json',
        schema: {
                    contactUsername: '09000000000', 
                    textHtml: '',
                }
} */

    const { contactUsername, textHtml } = req.body;
    if (!contactUsername || !textHtml)
      return res.status(400).json({
        code: "400",
        message:
          "پارامتر‌های  ورودی ارسالی ناقص می‌باشند! یک یا چند مورد را فراموش کرده اید. ",
      });

    const user = req.user;
    const username = contactUsername;
    //TODO REGEX DIGIT
    if (
      !username.startsWith("09") ||
      username.length != 11 ||
      !username.match(/^09([0-9]{9})$/)
    )
      return res.status(400).json({
        code: "400",
        message:
          "نام کاربری که باید شماره موبایلی 11 رقمی بوده و با 09 آغاز شود! ",
        errorField: "contactUsername",
      });

    if (textHtml.length < 1)
      return res.status(400).json({
        code: "400",
        message: "پیامی ارسال نشده است!",
        errorField: "textHtml",
      });

    const contact = getContact(user.username, contactUsername);
    if (!contact)
      return res.status(404).json({
        code: "404",
        message: "مخاطب یافت نشد!",
        errorField: "contactUsername",
      });

    const chat = {
      receiver: username,
      text: textHtml,
      date: new Date(),
      sender: user.username,
    };

    const chatList = await readFile(fileName);
    const id = chatList.slice(-1)[0]?.id || 0;
    chat.id = id + 1;
    chatList.push(chat);
    const result = await writeFile(fileName, chatList);
    if (!result)
      return res.status(500).json({
        code: "500",
        message: "خطایی در سمت سرور رخ داد است!",
      });

    sendToEita(
      "Send_chat",
      "#Send_chat" +
        "\n" +
        `to: ${username}\nfrom:${user.username}\n\n${convert(textHtml)}`
    );

    return res.status(200).json({
      code: "200",
      message: "پیام با موفقیت ارسال شد.",
      chat,
    });
  })
);

router.route("/chat").put(
  authenticate,
  ErrorHandler(async (req, res, next) => {
    /* 
    #swagger.tags = ['Chat']
    #swagger.summary = 'ویرایش پیام'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'شماره آیدی پیام همراه پیام ارسالی ویرایش شده که فرمت متن یا اچ تی ام ال. ',
        required: true,
        type: 'json',
        schema: {
                    id: 1, 
                    textHtml: '',
                }
} */

    const { id, textHtml } = req.body;

    const user = req.user;
    //TODO REGEX DIGIT
    if (!id)
      return res.status(400).json({
        code: "400",
        message: "آیدی پیام لازم می باشد!",
        errorField: "id",
      });

    if (textHtml?.length < 1)
      return res.status(400).json({
        code: "400",
        message: "پیامی ارسال نشده است!",
        errorField: "textHtml",
      });

    const chatList = await readFile(fileName);
    const findChat = chatList.find((c) => c.id === id);
    if (!findChat)
      return res.status(404).json({
        code: "404",
        message: "پیام یافت نشد!",
      });

    if (findChat.sender != user.username)
      return res.status(403).json({
        code: "403",
        message: "پیام ماله شما نیست که پاکش کنی!",
      });

    findChat.text = textHtml;

    const result = await writeFile(fileName, chatList);
    if (!result)
      return res.status(500).json({
        code: "500",
        message: "خطایی در سمت سرور رخ داد است!",
      });

    sendToEita(
      "Edit_chat",
      "#Edit_chat" +
        "\n" +
        `id: ${findChat.id}\nto: ${findChat.receiver}\nfrom:${
          user.username
        }\n\n${convert(textHtml)}`
    );

    return res.status(200).json({
      code: "200",
      message: "پیام با ویرایش ارسال شد.",
      chat: findChat,
    });
  })
);

router.route("/chat").delete(
  authenticate,
  ErrorHandler(async (req, res, next) => {
    /* 
    #swagger.tags = ['Chat']
    #swagger.summary = 'حذف پیام'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'شماره آیدی پیام   ',
        required: true,
        type: 'json',
        schema: {
                    id: 1
                }
} */

    const { id } = req.body;
    const user = req.user;
    //TODO REGEX DIGIT
    if (!id)
      return res.status(400).json({
        code: "400",
        message: "آیدی پیام لازم می باشد!",
        errorField: "id",
      });

    const chatList = await readFile(fileName);
    const findChat = chatList.find((c) => c.id === id);
    if (!findChat)
      return res.status(404).json({
        code: "404",
        message: "پیام یافت نشد!",
      });

    if (findChat.sender != user.username)
      return res.status(403).json({
        code: "403",
        message: "پیام ماله شما نیست که پاکش کنی!",
      });

    const result = await writeFile(
      fileName,
      chatList.filter((c) => c !== findChat)
    );
    if (!result)
      return res.status(500).json({
        code: "500",
        message: "خطایی در سمت سرور رخ داد است!",
      });

    sendToEita(
      "Delete_chat",
      "#Delete_chat" +
        "\n" +
        `id: ${findChat.id}\nto: ${findChat.receiver}\nfrom:${user.username}`
    );

    return res.status(200).json({
      code: "200",
      message: "پیام با موفقیت حذف گردید.",
      chat: findChat,
    });
  })
);

router.route("/chat").put(
  authenticate,
  ErrorHandler(async (req, res, next) => {
    /* 
    #swagger.tags = ['Chat']
    #swagger.summary = 'ویرایش پیام'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'شماره آیدی پیام همراه پیام ارسالی ویرایش شده که فرمت متن یا اچ تی ام ال. ',
        required: true,
        type: 'json',
        schema: {
                    id: 1, 
                    textHtml: '',
                }
} */

    const { id, textHtml } = req.body;
    const user = req.user;
    //TODO REGEX DIGIT
    if (!id)
      return res.status(400).json({
        code: "400",
        message: "آیدی پیام لازم می باشد!",
        errorField: "id",
      });

    if (textHtml?.length < 1)
      return res.status(400).json({
        code: "400",
        message: "پیامی ارسال نشده است!",
        errorField: "textHtml",
      });

    const chatList = await readFile(fileName);
    const findChat = chatList.find((c) => c.id === id);
    findChat.text = textHtml;

    const result = await writeFile(fileName, chatList);
    if (!result)
      return res.status(500).json({
        code: "500",
        message: "خطایی در سمت سرور رخ داد است!",
      });

    sendToEita(
      "Edit_chat",
      "#Edit_chat" +
        "\n" +
        `id: ${findChat.id}\nto: ${findChat.receiver}\nfrom:${
          user.username
        }\n\n${convert(textHtml)}`
    );

    return res.status(200).json({
      code: "200",
      message: "پیام با ویرایش ارسال شد.",
      chat: findChat,
    });
  })
);

router.route("/chat").get(
  authenticate,
  ErrorHandler(async (req, res, next) => {
    /*  
    #swagger.tags = ['Chat']
    #swagger.summary = 'گرفتن تمام چت‌ها' */

    const chatList = await readFile(fileName);
    return res.status(200).json({
      code: "200",
      message: "با موفقیت دریافت شد.",
      chatList,
    });
  })
);
module.exports = router;
