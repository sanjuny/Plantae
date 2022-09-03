var express = require('express');
const { Db } = require('mongodb');
var router = express.Router();
var multer = require('multer');
const { response } = require('../app');
const { categoryName, getProductsDetails } = require('../helpers/products-helpers');
var productsHelpers = require('../helpers/products-helpers');
const userHelpers = require('../helpers/user-helpers');
const { route } = require('./user');
const session = require('express-session');
const { MonthlyInstance } = require('twilio/lib/rest/api/v2010/account/usage/record/monthly');



/* middleware for admin session */
const verifylogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/admin/admin-login')
  }
}


/* for upload multiple multer images */
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/admin/images')
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + file.originalname)
  }
})
const upload = multer({ storage: fileStorageEngine })






/* GET users listing. */
router.get('/', async (req, res, next) => {
  if (req.session.loggedIn) {
    productsHelpers.paymentChart().then((order) => {
      console.log('oooo');
      console.log(order);

      res.render('admin/admin-dashboard', { admin: true, order });
    })

  } else {
    res.redirect('/admin/admin-login')
  }


});


/* admin login */
router.get('/admin-login', (req, res) => {
  if (req.session.loggedIn) {
    res.render('admin/admin-dashboard', { admin: true })
  } else {
    res.render('admin/admin-login', { login: true });

  }
})

router.post('/admin-login', (req, res) => {
  userHelpers.doLoginadmin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      res.redirect('/admin')

    } else {
      console.log('hyy');
      res.redirect('/admin/admin-login');
    }
  })
})

/* add products */
router.get('/add-products', verifylogin, (req, res, next) => {
  productsHelpers.getCategory().then((category) => {

    res.render('admin/add-products', { admin: true, category });
  })
})

router.post('/add-products', upload.array('image'), (req, res) => {
  productsHelpers.addProduct(req.body, (data) => {
    let image = req.files.image;

  })
  var filename = req.files.map(function (file) {
    return file.filename;
  })
  req.body.image = filename;
  console.log(req.body);
  res.redirect('/admin/products-management')
})


/* products management */
router.get('/products-management', verifylogin, (req, res) => {
  productsHelpers.getAllProducts().then((products) => {

    res.render('admin/products-management', { admin: true, products });
  })

})

/* category management */
router.get('/category-management', verifylogin, (req, res) => {
  productsHelpers.getCategory().then((category) => {
    res.render('admin/category-management', { admin: true, category })

  })
})

/* add catgory */
router.get('/add-category', verifylogin, (req, res) => {
  res.render('admin/add-category', { admin: true })
})

router.post('/add-category', (req, res) => {
  productsHelpers.addcategory(req.body).then((data) => {
    res.redirect('/admin/category-management')

  })
})


/* delete products in admin side */
router.get('/delete-product/:id', verifylogin, (req, res) => {
  let proId = req.params.id
  productsHelpers.deleteProducts(req.params.id).then((response) => {
    res.redirect('/admin/products-management')
  })
})


/* update products in admin side */


const updateproduct = async (req, res) => {
  let products = await productsHelpers.getProductsDetails(req.params.id)
  let category = await productsHelpers.getCategory()
  let getSingleCategory = await productsHelpers.getSingleCategory(products.category)
  res.render('admin/update-products', { admin: true, products, category, getSingleCategory })
}

router.get('/update-product/:id', verifylogin, updateproduct)



router.post('/update-product/:id', upload.array('image'), (req, res) => {
  var filename = req.files.map(function (file) {
    return file.filename
  })
  req.body.image = filename
  productsHelpers.updateproducts(req.params.id, req.body).then(() => {
    res.redirect('/admin/products-management')
  })
})


/* delete category in admin side */
router.get('/delete-category/:id', verifylogin, (req, res) => {
  let catId = req.params.id
  productsHelpers.deleteCategory(req.params.id).then((response) => {
    res.redirect('/admin/category-management')
  })
})


/* update category in admin side */
router.get('/update-category/:id', verifylogin, async (req, res) => {
  let category = await productsHelpers.getSingleCategory(req.params.id)
  res.render('admin/update-category', { admin: true, category })
})

