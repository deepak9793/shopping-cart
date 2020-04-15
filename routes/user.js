var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');

var Order = require('../models/order');
var Cart = require('../models/cart');
//middleware for csrf
var csrfProtection = csrf();
router.use(csrfProtection); //telling that all routes with this router should be protectes by csrf.....

//displaying orders in user profile
router.get('/profile', isloggedIn, function(req, res, next){
	Order.find({user: req.user}, function(err, orders) {
		if (err) {
			return res.write('Error!');
		}
		var cart; //fetching old cart and creating a new one for each order
		orders.forEach(function(order) {
			cart = new Cart(order.cart);
			order.items = cart.generateArray(); // it returns array of orders in cart
		});
		res.render('user/profile', { orders: orders }); // passing object to view....
	});
 });

router.get('/logout', isloggedIn, function(req, res, next){
	req.logout();
	res.redirect('/');
});
  	

router.use('/', notloggedIn, function(req, res, next){
	next();
});

router.get('/signup', function(req, res, next){
	var messages = req.flash('error');
		res.render('user/signup', { csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
});
//csrf token generated above so that signed users sessions cant be stolen........
 router.post('/signup', passport.authenticate('local.signup', {
 			faliureRedirect: '/user/signup',
 			faliureFlash: true
 }), function(req, res, next) {
		if (req.session.oldurl) {
			var oldurl = req.session.oldurl
			req.session.oldurl = null;
			res.redirect(oldurl);
			
		} else {
			res.redirect('/user/profile');
				}
		});

 
 router.get('/signin', function(req, res, next){
 	var messages = req.flash('error');
		res.render('user/signin', { csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
 });

router.post('/signin', passport.authenticate('local.signin', {
 			faliureRedirect: '/user/signin',
 			faliureFlash: true
 }), function(req, res, next) {
		if (req.session.oldurl) {
			var oldurl = req.session.oldurl
			req.session.oldurl = null;
			res.redirect(oldurl);
		} else {
			res.redirect('/user/profile');
		}
});
//checking above if old url is present and then clearing


module.exports = router;

function isloggedIn(req, res, next){
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

function notloggedIn(req, res, next){
	if (!req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}