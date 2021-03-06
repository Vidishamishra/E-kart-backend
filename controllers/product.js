const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const { errorHandler } = require('../helpers/dbErrorhandler');
const Product = require('../models/product');
const Rating = require('../models/rating');
const Comment = require('../models/comment');
const mongoose = require('mongoose'); 
// const pdfParse = require('pdf-parse');
// const pdf2html = require('pdf2html');
// const pdftohtml = require('pdftohtmljs')



//middleware to attach product id to url params
exports.productById = (req, res, next, id) => {
    Product.findById(id)
    .populate('category')
    .exec((err, product) => {
        if(err || !product){
            return res.status(400).json({
                error: "Product not found"
            });
        }
        req.product = product;
        next();
    })
}

//module to get single product
exports.read = (req, res) => {
    req.product.photo = undefined
    req.product.pdf = undefined
    return res.json(req.product);
}


//creating a new product
exports.create = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            });
        }
        
        const { name, description, price, category, quantity, shipping } = fields;

        if (!name || !description || !price || !category || !quantity || !shipping) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }

        let product = new Product(fields);

        if (files.photo) {
            if (files.photo.size > 1000000) {
                return res.status(400).json({
                    error: 'Image should be less than 1mb in size'
                });
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }

      if(files.pdf) {
        product.pdf.data = fs.readFileSync(files.pdf.path);
        product.pdf.contentType = files.pdf.type;
      }

        product.save((err, result) => {
            if (err) {
                console.log('PRODUCT CREATE ERROR ', err);
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(result);
        });
    });
};




//deleting a product
exports.remove = (req, res) => {
    let product = req.product
    product.remove((err, deletedProduct) => {
        if(err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({
           
            "message" : "product deleted successfully"
        })
    })
}

//updating the exixting product
exports.update = (req, res) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, (err, fields, files) => {
        if(err) {
            return res.status(400).json({
                error: 'image could not be uploaded'
            })
        }

        let product = req.product
            product = _.extend(product, fields)

        if(files.photo) {
             if(files.photo.size > 1000000){
                 return res.status(400).json({
                     error: "image should be less than 1mb in size"
                 });
             }
            product.photo.data = fs.readFileSync(files.photo.path)
            product.photo.contentType = files.photo.type
        }

        if(files.pdf) {
            product.pdf.data = fs.readFileSync(files.pdf.path);
            product.pdf.contentType = files.pdf.type;
          }

        product.save((err, result) => {
            if(err) {
                return res.status(400).json({
                    err
                })
            }

            res.json(result);
        })
    
    })
};

//module for fetching products in home page
exports.list = (req, res) => {
    let order = req.query.order ? req.query.order : 'asc'
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id'
    let limit = req.query.limit ? parseInt(req.query.limit) : 6

    Product.find()
        .select("-photo")
        .populate('category')
        .sort([[sortBy, order]])
        .limit(limit)
        .exec((err, products) => {
                if(err) {
                    return res.status(400).json({
                        error: "Products not found"
                    });
                }
                res.json(products);
        })
};


exports.newlyAddedProduct = (req, res) => {
    let order = req.query.order ? req.query.order : 'asc'
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id'
    let limit = req.query.limit ? parseInt(req.query.limit) : 1

    Product.find()
        .select("-photo -pdf")
        .populate('category')
        .sort([[sortBy, order]])
        .limit(limit)
        .exec((err, products) => {
                if(err) {
                    return res.status(400).json({
                        error: "Products not found"
                    });
                }
                res.json(products);
        })
}

exports.listRelated = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    Product.find({_id: {$ne: req.product}, category: req.product.category})
    .limit(limit)
    .populate('category', '_id name')
    .exec((err, products) => {
        if (err) {
            return res.status(400).json({
                error: "Products not found"
            });
        }
        res.json(products);
    })
};

exports.listCategories = (req, res) => {
    Product.distinct("category", {}, (err, categories) => {
        if (err) {
            return res.status(400).json({
                error: "Products not found"
            });
        }
        res.json(categories)
    })
};

 
exports.listBySearch = (req, res) => {
    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};
 
   
    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }
 
    Product.find(findArgs)
        .select("-photo -pdf")
        .populate("category")
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: "Products not found"
                });
            }
            res.json({
                size: data.length,
                data
            });
        });

};

exports.photo = (req, res, next) => {
    if(req.product.photo.data) {
        res.set('Content-Type', req.product.photo.contentType)
        return res.send(req.product.photo.data);
    }
    next();
};

// 1.exports.pdfRead = (req, res, next) => {
//     if(req.product.pdf.data) {
//         // res.set('Content-Type', req.product.pdf.contentType)
//        console.log(req.product.pdf);
//        pdf2html.html('sample', (err, html) => {
//         if(err) {
//             return res.status(200).json({ err })
//         } else {
//             console.log(html);
//         }
//     })
//     }
//     next()
// }

// 2.exports.pdfRead = (req, res, next) => {
//     if(req.product.pdf.data) {
//         pdfParse(req.product.pdf.data).then(function(data) {
//             return res.send({data });
//         })
//     }
//     next();
// }

