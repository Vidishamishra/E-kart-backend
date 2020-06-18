const {Order, CartItem} = require('../models/order')
const {errorHandler} = require('../helpers/dbErrorhandler')

//middleware to attach orderId in url params
exports.orderById = (req, res, next, id) => {
    Order.findById(id)
        .populate("products.product", "name price")
        .exec((err, order) => {
            if (err || !order) {
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }

            req.order = order;
            next();
        })
}


//creating new order by user
exports.create = (req, res) => {
    // console.log("create order:", req.body);
    req.body.order.user = req.profile;
    const order = new Order(req.body.order);
    order.save()
    .select("-photo -pdf")
    .exec((error, data) => {
        if(error) {
            return res.status(400).json({
                error: errorHandler(error)
            })
        }
        res.json(data);
    })
}


//module to present all the orders by user
exports.listOrders = (req,res) => {
    Order.find()
        .populate("user", "_id name address")
        .sort("-created")
        .exec((err, orders) => {
            if(err) {
                return res.status(400).json({
                    error: errorHandler(error)
                })
            }
            res.json(orders);
        })
};


//module to check order status by admin
exports.getStatusValues = (req, res) => {
    res.json(Order.schema.path("status").enumValues);
};

//updating order status by the admin
exports.updateOrderStatus = (req, res) => {
    Order.update(
        {_id: req.body.orderId},
        { $set: {status: req.body.status}},
        (err, order) => {
            if (err) {
                return res.status(400).json({
                    error:errorHandler(err)
                })
            }
            res.json(order);
        }
    )
}












