var express = require('express');
var router = express.Router();
var Cart = require('../models/cart');

var Product = require('../models/product');
var Order = require('../models/order');


/* GET home page. */

router.get('/', function(req, res, next) {
	var successMsg = req.flash('success')[0];
	Product.find(function(err, docs){
		var productArray = []; //according to thumbnails only 3 products can be displayed in a row
		var arraySize = 3;
		for (var i = 0; i < docs.length; i += arraySize){
			productArray.push(docs.slice(i, i + arraySize)); //it will slice upto 3rd element
		}

       res.render('shop/index', { title: 'Shopping Cart', products: productArray, successMsg: successMsg, noMessages: !successMsg });      
	});
  
});
//storing new cart object in user session.
router.get('/add-to-cart/:id', function(req, res, next){
	var productId = req.params.id;
	var cart = new Cart(req.session.cart ? req.session.cart : {});

	Product.findById(productId, function(err,product){
		if(err){
			return res.redirect('/');
		}
		cart.add(product, product.id);
		req.session.cart = cart;
		console.log(req.session.cart);
		res.redirect('/');
	});
});

router.get('/reduce/:id', function(req, res, next) {
	var productId = req.params.id;
	var cart = new Cart(req.session.cart ? req.session.cart : {});

	cart.reduceByOne(productId);
	req.session.cart = cart;
	res.redirect('/shopping-cart');	
});

router.get('/remove/:id', function(req, res, next) {
	var productId = req.params.id;
	var cart = new Cart(req.session.cart ? req.session.cart : {});

	cart.removeItem(productId);
	req.session.cart = cart;
	res.redirect('/shopping-cart');	
});

router.get('/shopping-cart', function(req, res, next){
	if(!req.session.cart){
		return res.render('shop/shopping-cart', {products: null});
	}
	var cart = new Cart(req.session.cart);
	res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/checkout', isloggedIn, function(req, res, next){
	if(!req.session.cart){
		return res.render('/shopping-cart');
	}
	var cart = new Cart(req.session.cart);
	 var errMsg = req.flash('error')[0];
	res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

router.post('/checkout', isloggedIn, function(req, res, next) {
if(!req.session.cart){
		return res.render('/shopping-cart');
	}
	var cart = new Cart(req.session.cart);

	var stripe = require("stripe")(
  "sk_test_TbtmWXGp3x8lzR7rUs6ibNDq"
);

stripe.charges.create({
  amount: cart.totalPrice * 100,
  currency: "usd",
  source: req.body.stripeToken, // obtained with Stripe.js
  description: "Test Charge"
}, function(err, charge) {
  if(err) {
  	req.flash('error', err.message);
  	return res.redirect('/checkout');
  }
  var order = new Order({
  	user: req.user,
  	cart: cart,
  	address: req.body.address,
  	name: req.body.name,
  	paymentId: charge.id
  });
  order.save(function(err, result) {
  	 	req.flash('success', 'Successfully bought product!');
  		req.session.cart = null; //clear cart session
  		res.redirect('/');
  });
 
});
});

module.exports = router;

function isloggedIn(req, res, next){
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.oldurl = req.url;	//storing old url coz it is necessary to sign before checkout
	res.redirect('/user/signin');
}
