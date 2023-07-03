
const express = require('express')
const router = express.Router()

const ContactRoute = require('./controllers/ContactRoute')
const UserRoute = require('./controllers/UserRoute')
const ChatRoute = require('./controllers/ChatRoute')

router.use('/api', ContactRoute)
router.use('/api', UserRoute)
router.use('/api', ChatRoute)


module.exports = router