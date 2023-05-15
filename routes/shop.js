const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

router.get('/checkout', isAuth, shopController.getCheckout);    //Checkout Page linked

router.get('/checkout/success', shopController.getCheckoutSuccess); //If After going to Stripe payment page user, succeeds

router.get('/checkout/cancel', shopController.getCheckout);     //If After going to Stripe payment page user,  cancels

//router.post('/create-order', isAuth, shopController.postOrder);

router.get('/orders', isAuth, shopController.getOrders);

//Using , isAuth, is the route protection we created modules ago
router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router;
