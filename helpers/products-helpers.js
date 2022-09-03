const { response } = require('../app');
const collection = require('../config/collection');
const bcrypt = require('bcrypt');
var db = require('../config/connection');
const { CATEGORY_COLLECTION } = require('../config/collection');
var objectId = require('mongodb').ObjectId



module.exports = {


    addProduct: (products, callback) => {
        products.category = objectId(products.category)


        db.get().collection('products').insertOne(products).then((data) => {
            callback(data);

        })
    },


    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let categoryName = await db.get().collection(collection.PRODUCTS_COLLECTION).aggregate([

                {
                    $lookup: {
                        from: collection.CATEGORY_COLLECTION,
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                {
                    $project: {
                        me: { $arrayElemAt: ['$category', 0] },
                        Name: 1,
                        Price: 1,
                        Description: 1,
                        image: 1
                    }
                },

            ]).toArray()
            resolve(categoryName);
        })

    },


    addcategory: (userData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)

            })
        })
    },


    getCategory: () => {
        return new Promise((resolve, reject) => {
            let category = db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },

    getSingleCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(catId) }).then((category) => {
                resolve(category)
            })
        })
    },

    getProductsDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS_COLLECTION).findOne({ _id: objectId(proId) }).then((products) => {
                resolve(products)

            })
        })

    },

    deleteProducts: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS_COLLECTION).deleteOne({ _id: objectId(proId) }).then((response) => {
                resolve(response)
            })


        })
    },

    updateproducts: (proId, ProductsDetails) => {
        return new Promise(async (resolve, reject) => {
            let image = await db.get().collection(collection.PRODUCTS_COLLECTION).findOne({ _id: objectId(proId) })

            if (ProductsDetails.image.length == 0) {
                ProductsDetails.image = image.image
            }
            db.get().collection(collection.PRODUCTS_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    Name: ProductsDetails.Name,
                    category: objectId(ProductsDetails.category),
                    Price: ProductsDetails.Price,
                    Description: ProductsDetails.Description,
                    image: ProductsDetails.image
                }
            }).then((response) => {
                resolve()
            })


        })
    },


    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {
                resolve(response)
            })
        })
    },

    updateCategory: (catId, CategoryDetails) => {
        return new Promise(async (resolve, reject) => {
            var category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ Category: CategoryDetails.Category })

            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, {
                $set: {

                    category: CategoryDetails.Category


                }
            }).then((response) => {
                resolve()
            })


        })
    },

    blockuser: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(proId) }, { $set: { active: false } }).then((data) => {
                resolve(data)
            })

        })
    },



    Unblockuser: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(proId) }, { $set: { active: true } }).then((data) => {
                resolve(data)
            })
        })
    },


    categoryName: () => {
        return new Promise(async (resolve, reject) => {
            let categoryName = await db.get().collection(collection.PRODUCTS_COLLECTION).aggregate([

                {
                    $lookup: {
                        from: collection.CATEGORY_COLLECTION,
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'

                    }
                },
                {
                    $project: { me: { $arrayElemAt: ['$category', 0] } }

                },
            ]).toArray()
            resolve(categoryName)
        })

    },

    getAllOrderProducts: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },

    updateOrderStatus: (data) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(data.id) }, { $set: { status: data.status } }).then((response) => {
                resolve()
            })
        })
    },

    paymentChart: () => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: 'placed'

                    }
                },
                {
                    $group: {
                        _id: '$paymentMethod',
                        totalAmount: {
                            $sum: "$TotalAmount"
                        }
                    }
                }

            ]).toArray()
            resolve(order)
        })
    },


    viewbanner: () => {
        return new Promise(async (resolve, reject) => {
            let viewbanner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(viewbanner)
        })
    },


    addbanner: (banner) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((data) => {
                resolve(data)
            })
        })
    },


    getbanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },

    getsinlgebanner: (banId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).findOne({ _id: objectId(banId) }).then((banner) => {
                resolve(banner)

            })
        })

    },

    deletebanner: (banId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).deleteOne({ _id: objectId(banId) }).then((response) => {
                resolve(response)
            })


        })
    },


    editbanner: (banId, bannerDetails) => {
        return new Promise(async (resolve, reject) => {
            let image = await db.get().collection(collection.BANNER_COLLECTION).findOne({ _id: objectId(banId) })

            if (bannerDetails.image.length == 0) {
                bannerDetails.image = image.image
            }
            db.get().collection(collection.BANNER_COLLECTION).updateOne({ _id: objectId(banId) }, {
                $set: {
                    Name: bannerDetails.Name,
                    Description: bannerDetails.Description,
                    image: bannerDetails.image
                }
            }).then((response) => {
                resolve()
            })


        })
    },


    getdailyreport: (dt) => {
        console.log('lol');
        console.log(dt);
        return new Promise(async (resolve, reject) => {
            let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: { $nin: ['cancelled'] }
                    }
                },
                {
                    $unwind: '$products',
                },
                {
                    $project: {
                        TotalAmount: 1,
                        date: 1,
                        status: 1,
                        _id: 1,
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
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, totalAmount: 1, paymentMethod: 1, item: 1, product: { $arrayElemAt: ['$product', 0] }, quantity: 1, _id: 1
                    }
                },
                {
                    $match: { date: dt }
                },
                {
                    $group: {
                        _id: '$item',
                        quantity: { $sum: '$quantity' },
                        TotalAmount: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.TotalAmount' }] } },
                        Name: { $first: "$products.FirstName" },
                        date: { $first: "$date" },
                        price: { $first: "$product.TotalAmount" }

                    }
                }

            ]).toArray()
            console.log('kkkk');
            console.log(sales);
            resolve(sales)
        })
    },


    orderCount: (dt) => {
        return new Promise(async (resolve, reject) => {
            let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: { $nin: ['cancelled'] }
                    }
                },
                {
                    $project: { date: { $dateToString: { format:"%Y-%m-%d", date: "$date" } }, _id: 1 }
                },
                {
                    $match:{date:dt}
                },
                {
                    $count:'date'
                }
            ]).toArray()    
            resolve(sales)
        })
    }





}