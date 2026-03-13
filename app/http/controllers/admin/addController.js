const Menu = require('../../../models/menu');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

function addController(){
    return {

        index(req,res){
            res.render('admin/cakeAdder.ejs');
        },

        async addCake(req,res){

            const { cake, size, price } = req.body;

            if(!cake || !size || !price){
                req.flash('error','All fields are required.');

                if(req.file){
                    await unlinkAsync(`public/img/${req.file.filename}`);
                }

                return res.redirect('/addcakes');
            }

            Menu.exists({ name:cake, size:size }, async (err,result)=>{

                if(result){
                    req.flash('error','This cake is already in the menu.');

                    if(req.file){
                        await unlinkAsync(`public/img/${req.file.filename}`);
                    }

                    return res.redirect('/addcakes');

                }else{

                    // default image if none uploaded
                    let imageName = "cake.png";

                    if(req.file){
                        imageName = req.file.filename;
                    }

                    const menuItem = new Menu({
                        name: cake,
                        price: price,
                        size: size,
                        image: imageName
                    });

                    menuItem.save()
                    .then(menuItem=>{
                        req.flash('success','Item added successfully.');
                        return res.redirect('/');
                    })
                    .catch(err=>{
                        req.flash('error','Something went wrong.');
                        return res.redirect('/addcakes');
                    });
                }
            });
        },

        async deleteCake(req,res){

            await Menu.findOneAndDelete({_id:req.body.thatcake});

            if(req.body.filenameofcake !== "cake.png"){
                await unlinkAsync(`public/img/${req.body.filenameofcake}`);
            }

            return res.redirect('/');
        }
    }
}

module.exports = addController;
