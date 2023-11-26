# Node-BookStore App

[Check out the App Online!](https://warm-escarpment-73454.herokuapp.com/)

## Description
Node BookStore is a muti-paged app consisting of authentication, backend database management, payment services, user account management, CSRF tokens and many more. It was created with Nodejs and ExpressJs, using middleware functions and routes for pagination. I also used other libraries such as Stripe for payment services and nodemailer with crypt for secure password resets.



## Coding-Keywords Used

| Keyword | Description of use |
| ------ | ----------- |
|  NodeJs  | NodeJs is an JS runtime environment that allows developers to create faster efficient apps by using fewer threads per process   |
| expressJs    | Lets us use dynamic html templates like ejs, middleware functions for request, response handling and other benefits.  |
``` js
module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
}
```
[Check out FULL code](https://github.com/RafhyKhan/node-bookstore/blob/master/middleware/is-auth.js)

---

| Keyword | Description of use |
| ------ | ----------- |
| bcrpyt   | For authentication we compare the given password with bcyprt library hashed password listed with given email to validate user.  |
| sessions | Sessions are used to allow the user to browse freely throughout the app without need to re-login on each page or if they decide to re-open a closed tab |
| csrf tokens | Used to prevent csrf attacks, by validating all user-requests from backend server. |
``` js
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
```
[Check out FULL Code](https://github.com/RafhyKhan/node-bookstore/blob/master/controllers/auth.js)

---

| Keyword | Description of use |
| ------ | ----------- |
| Mongoose / MongoDB | Mongoose lets me create my own data schemas and models for user, products, orders when wokring with MongoDB which is traditionally used schema-less |
``` js
const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});
```
[Check out FULL code](https://github.com/RafhyKhan/node-bookstore/blob/master/models/product.js)

---

| Keyword | Description of use |
| ------ | ----------- |
| nodemailer    | Used to email the users given email with password reset link |
``` js
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'shop@node-complete.com',
          subject: 'Password reset',
          html: `
            <p>You requested a password reset</p>
```
[Check out FULL code](https://github.com/RafhyKhan/React-QuotesApp/blob/main/src/lib/api.js)

---


| Keyword | Description of use |
| ------ | ----------- |
| crypto    | Used to make password reset token which secures a password reset link, sent to user email |
``` js
crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
```
[Check out FULL code](https://github.com/RafhyKhan/node-bookstore/blob/master/controllers/auth.js)

---



| Keyword | Description of use |
| ------ | ----------- |
| stripe    | Used to make secure payments online, after user checkout. |
``` js
      //Here we are intiializing STRIPE to configure the payments
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p => {
          return {
            quantity: p.quantity,
            price_data: {
              currency: 'cad', //setting currency to Canada
              unit_amount: p.productId.price * 100,
              product_data: {
                name: p.productId.title,
                description: p.productId.description,
              }
            }

```
[Check out FULL code](https://github.com/RafhyKhan/node-bookstore/blob/master/controllers/shop.js)

---









## END of ReadMe File
