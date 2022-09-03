const { response } = require('../app');
const collection = require('../config/collection');
const ottp = require('../config/ottp');
const bcrypt = require('bcrypt');
var db = require('../config/connection')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { order } = require('paypal-rest-sdk');
const { resolve } = require('path');
const paypal  = require('paypal-rest-sdk')
var instance = new Razorpay({
    key_id: 'rzp_test_uIX799wb8OXfGe',
    key_secret: '4LInMiHtyf5tF4rXgeychCr4',
});
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AfT-2JmV621NJSKYWvmvlJeKakhz2OmxqH2sb0saNqnjvtDqg6vtIxWwk-cCpwNqWG7muUexjXjYtdsN',
    'client_secret':'EKiAW5eTDrOyBLq_-U36regVS0OzdZquyMxyy4G0nrNriU_QiDTt4HAeNlsKf8DPJ2qsd-kfi0UVbMYz',
  }); 
const client = require('twilio')(ottp.accountSid, ottp.authToken);


module.exports = {


    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            userData.password = await bcrypt.hash(userData.password, 10)
            let userinformation = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            let usermobile = await db.get().collection(collection.USER_COLLECTION).findOne({ phonenumber: userData.phonenumber })
            if (userinformation || usermobile) {
                resolve({ status: false });
            } else {
                userData.status = true;
                response = userData
                client.verify.services(ottp.serviceID).verifications
                    .create({
                        to: `+91${userData.phonenumber}`,
                        channel: `sms`
                    })
                    .then((data) => {

                    })
                resolve(response)
            }
        })
    },

    doLogin: (userData) => {
        try {
            return new Promise(async (resolve, reject) => {
                let response = {}
                let userinformation = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
                let check = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email, active: true })
                if (userinformation) {
                    if (check) {
                        bcrypt.compare(userData.password, userinformation.password).then((status) => {
                            console.log('login sucess');
                            response.active = true

                            if (status) {
                                console.log('login sucesssss');
                                response.user = userinformation
                                response.status = true
                                resolve(response)

                            } else {
                                console.log('login failed');
                                resolve({ status: false })
                            }
                        })

                    } else {
                        console.log('just fail');
                        resolve({ active: false })
                    }
                } else {
                    console.log('login failed hello');
                    resolve({ status: false })

                }
            })
        } catch (error) {
        }
    },

    doLoginadmin: (admindata) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let owner = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: admindata.Username })
            if (owner) {
                bcrypt.compare(admindata.password, owner.password).then((status) => {
                    if (status) {
                        console.log('login success ');
                        response.status = true
                        response.owner = owner
                        resolve(response)
                    } else {
                        console.log('login failed');
                        resolve({ status: false })
                    }
                })


            } else {
                console.log('login failed');
                resolve({ status: false })
            }
        })

    },


    otp: (otp, userData) => {
        return new Promise((resolve, reject) => {
            client.verify.services(ottp.serviceID).verificationChecks
                .create({
                    to: `+91${userData.phonenumber}`,
                    code: otp.otp
                }).then((data) => {
                    if (data.status == 'approved') {
                        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                            resolve({ status: true })

                        })
                    } else {
                        resolve({ status: false })
                    }

                })
        })
    },


    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let userinformation = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(userinformation);
        })

    },

    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1,
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {

                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {

                                $inc: { 'products.$.quantity': 1 }

                            }

                        ).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }

                        ).then((response) => {
                            resolve()
                        })

                }


            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] },
                    }
                },

            ]).toArray()
            resolve(cartItems)

        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },


    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }

                ).then((response) => {
                    resolve({ removeProduct: true })
                })


            } else {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }



                    ).then((response) => {
                        resolve({ status: true })
                    })
            }

        })


    },


    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] },
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] } }
                    }
                }

            ]).toArray()
            if (total.length != 0) {
                resolve(total[0].total);

            } else {
                resolve()
            }

        })




    },




    getSubTotal: (details) => {
        return new Promise(async (resolve, reject) => {
            let subtotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(details.user) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }
                },
                {
                    $match: {
                        item: objectId(details.product)
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] },
                    }
                },
                {
                    $project: {
                        subtotal: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] }
                    }
                }

            ]).toArray()
            if (subtotal.length != 0) {
                resolve(subtotal[0].subtotal);
            } else {
                resolve()
            }

        })



    },


    getCartSubTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let subtotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] },
                    }
                },
                {
                    $project: {
                        subtotal: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] }
                    }
                }

            ]).toArray()
            resolve(subtotal);

        })



    },


    placeOrder: (order, products, totalPrice, subtotal) => {
        console.log(order, "wergrewdfghfdfg");

        return new Promise(async (resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let addressData = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objectId(order.addressId) })
            console.log(addressData, 'aaassdffghjkkkkl;mnbvcxzaqwertyuiokjh');
            let orderObj = {
                deliveryDetails: {
                    FirstName: addressData.address.name,
                    LastName: addressData.address.lastname,
                    Address: addressData.address.Address,
                    City: addressData.address.City,
                    State: addressData.address.State,
                    Postcode: addressData.address.Postcode,
                    EmailAddress: addressData.address.email,
                    Mobile: addressData.address.number,
                },
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                TotalAmount: totalPrice,
                SubTotalAmount: subtotal,
                status: status,
                date: new Date(),
                // date: date.toISOString()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                console.log(response);
                resolve(response.insertedId)
            })

        })

    },


    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },


    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()
            resolve(orders);
        })
    },

    /* ----------------------------- GET USER ORDERS ---------------------------- */
    // getUserOrders:(userId)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         // let orders = await db.get().collection(collection.ORDER_COLLECTION)
    //         // .find({userId:objectId(userId)}).toArray()
    //         // console.log(orders,'orders');
    //         // resolve(orders)

    //         let orders = await db.get().collection(collection.ORDER_COLLECTION)
    //         .aggregate([
    //             {
    //                 $match:{userId:objectId(userId)}
    //             },
    //             {
    //                 $unwind: '$products'
    //             },
    //             {
    //                 $lookup:{
    //                     from: collection.PRODUCTS_COLLECTION,
    //                     localField:'products.item',
    //                     foreignField:'_id',
    //                     as:'products'
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     deliveryDetails:1,
    //                     userId:1,
    //                     paymentMethod:1,
    //                     TotalAmount:1,
    //                     status:1,
    //                     date:1,
    //                     product:{$arrayElemAt:['$products',0]}
    //                 }
    //             }

    //         ]).toArray()
    //         resolve(orders) 
    //         console.log(orders,'odr');
    //     })
    // },


    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(orderItems)

        })
    },

    CancelOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'cancelled',
                    }
                }

            ).then((response) => {
                console.log(response);
                resolve(response)
            })



        })


    },

    deleteCartProduct: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                {
                    $pull: {
                        products: {
                            item: objectId(proId.products)
                        }
                    }
                }

            ).then((response) => {
                resolve(response)
            })
        })
    },


    addnewAddress: (userId, address) => {
        return new Promise((resolve, reject) => {


            db.get().collection(collection.ADDRESS_COLLECTION).insertOne({ user: userId, address: address }).then((response) => {
                resolve(response)
            })

        })
    },

    getUserAddress: (userId) => {
        return new Promise(async (resolve, reject) => {

            let userAddress = await db.get().collection(collection.ADDRESS_COLLECTION).find({ user: userId }).toArray()
            console.log(userAddress, "jhgtfrerfgh");
            resolve(userAddress)
        })

    },

    // EditUserAddress:(userId,address)=>{
    //     console.log(address);
    //     return new Promise((resolve,reject)=>{
    //         db.get().collection(collection.ADDRESS_COLLECTION).updateOne({_id:objectId(address)},{
    //             $set:{

    //                 name:address.name,
    //                 lastname:address.lastname



    //             }


    //         }).then((response)=>{
    //             resolve()
    //         })
    //     })
    // }

    /* -------------------------- checkout add address -------------------------- */
    // addnewaddress:((userId,addressData)=>{
    //     return new Promise((resolve,reject)=>{
    //         let adress= db.get().collection(collection.ADDRESS_COLLECTION).insertOne
    //     })
    // })


    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log(order, 'order');
                resolve(order)
            });

        })


    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', '4LInMiHtyf5tF4rXgeychCr4')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },

    changePaymentStatus: (orderId) => {
        return new Promise((reslove, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }
                ).then(() => {
                    reslove()
                })
        })
    },

    generatePayPal: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {
            const create_payment_json = {
                intent: "sale",
                payer: {
                    payment_method: "paypal",
                },
                redirect_urls: {
                    return_url: "http://localhost:2000/my-order",
                    cancel_url: "http://localhost:2000/",
                },
                transactions: [
                    {
                        item_list: {
                            items: [
                                {
                                    name: "Red Sox Hat",
                                    sku: "001",
                                    price: totalPrice,
                                    currency: "USD",
                                    quantity: 1,

                                },
                            ],
                        },
                        amount: {
                            currency: "USD",
                            total: totalPrice,

                        },
                        description: "Hat for the best team ever",
                    },
                ],
            };
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    resolve(payment);
                    console.log(payment)
                }

            });
        });
    },

}