router.post('/update-category/:id', (req, res) => {
  productsHelpers.updateCategory(req.params.id, req.body).then(() => {
    res.redirect('/admin/category-management')
  })
})


/* user management in admin side */
router.get('/user-management', verifylogin, (req, res) => {
  userHelpers.getAllUsers().then((userinformation) => {
    res.render('admin/user-management', { admin: true, userinformation })

  })
})


/*for block user */
router.get('/user-management/:id', verifylogin, (req, res) => {
  let proId = req.params.id
  productsHelpers.blockuser(proId).then((data) => {
    res.redirect('/admin/user-management')

  })
})

/* for unblock user */
router.get('/user-unblock/:id', verifylogin, (req, res) => {
  let proId = req.params.id
  productsHelpers.Unblockuser(proId).then((data) => {
    res.redirect('/admin/user-management')
  })
})

/* logout session admin destroy */
router.get('/admin-logout', (req, res) => {
  req.session.destroy()
  res.redirect('/admin/admin-login')
})


/* ---------------------------- oreder-managment ---------------------------- */

router.get('/order-management', verifylogin, async (req, res) => {
  let orders = await productsHelpers.getAllOrderProducts()
  res.render('admin/order-management', { admin: true, orders })
})

router.post('/updateOrderStatus', (req, res) => {
  productsHelpers.updateOrderStatus(req.body).then((data) => {
    res.json({ status: true })
  })
})



/* ---------------------------- banner-management --------------------------- */

router.get('/banner-management', verifylogin, async (req, res) => {
  let viewbanner = await productsHelpers.viewbanner()

  res.render('admin/banner-management', { admin: true, viewbanner })
})


/* ------------------------------- add-banner ------------------------------- */

router.get('/add-banner', verifylogin, async (req, res) => {
  res.render('admin/add-banner', { admin: true })
})

router.post('/add-banner', upload.array('image'), (req, res) => {
  productsHelpers.addbanner(req.body, (data) => {
    let image = req.files.image;

  })
  var filename = req.files.map(function (file) {
    return file.filename;
  })
  req.body.image = filename;
  console.log(req.body);
  res.redirect('/admin/banner-management')
})


/* ------------------------------ delete-banner ----------------------------- */

router.get('/delete-banner/:id', verifylogin, (req, res) => {
  let proId = req.params.id
  productsHelpers.deletebanner(req.params.id).then((response) => {
    res.redirect('/admin/banner-management')
  })
})

/* ------------------------------ update-banner ----------------------------- */

router.get('/edit-banner/:id', verifylogin, async (req, res) => {
  let banner = await productsHelpers.getsinlgebanner(req.params.id)
  res.render('admin/edit-banner', { admin: true, banner })
})

router.post('/edit-banner/:id', upload.array('image'), (req, res) => {
  var filename = req.files.map(function (file) {
    return file.filename
  })
  req.body.image = filename
  productsHelpers.editbanner(req.params.id, req.body).then(() => {
    res.redirect('/admin/banner-management')
  })
})

/* ---------------------------- view-daily-report --------------------------- */

router.get('/view-daily-report', verifylogin, async (req, res) => {
  let dt = req.body.day
  console.log('mm');
  console.log(dt);
  let dailysales = await productsHelpers.getdailyreport(dt)
  let sum = 0;
  for (var i = 0; i < dailysales.length; i++) {
    sum = sum + dailysales[i].quantity
  }

  let sumtotal = 0;
  for (var i = 0; i < dailysales.length; i++) {
    sumtotal = sumtotal + dailysales[i].TotalAmount
  }
  
  let count = await productsHelpers.orderCount(dt)
  console.log('aaa');
  console.log(count);

  console.log('nmn', sum);
  console.log('sss', sumtotal);
  res.render('admin/view-daily-report', { admin: true, dailysales, sum, sumtotal })
})


/* --------------------------- view-Monthly-report -------------------------- */

router.get('/view-monthly-report', verifylogin, (req, res) => {
  res.render('admin/view-monthly-report', { admin: true })
})

/* --------------------------- view-yearly-report --------------------------- */

router.get('/view-yearly-report', verifylogin, (req, res) => {
  res.render('admin/view-yearly-report', { admin: true })
})















module.exports = router;  
