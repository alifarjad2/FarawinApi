var querystring = require("querystring");
const wsInstance = require("../index");

const baseUrl = __dirname + "/";
// const baseUrl = "/tmp/" ;

const userFileName = "users.json";
const contactFileName = "contacts.json";
const fetch = require("node-fetch");

const config = {
  endpoint: process.env.LIARA_ENDPOINT,
  accessKeyId: process.env.LIARA_ACCESS_KEY,
  secretAccessKey: process.env.LIARA_SECRET_KEY,
  region: "default",
};

const getClient = () => {
  const AWS = require("aws-sdk");
  const client = new AWS.S3(config);
  return client;
};

const Caches = {};
const readFile = async (fileName, useCache) => {
  try {
    if (true || fileName !== "chats.json") {
      const c = Caches[fileName];
      if (c) return c;
    }

    const object = await getClient()
      .getObject({
        Bucket: process.env.LIARA_BUCKET_NAME,
        Key: fileName,
      })
      .promise();

    if (true || fileName !== "chats.json") {
      return (Caches[fileName] = JSON.parse(object.Body?.toString() || "[]"));
    }
    return JSON.parse(object.Body?.toString() || "[]");
  } catch (error) {
    console.log(error);
    return [];
    throw "خطایی در دریافت اطلاعات روی داد!";
  }
};

const writeFile = async (fileName, data) => {
  try {
    if (true || fileName !== "chats.json") {
      Caches[fileName] = typeof data !== "string" ? data : JSON.parse(data);
    }

    const object = await getClient()
      .putObject({
        Body: typeof data === "string" ? data : JSON.stringify(data),
        Bucket: process.env.LIARA_BUCKET_NAME,
        Key: fileName,
      })
      .promise();

    console.log(object);

    return true;
  } catch (error) {
    console.log(error);
    return false;
    throw "خطایی در ذخیره اطلاعات روی داد!";
  }
};

//token
//eyJ1c2VybmFtZSI6IjA5MDAwMDAwMDAwIiwicGFzc3dvcmQiOiJ4eHh4eHh4eCIsIm5hbWUiOiJ4eHgiLCJkYXRlIjoiMjAyMy0wNi0wOVQxNDoyOTozOC4zMDlaIn0=

const getContact = async (username, contactUsername) => {
  try {
    const contactList = await readFile(contactFileName);
    return contactList.find(
      (u) => u.username == contactUsername && u.ref == username
    );
  } catch {}

  return null;
};

const getUser = async (username) => {
  try {
    const userList = await readFile(userFileName);
    return userList.find((u) => u.username == username);
  } catch (e) {}

  return null;
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (req.method == "GET") {
    res.set("Cache-control", `public, max-age=${3}`);
  } else {
    // for the other requests set strict no caching parameters
    res.set("Cache-control", `no-store`);
  }

  if (authHeader) {
    const token = authHeader.split(" ")[1] || authHeader;

    try {
      const userToken = JSON.parse(decodeURIComponent(atob(token)));
      const user = await getUser(userToken?.username);
      if (!user) {
        return res.status(403).json({
          code: "403",
          message: "کاربر یافت نشد!",
        });
      }

      req.user = user;
      return next();
    } catch {}

    return res.status(403).json({
      code: "403",
      message: "توکن صحیح نمی باشد!",
    });
  }

  return res.status(401).json({
    code: "401",
    message: "زرنگی توکن نفرستادی!",
  });
};

const sendToEita = (title, text) => {
  try {
    fetch("https://api.gap.im/sendMessage", {
      headers: {
        // "content-type": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        token:
          "bdb5b1ea78ce19a78b0deced45adf3173bb738205f7e3c6cc0c2fd9e68805690",
      },
      //chat_id=%40clickmisbot&data=salam&type=text
      body: querystring.stringify({
        chat_id: "@clickmisbot",
        data: text.replace("{\n", "").replace("\n}", ""),
        type: "text",
      }),
      method: "POST",
    });
    // .then((res) => {
    //   console.log(res);
    // });
  } catch (e) {
    console.log(e);
  }

  try {
    fetch(
      "https://eitaayar.ir/api/bot28628:d0645003-3706-4772-84a4-4e3a9ec02311/sendMessage",
      {
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          chat_id: "9250300",
          text: text.replace("{\n", "").replace("\n}", ""),
          title: title || "api",
          parse_mode: "html",
        }),
        method: "POST",
      }
    );
    // .then((res) => {
    //   console.log("send");
    // });
  } catch (e) {
    console.log(e);
  }
};

const ErrorHandler = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    next(error);
  }
};

const getWsClient = (username) => {
  const clients = Array.from(wsInstance.getWss().clients);
  return clients.filter((c) => (c.username = username)).slice(-1)[0];
};
module.exports = {
  sendToEita,
  authenticate,
  getUser,
  getContact,
  readFile,
  writeFile,
  baseUrl,
  ErrorHandler,
  Caches,
  getWsClient,
};
