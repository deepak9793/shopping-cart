var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs = require('express-handlebars');     
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session); //for saving user session to mongo session store


var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');


var app = express();
mongoose.connect('mongodb://localhost:27017/shopping');
require('./config/passport');


// view engine setup
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
	secret: 'mysupersecret', 
	resave: false, //false because to prevent saving session on server on each request.......
	saveUninitialized: false, //to prevent session saved on server even if nothing savedor changed......
	store: new MongoStore({ mongooseConnection: mongoose.connection }), //to store sessions in mongo...
	cookie: { maxage: 180*60*1000 }
}));
app.use(flash());
app.use(passport.initialize()); //starting passport services
app.use(passport.session());	//storing users to session with passport

app.use(express.static(path.join(__dirname, 'public')));

// global object used in views and session is added here so that it can be used in all the routes.
app.use(function(req, res, next){  
	res.locals.login = req.isAuthenticated();
	res.locals.session = req.session;
	next();
});

app.use('/user', userRouter);
app.use('/', indexRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