exports.pdfRead = (req, res, next) => {
    if(req.product.pdf.data) {
        res.set('Content-Type', req.product.pdf.contentType)
        return res.send(req.product.pdf.data);
    }
    next();
};

exports.listSearch = (req, res) => {
    const query = {}
    if(req.query.search){
        query.name = {$regex: req.query.search, $options: 'i'}
        if(req.query.category && req.query.category != 'All'){
            query.category = req.query.category
        }
        Product.find(query, (err, products) => {
            if(err) {
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }
            res.json(products)
        }).select('-photo');

    }
}

exports.decreaseQuantity = (req, res, next) => {
    let bulkOps = req.body.order.products.map(item => {
        return {
            updateOne: {
                filter: { _id: item._id },
                update: { $inc: { quantity: -item.count, sold: +item.count }}
            }
        }
    });

    Product.bulkWrite(bulkOps, {}, (error,products) => {
        if(error) {
            return res.status(400).json({
                error: "Could not update product"
            })
        }
        next();
    })
}

exports.createRatings = (req, res) => {
    const rating = parseInt(req.query.rating)

    if (!rating)
        return res.status(400).json({
            error: "Cannot find rating"
        });

    const userId = req.profile.id;
    const productId = req.product.id;
    // console.log(typeof (productId));
    // console.log(rating, userId, productId);

    Rating.findOne({_userId: userId}, function(err, user){
        if(!user){
            const rate = new Rating({ rating: rating, _userId: userId, _productId: productId });
            rate.save((err, data) => {
                if (err) {
                    res.status(400).json({
                        err: "Rating could not be added!"
                    })
                }
        
                Rating.aggregate(
                    [{ $match: { _productId: mongoose.Types.ObjectId(productId) } },
                    {
                        $group:
                        {
                            _id: "$_productId",
                            averageRating: { $avg: "$rating" }
                        }
                    }]
                ).exec((err, result) => {
                    if (err) return res.status(400).json({
                        err: err.message
                    })
                    // console.log(result);
                    const {averageRating} = result[0];
                    // console.log("avg rate of product", averageRating)
                    Product.findOneAndUpdate({ _id: productId }, { rating: averageRating }, { new: true },
                        (err, rating) => {
                            if (err) {
                                return res.status(400).json({
                                    err: err.message
                                })
                            }
                        })
                        // console.log("avg rate of product", averageRating);
                    return res.json({ result })
                })
            })
        } else {
            Rating.findOneAndUpdate({_userId: userId, _productId: productId}, {rating: rating},{new: true},
                (err, response) => {
                        if(err) return res.status(400).send("Rating not updated")
                
                Rating.aggregate(
                    [{ $match: { _productId: mongoose.Types.ObjectId(productId) } },
                    {
                        $group:
                        {
                            _id: "$_productId",
                            averageRating: { $avg: "$rating" }
                        }
                    }]
                ).exec((err, result) => {
                    if (err) return res.status(400).json({
                        err: err.message
                    })
                    // console.log(result);
                    const {averageRating} = result[0];
                    // console.log("avg rate of product", averageRating)
                    Product.findOneAndUpdate({ _id: productId }, { rating: averageRating }, { new: true },
                        (err, rating) => {
                            if (err) {
                                return res.status(400).json({
                                    err: err.message
                                })
                            }
                        })
                        // console.log("avg rate of product", averageRating);
                    return res.json({ result })
                })
            })
        }

    })
}

exports.addComment = (req, res) => {
    const userId = req.profile.id;
    const username = req.profile.name;
    const productId = req.product.id;

    console.log(req.body);

   Comment.findOne({_userId: userId}, (err, user) => {
        if(!user){
            
            // console.log("the user who commented", username);
            
            const comment = new Comment({ Content: req.body.comment, _userId: userId, Username: username, _productId: productId});
            comment.save((err, data) => {
                if(err) {
                    return res.status(400).json({
                        error: err.message
                    })
                }
                return res.status(200).json({ data })
            })
        } else {
            Comment.findOneAndUpdate({_userId: userId, _productId: productId}, {Content: req.body.comment}, {new: true},
                (error, result) => {
                    if(error) {
                        res.status(400).json({
                            error: error.message
                        })
                    }
                    return res.status(200).json({ result })
                })
        }
   })
}

exports.fetchAllComments = (req, res) => {
       let skip = parseInt(req.query.skip)

    Comment.find({_productId: req.product.id}, 'Content _userId Username')
       .skip(skip)
       .limit(5)
       .exec((err, result) => {
        if(err) {
            return res.status(400).json({
                error: err.message
            })
        }
        return res.status(200).json({result, size:result.length})
       })

}


 exports.displayProductRating = (req, res) => {
     const productId = req.query.id;
    
      Product.findOne({_id: productId},{rating: req.query.rate},
    (err, rating) => {
        if(err) {
            return res.status(400).json({
                err: err.message
            })
        }
        return res.send({rating})
    }
    
 )
 }


















