var express = require('express');
const { response } = require('../app');
var router = express.Router();
var db = require('../config/connection');
const productsHelpers = require('../helpers/products-helpers');
const userHelpers = require('../helpers/user-helpers');
const { ClientSession, MongoClient } = require('mongodb');
const { NetworkContext } = require('twilio/lib/rest/supersim/v1/network');
const { deleteCartProduct } = require('../helpers/user-helpers');
// let moment = require('moment')


/* block user */
function verifyblockuser() {

  if (req.session.user.active) {

    next()
  } else {
    req.session.destroy()
    res.redirect('/user-login')
  }
}


/* ----------------------- middleware for user session ---------------------- */

const verifyuserlogin = (req, res, next) => {
  if (req.session.userloggedIn) {
    next()
  } else {
    res.redirect('/user-login')
  }
}



/* ---------------------------- user landing page --------------------------- */

router.get('/', async (req, res, next) => {
  let userinfo = req.session.user
  let CartCount = null
  if (req.session.user) {
    CartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let banner = await productsHelpers.getbanner()
  productsHelpers.getAllProducts().then((products) => {
    res.render('user/landing-page', { user: true, products, userinfo, CartCount, banner });
  })
})


router.post('/single-page', (req, res) => {
  res.redirect('/user/single-page')
})


/* --------------------- viewing single products images --------------------- */

router.get('/single-page/:id', async (req, res) => {
  let userinfo = req.session.user
  let CartCount = null
  if (req.session.user) {
    CartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let products = await productsHelpers.getProductsDetails(req.params.id)
  res.render('user/single-page', { user: true, products, userinfo, CartCount })

})

/* ------------------------------- user signup ------------------------------ */

router.get('/user-signup', (req, res) => {
  if (req.session.userloggedIn) {

    res.redirect('/')
  } else {
    let signupError = req.session.signupError
    res.render('user/user-signup', { user: true, signupError });
  }
})


let signupdata;
router.post('/user-signup', (req, res) => {
  req.body.active = true
  userHelpers.doSignup(req.body).then((response) => {
    if (response.status) {
      signupdata = response
      res.redirect('/user-otp')
    } else {
      req.session.signupError = 'Email id or mobile already exist'
      res.redirect('/user-signup');
    }
  }).catch((error) => {
    res.render('user/error-page', { user: true })
  })
})


/* -------------------------------- otp page -------------------------------- */

router.get('/user-otp', (req, res) => {
  res.render('user/user-otp', { user: true });
})

router.post('/user-otp', (req, res) => {
  userHelpers.otp(req.body, signupdata).then((response) => {

    if (response.status) {

      res.redirect('/user-login')



    } else {
      res.redirect('/user-otp')
    }
  })
})


/* ------------------------------- user login ------------------------------- */

router.get('/user-login', (req, res) => {
  if (req.session.userloggedIn) {
    res.redirect('/')
  } else {
    let loginError = req.session.loginError

    res.render('user/user-login', { user: true, loginError });
  }
})

router.post('/user-login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userloggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginError = 'login invalid'
      res.redirect('/user-login');
    }
  })
})


/* ------------------------- logout session destroy ------------------------- */

router.get('/user-logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})


/* ----------------------------- error page 404 ----------------------------- */

router.get('/error-page', (req, res) => {
  res.render('user/error-page')
})


/* ----------------- shop page of all rpoducts with siebars ----------------- */

router.get('/shop-page', (req, res) => {
  res.render('user/shop-page', { user: true, userinfo: req.session.user })
})


/* ----------------------------- user side cart ----------------------------- */

router.get('/user-cart', verifyuserlogin, async (req, res, next) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let subtotal = await userHelpers.getCartSubTotal(req.session.user._id)

  for (var i = 0; i < products.length; i++) {
    products[i].subtotal = subtotal[i].subtotal
  }
  let CartCount = null
  if (req.session.user) {
    CartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  res.render('user/user-cart', { user: true, userinfo: req.session.user, products, CartCount, total, subtotal })
})

/* ----------------------------- add to cart id ----------------------------- */

router.get('/add-to-cart/:id', (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

/* ----------------------------- changeqauntity ----------------------------- */

router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    response.subtotal = await userHelpers.getSubTotal(req.body)
    res.json(response)
  })
})

