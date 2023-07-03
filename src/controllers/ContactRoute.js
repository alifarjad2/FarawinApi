const express = require('express')

const router = express.Router()

const { authenticate, getContact, sendToEita, writeFile, readFile } = require("../middlewares/auth");

const fileName = "contacts.json";

router.route('/contact/jsonDelete').get((req, res, next) => {
    // #swagger.ignore = true
    writeFile(fileName, "[]")
    return res.status(200).json({
        code: "200",
        message: 'DELETED!',
    })
});

router.route('/contact').post(authenticate, async (req, res, next) => {
    /* 
    #swagger.tags = ['Contact']
    #swagger.summary = 'افزودن مخاطب'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'نام کاربری که باید شماره موبایل باشد و نام و نام‌خانوداگی باید بیش از ۳ کرکتر باشد. ',
        required: true,
        type: 'json',
        schema: {
                    username: '09000000000',
                    name: 'xxx',
                }
} */

    const { username, name } = req.body;
    const user = req.user;

    //TODO REGEX DIGIT
    if (!username.startsWith('09') || username.length != 11)
        return res.status(400).json({
            code: "400",
            message: 'نام کاربری که باید شماره موبایلی 11 رقمی بوده و با 09 آغاز شود! ',
        })


    if (name.length < 3)
        return res.status(400).json({
            code: "400",
            message: ' نام و نام‌خانوداگی باید حداقل 3 کرکتر باشد!',
        })

    const contactList = await readFile(fileName);
    const findContact = contactList.find(c => c.username == username && c.ref == user.username)

    if (findContact)
        return res.status(409).json({
            code: '409',
            message: 'موبایل تکراری است!',
            contact: findContact
        })

    const contact = { username, name, date: new Date(), ref: user.username };
    contactList.push(contact)
    const result = await writeFile(fileName, contactList);
    if (!result) return res.status(500).json({
        code: '500',
        message: 'خطایی در سمت سرور رخ داد است!',
    })

    sendToEita("Add_Contact", "#Add_Contact" + "\n" + `contact username: ${username}\nfor: ${user.username}`);

    return res.status(200).json({
        code: '200',
        message: 'با موفقیت افزوده شد.',
        contact
    })

})

router.route('/contact').put(authenticate, async (req, res, next) => {
    /* 
    #swagger.tags = ['Contact']
    #swagger.summary = 'ویرایش مخاطب'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'نام کاربری که باید شماره موبایل باشد و نام و نام‌خانوداگی باید بیش از ۳ کرکتر باشد. ',
        required: true,
        type: 'json',
        schema: {
                    username: '09000000000',
                    name: 'xxx',
                }
} */

    const { username, name } = req.body;
    const user = req.user;

    //TODO REGEX DIGIT
    if (!username.startsWith('09') || username.length != 11)
        return res.status(400).json({
            code: "400",
            message: 'نام کاربری که باید شماره موبایلی 11 رقمی بوده و با 09 آغاز شود! ',
        })


    if (name.length < 3)
        return res.status(400).json({
            code: "400",
            message: ' نام و نام‌خانوداگی باید حداقل 3 کرکتر باشد!',
        })

    const contactList = await readFile(fileName);
    const findContact = contactList.find(c => c.username == username && c.ref == user.username)

    if (!findContact)
        return res.status(404).json({
            code: '404',
            message: 'مخاطب یافت نشد!',
        })

    findContact.name = name

    const result = await writeFile(fileName, contactList);
    if (!result) return res.status(500).json({
        code: '500',
        message: 'خطایی در سمت سرور رخ داد است!',
    })

    sendToEita("Edit_Contact", "#Edit_Contact" + "\n" + `contact username: ${username}\nfor: ${user.username}`);

    return res.status(200).json({
        code: '200',
        message: 'با موفقیت ویرایش شد.',
        contact: findContact
    })

})


router.route('/contact').delete(authenticate, async (req, res, next) => {
    /* 
    #swagger.tags = ['Contact']
    #swagger.summary = 'حذف مخاطب'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'نام کاربری که باید شماره موبایل باشد. ',
        required: true,
        type: 'json',
        schema: {
                    username: '09000000000'
                }
} */

    const { username } = req.body;
    const user = req.user;

    //TODO REGEX DIGIT
    if (!username.startsWith('09') || username.length != 11)
        return res.status(400).json({
            code: "400",
            message: 'نام کاربری که باید شماره موبایلی 11 رقمی بوده و با 09 آغاز شود! ',
        })

    const contactList = await readFile(fileName);
    const findContact = contactList.find(c => c.username == username && c.ref == user.username)

    if (!findContact)
        return res.status(404).json({
            code: '404',
            message: 'مخاطب یافت نشد!',
        })


    const result = await writeFile(fileName, contactList.filter(c => c !== findContact))
    if (!result) return res.status(500).json({
        code: '500',
        message: 'خطایی در سمت سرور رخ داد است!',
    })

    sendToEita("Delete_Contact", "#Delete_Contact" + "\n" + `contact username: ${username}\nfor: ${user.username}`);

    return res.status(200).json({
        code: '200',
        message: 'با موفقیت حذف شد.',
        contact: findContact
    })

})




router.route('/contact').get(authenticate, async (req, res, next) => {
    /*  
    #swagger.tags = ['Contact']
    #swagger.summary = 'گرفتن تمام مخاطبین' */

    const contactList = await readFile(fileName);
    return res.status(200).json({
        code: '200',
        message: 'با موفقیت دریافت شد.',
        contactList
    })

})


module.exports = router