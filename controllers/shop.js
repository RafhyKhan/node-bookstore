const fs = require('fs'); //to read invioce and send it
const path = require('path'); //to locate invioce

const stripe = require('stripe')('sk_test_51M1PIuAIPuE51uBvpewiHYAn1sl5xS6bZeaONhcdR9wk90lLZRFy44AfUfwnTboRunOYEcA1rQOPaF1eHZ9zewQQ007ZlQN3Qx');
//Stripe key to use stripe functions, get key from Stripe Account

const Product = require('../models/product');
const Order = require('../models/order');
const PDFDocument = require('pdfkit'); //to create pdf files

const ITEMS_PER_PAGE = 3;


exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  //Copied from getIndex code
  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  //we are getting our page number, based on the query parameter selected

  //we are including forward page, and baskward page buttons
  //forward button only if your current page has enough items, prediction
  //we are getting all of the options here
  //.skip = we are skipp number of items before the page we are at
  //.limit = we only want the number of items per page

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log('dsds');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

/*
Creating checkout page with function
*/
exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;


  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      products = user.cart.items;
      total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });

      //Here we are intiializing STRIPE to configure the payments
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p => {
          return {
            quantity: p.quantity,
            price_data: {
              currency: 'usd', //setting currency to USD
              unit_amount: p.productId.price * 100,
              product_data: {
                name: p.productId.title,
                description: p.productId.description,
              }
            }
          }
        }), //if payment in Stripe page suceeds, send them here, if they cancel, send them there
        mode: 'payment',
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
      })
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id //gives the session Id needed for stripe to redirect to stripe payment page
      });
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
}

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};


exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId; //orderId number get from when you submit and order

  //we are checking if order exists, and if its for the right user whoose logged in
  Order.findById(orderId).then(order => {
    if(!order) {
      return next(new Error('No order found.'));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('Unauthorized'));
    }
    //if two check passed, than read file and send it
    const invoiceName = 'invoice-' + orderId; //each file invoice is named as, 'invoice-' plus orderID
    const invoicePath = path.join('data', 'invoices', invoiceName); //This is the link to the invoiceFile, data folder -> invoices folder -> files
  
    //NOT STREAM (small folders, small files)
    // //this allows us to read the files, based on the path dictated to specific file, and err handling
    // fs.readFile(invoicePath, (err, data) => {
    //   if(err) {
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type', 'application/pdf'); //Sending the file as an pdf file, 
    //   res.setHeader('Content-Type', 'inline; filename="' + invoiceName + '"'); //Sending the file with fileName Specified
    //   res.send(data);
    // });


    //STREAMING (big folders, alot of files)
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type', 'application/pdf'); //Sending the file as an pdf file, 
    // res.setHeader('Content-Type', 'inline; filename="' + invoiceName + '"'); //Sending the file with fileName Specified
    // file.pipe(res); //we stream the file to the user, piece by piece which is faster, NODJS doesnt need to preload veerything


    //WE CREATE AN PDF (INVOICE) WITH PDFKIT & includes STREAMING
    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf'); //Sending the file as an pdf file, 
    res.setHeader('Content-Type', 'attachment; filename="' + invoiceName + '"'); //Sending the file with fileName Specified
    pdfDoc.pipe(fs.createWriteStream(invoicePath)); //link the streams
    pdfDoc.pipe(res); //we start streaming writing

    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    })
    pdfDoc.text('------------------------------------------');
    //creates line of data for each porduct ordered
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
    })

    pdfDoc.text('---------------------');
    pdfDoc.fontSize(18).text('Total Price: $' + totalPrice);
    pdfDoc.end(); //we end steaming writing

  })
    .catch(err => next(err));

}