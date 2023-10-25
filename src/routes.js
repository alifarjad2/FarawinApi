
const express = require('express')
const router = express.Router()

const ContactRoute = require('./controllers/ContactRoute')
const UserRoute = require('./controllers/UserRoute')
const ChatRoute = require('./controllers/ChatRoute')
const SocketRoute = require('./controllers/SocketRoute')

const GameRoute = require('./controllers/GameRoute')


router.use('/api', ContactRoute)
router.use('/api', UserRoute)
router.use('/api', ChatRoute)
router.use('/api', SocketRoute)
router.use('/api', GameRoute)


module.exports = router