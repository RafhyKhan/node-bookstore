const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser'); //Parses data into incoming text
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer'); //its parses data for FILES



const errorController = require('./controllers/error');
const User = require('./models/user');


require('dotenv').config()


//using environmental variables to fill in data
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.Mongo_PASSWORD}@cluster0.gmozk8w.mongodb.net/shop?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
  uri: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.gmozk8w.mongodb.net/shop?retryWrites=true&w=majority`,
  collection: 'sessions'
});
const csrfProtection = csrf();


//FUNCTION (Create File Storage for Mutiple Files)
//We are creating a fileStorage using Multers
//Destination is in images folder
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  }, 
  filename: (req, file, cb) => {
    cb(null, crypto.randomBytes(20).toString('hex')  + '-' + file.originalname); //so it doesnt overlap, it seperated with '-'
  }
})

//FUNCTION (Filters File TYpes when Uploading)
//This is so we can dictate which file types the file function can take, png, jpg and jpeg
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true); //Callback TRUE
  } else {
    cb(null, false); //Callback FALSE
  }
}

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image')); 
//We are initiliazing multer, image is the input variable amde in EJS of add product form!!!
//(dest:'/image') -> Now it stores the uploaded image into a folder, in the project directory called images.
//(storage: fileStorage) -> Now it stores all files into an storage, '-' to seperate name
//(fileFilter: fileFilter) -> It filters files so we can avoid errors, only listed in If statement ones will work!!!

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));   //Surving more than one folder staticlly


app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  //throw new Error('Sync Dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if(!user) { //additional error management
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err)); //makes sense to Throw an Error, must use next since Async code
    });
});


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500); //for all errors with database things

app.use(errorController.get404);

//An special express ERROR Middleware (Main error handling one all functions send to this in catch usually)
app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...);
  // res.redirect('/500');
  console.log(req.session.isLoggedIn);
  
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn,
    csrfToken: req.session.csrfSecret
  });
});

mongoose
  .connect('mongodb+srv://BobAllan:b5tIpzAWNw8mFonS@cluster0.gmozk8w.mongodb.net/shop?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true})
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
