const Category = require('../models/category');
const { errorHandler } = require('../helpers/dbErrorhandler');

//middleware to attach url params on route for category
exports.categoryById  = (req, res, next, id) => {
    Category.findById(id).exec((err, category) => {
        if (err || !category) {
            return res.status(400).json({
                error: 'category does not exist'
            });
        }
        req.category = category;
        next();
    })
}

//module to create a new category
exports.create = (req, res) => {
    const category = new Category(req.body)
    category.save((err, data) => {
        if(err) {
            return res.status(400).json({
                error: errorHandler(err)
            })
        }

        res.json({data});
    });
};

//module to retrieve single category
exports.read = (req, res) => {
    
    return res.json(req.category);
};


//module to make changes in a predefined category:- updation
exports.update = (req, res) => {
    const category = req.category
    category.name = req.body.name
    category.save((err, data) => {
        if(err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json(data);
    })
};

//module to delete a paticular category
exports.remove = (req, res) => {
    const category = req.category
    category.name = req.body.name
    category.remove((err, data) => {
        if(err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({
            message: 'category deleted'
        });
    })
};

//retreive all the categories
exports.list = (req, res) => {
    Category.find().exec((err, data) => {
        if(err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json(data)
    })
};