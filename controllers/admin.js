const mongoose = require('mongoose');
const fileHelper = require('../util/file'); //to delete files
const { validationResult } = require('express-validator/check');
const Product = require('../models/product');


exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  console.log('helloThere');
  const title = req.body.title;
  const image = req.file; //FIle uploading, image uploads. File
  const price = req.body.price;
  const description = req.body.description;

  //if it right type, if not it has value of underfined due to filterFIle function in App.js
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached File is not an Image!',
      validationErrors: []
    });
  }

  const errors = validationResult(req); //getting an array of objects of errors 
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }


  //Storing the Image path NOT the image itself on database
  //this gives us the path to the image stored
  const imageUrl = image.path;
  console.log('helloThere');

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      //res.redirect('/500');
      //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file; //WE are storing the file int he variable!!!!
  const updatedDesc = req.body.description;

  //Validating the user inputs
  const errors = validationResult(req); //getting an array of objects of errors 
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;

      //checking if image is in proper fileType, underfined i not
      if (image) {
        fileHelper.deleteFile(product.imageUrl); //deletes file, but dont wait for it to complete, all good
        product.imageUrl = image.path; //Sotring the path to database
      }
      return product.save().then(result => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      });
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
    });
};

//Asynchronous WAY
exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;

  //deleting file, image
  Product.findById(prodId).then( product => {
    if (!product) {
      return next(new Error('Product not found.'));
    }
    fileHelper.deleteFile(product.imageUrl); //deletes file, but dont wait for it to complete, all good
    return Product.deleteOne({ _id: prodId, userId: req.user._id })
  })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({message: 'Success!'}); //no mroe redirecting
  })
    .catch(err => { 
      res.status(500).json({message: 'Deleting product failed!'}); //error handing
  });
};

/* NON Asynchronous WAY
exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  //deleting file, image
  Product.findById(prodId).then( product => {
    if (!product) {
      return next(new Error('Product not found.'));
    }
    fileHelper.deleteFile(product.imageUrl); //deletes file, but dont wait for it to complete, all good
    return Product.deleteOne({ _id: prodId, userId: req.user._id })
  })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
  })
    .catch(err => { //we utilize Error-Handling Middlware function in app.js
      const error = new Error(err);
      err.httpStatusCode = 500;
      return next(error);
  });
};
*/
