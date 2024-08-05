const express=require('express')
const Mongo=require('mongodb')
const path=require('path')
const bodyParser=require('body-parser')
require('dotenv').config()


const app=express()


app.set('view engine','ejs')
app.set('views','public')
app.use(express.static(path.join(__dirname,'style')))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

const {ObjectId}=require('mongodb')
const client=new Mongo.MongoClient(process.env.DB_URI)

async function connectToDB(){
    await client.connect()
    console.log('Connected successfully to DB')
    const collection=client.db('e-commerce').collection('products')
    return collection
}


// app.use((req,res,next)=>{
//     var date=new Date()
//     var day=date.getDay()
//     var hour=date.getHours()
    
//     if(day==0 || day==6 || hour<9 || hour>=17){
//         res.render('error')
//     }else{
//         next()
//     }
// })


app.get('/',async (req,res)=>{
    const collection=await connectToDB()
    const products=await collection.find({}).toArray()
    await client.close()
    res.render('home',{products})
})



app.get('/contact',(req,res)=>{
    res.render('contact')
})


app.post('/contact',(req,res)=>{
    console.log(req.body)
    res.redirect('/contact')
})


app.get('/add', (req, res) => {
    res.render('add')
})


app.post('/add', async (req, res) => {
    const { title,price,description,category, image, rate,count } = req.body
    const collection=await connectToDB()

    const lastProduct = await collection.findOne({}, { sort: { id: -1 } })
    const newId = (lastProduct?.id || 0) + 1

    const newProduct = {
        id: newId,
        title,
        price: parseFloat(price),
        description,
        category,
        image,
        rating: {
            rate : parseFloat(rate),
            count : parseInt(count)
        }
    }

    await collection.insertOne(newProduct)
    console.log('Product added successfully')
    res.redirect('/')
})

app.get('/product/:id', async(req, res) => {
    const id = req.params.id
    const collection=await connectToDB()
    const product=await collection.aggregate([{$match:{_id: new ObjectId(id)}}]).toArray()

    if (product) {
        res.render('product', { product: product[0] });
    } else {
        res.send('Product not found');
    }
})


app.get('/update/:id', async (req, res) => {
    const productId = parseInt(req.params.id)
    const collection=await connectToDB()

    const product = await collection.findOne({ id: productId })
    res.render('update', { product })
})


app.post('/update/:id', async (req, res) => {
    const productId = parseInt(req.params.id)
    const collection=await connectToDB()

    await collection.updateOne({ id: productId }, { $set: req.body })
    console.log('Product updated successfully')
    res.redirect('/')
})


app.get('/delete/:id', async (req, res) => {
    const productId = parseInt(req.params.id)
    const collection=await connectToDB()

    await collection.deleteOne({ id: productId })
    console.log('Product deleted successfully')
    res.redirect('/')
})




app.listen(process.env.PORT,()=>console.log(`server started at ${process.env.PORT}`))