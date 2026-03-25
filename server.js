require('dotenv').config();

const express = require('express');
const app = express();

const ejs = require('ejs');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const Emitter = require('events');

const MongoStore = require('connect-mongo')(session);
// ======================
// MongoDB Connection
// ======================

const url = process.env.MONGO_URL;
console.log("Mongo URL:", url);

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB Connected");
})
.catch(err => {
  console.log("MongoDB Connection Error:", err);
});

// ======================
// Event Emitter
// ======================

const eventEmitter = new Emitter();
app.set('eventEmitter', eventEmitter);

// ======================
// Session Config
// ======================

app.use(session({
    secret: process.env.COOKIE_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
store: new MongoStore({
    mongooseConnection: mongoose.connection,
    collection: 'sessions'
}),

    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ======================
// Passport Config
// ======================

const passportInit = require('./app/config/passport');
passportInit(passport);

app.use(passport.initialize());
app.use(passport.session());

// ======================
// Flash Messages
// ======================

app.use(flash());

// ======================
// Template Engine
// ======================

app.use(expressLayouts);
app.set('views', path.join(__dirname, 'resources/views'));
app.set('view engine', 'ejs');

// ======================
// Static Files
// ======================

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ======================
// Global Middleware
// ======================

app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
});

// ======================
// Routes
// ======================

require('./routes/web')(app);

// ======================
// Server Start
// ======================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on port " + PORT);
});

// ======================
// Socket.io
// ======================

const io = require('socket.io')(server);

io.on('connection', (socket) => {
    socket.on('join', (orderId) => {
        socket.join(orderId);
    });
});

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data);
});

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data);
});