/* ------------------------------- checkout-page ------------------------------ */

router.get('/checkout', verifyuserlogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let subtotal = await userHelpers.getCartSubTotal(req.session.user._id)
  let Useraddress = await userHelpers.getUserAddress(req.session.user._id)

  for (var i = 0; i < products.length; i++) {
    products[i].subtotal = subtotal[i].subtotal
  }

  let CartCount = null
  if (req.session.user) {
    CartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  res.render('user/checkout', { user: true, userinfo: req.session.user, products, CartCount, total, subtotal, Useraddress })
})


router.post('/checkout', async (req, res) => {
  console.log(req.body, "something");
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  let subtotal = await userHelpers.getCartSubTotal(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice, subtotal).then((orderId) => {
    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['payment-method'] == 'razorpay') {
      console.log("razorpay");
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        response.razorpay = true
        res.json(response)

      })
    } else if (req.body['payment-method'] == 'paypal') {
      userHelpers.generatePayPal(orderId.toString(), totalPrice).then(async (response) => {
        let statusChange = await userHelpers.changePaymentStatus(orderId)
        response.payPal = true;
        res.json(response)
      })
    }

  })
})

/* --------------------- for add adress in checkout page -------------------- */

router.post('/addaddresscheck', (req, res) => {
  console.log(req.body, "jfihuegewuhidughf");
  userHelpers.addnewAddress(req.session.user._id, req.body).then((response) => {
    console.log(response, 'tresponse');
    res.redirect('back')
  })
})


/* ------------------------------ my-order-list ----------------------------- */

router.get('/my-order', verifyuserlogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let CartCount = null
  if (req.session.user) {
    CartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  // moment().format('MMMM Do YYYY, h:mm:ss a')
  res.render('user/my-order', { user: true, userinfo: req.session.user, orders, CartCount })
})

/* ----------------------- view-products-button-click ----------------------- */

router.get('/view-products/:id', verifyuserlogin, async (req, res) => {
  let orderItems = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-products', { user: true, userinfo: req.session.user, orderItems })
})

/* -------------------------- cancel-order-myorder -------------------------- */

router.get('/cancel-order/:id', (req, res) => {
  let orderId = req.params.id
  userHelpers.CancelOrder(orderId).then((response) => {
    res.redirect('/my-order')
  })
})


/* ------------------------------- my-account ------------------------------- */

router.get('/my-account', verifyuserlogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let Useraddress = await userHelpers.getUserAddress(req.session.user._id)
  let adddress = await userHelpers.addnewAddress(req.body, req.session.user._id)

  let CartCount = null
  if (req.session.user) {
    CartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  res.render('user/my-account', { user: true, userinfo: req.session.user, CartCount, orders, adddress, Useraddress })

})

/* ---------------------------- deleteCartProduct --------------------------- */

router.post('/delete-cart-product', async (req, res) => {
  await userHelpers.deleteCartProduct(req.body, req.session.user._id)
  res.json({ status: true })
})


/* ----------------------------- user add new address ---------------------------- */

router.get('/add-address', verifyuserlogin, (req, res) => {
  res.render('user/add-address', { user: true })
})

router.post('/add-address', (req, res) => {
  userHelpers.addnewAddress(req.session.user._id, req.body).then((response) => {
    res.redirect('/my-account')
  })
})


/* ---------------------- Edit address in user profile ---------------------- */

router.get('/edit-address', verifyuserlogin, (req, res) => {
  res.render('user/edit-address', { user: true })
})


/* -------------------------------- razorpay -------------------------------- */

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: 'Payment failed' })
  })
})




module.exports = router;
