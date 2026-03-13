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

const MongoStore = require('connect-mongo');


// MongoDB connection
const url = process.env.MONGO_URL || 
mongoose.connect(url,{
  useNewUrlParser:true,
  useUnifiedTopology:true
})
.then(()=>{
  console.log("MongoDB Connected");
})
.catch(err=>{
  console.log("MongoDB Connection Error:",err);
});


// Event emitter
const eventEmitter = new Emitter();
app.set('eventEmitter', eventEmitter);


// Session config
app.use(session({
    secret: process.env.COOKIE_SECRET || "secret",
    resave:false,
    saveUninitialized:false,
    store: MongoStore.create({
        mongoUrl: url,
        collectionName: 'sessions'
    }),
    cookie:{ maxAge:1000*60*60*24 }
}));


// Passport config
const passportInit = require('./app/config/passport');
passportInit(passport);

app.use(passport.initialize());
app.use(passport.session());


// Flash
app.use(flash());


// Template engine
app.use(expressLayouts);
app.set('views', path.join(__dirname,'resources/views'));
app.set('view engine','ejs');


// Static files
app.use(express.static('public'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());


// Global middleware
app.use((req,res,next)=>{
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
});


// Routes
require('./routes/web')(app);


// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT,'0.0.0.0',()=>{
    console.log("Server running on port " + PORT);
});


// Socket.io
const io = require('socket.io')(server);

io.on('connection',(socket)=>{
    socket.on('join',(orderId)=>{
        socket.join(orderId);
    });
});

eventEmitter.on('orderUpdated',(data)=>{
    io.to(`order_${data.id}`).emit('orderUpdated',data);
});

eventEmitter.on('orderPlaced',(data)=>{
    io.to('adminRoom').emit('orderPlaced',data);
});
