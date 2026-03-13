const Order = require('../../../models/order');
const moment = require('moment');

function orderController(){
    return {

        // Store Order
        async store(req,res){

            const { phone, address } = req.body;

            // Validation
            if(!phone || !address){
                req.flash('error','All fields are required!');
                return res.redirect('/cart');
            }

            try{

                const order = new Order({
                    customerId: req.user._id,
                    items: req.session.cart.items,
                    phone: phone,
                    address: address
                });

                const result = await order.save();

                req.flash('success','Order placed Successfully!');
                delete req.session.cart;

                // Emit event
                const eventEmitter = req.app.get('eventEmitter');
                eventEmitter.emit('orderPlaced', result);

                return res.redirect('/customers/orders');

            }catch(err){

                req.flash('error','Something went wrong!');
                return res.redirect('/cart');

            }
        },

        // Show all orders
        async index(req,res){

            const orders = await Order.find(
                { customerId: req.user._id },
                null,
                { sort: { 'createdAt': -1 } }
            );

            res.header(
                'Cache-Control',
                'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
            );

            res.render('customers/orders',{ orders:orders, moment:moment });
        },

        // Single order
        async status(req,res){

            const { id } = req.params;

            const order = await Order.findOne({ _id:id });

            if(req.user._id.toString() === order.customerId.toString()){
                return res.render('customers/singleOrder',{ order });
            }

            return res.redirect('/');
        }
    }
}

module.exports = orderController;
