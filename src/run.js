import messageModel from './dao/models/messages.model.js'
import productsRouter from './routes/products.router.js'
import cartsRouter from './routes/carts.router.js'
import viewsProductsRouter from './routes/views.router.js'
import jwtRouter from './routes/jwt.router.js'
import { passportCall } from './utils.js'

const run = (io, app) => {
    // Middleware para agregar el objeto io a cada solicitud
    app.use((req, res, next) => {
        req.io = io
        next()
    })

    // Rutas de la API
    app.use('/api/products', productsRouter)
    app.use('/api/carts', cartsRouter)
    app.use('/jwt', jwtRouter)

    // Ruta protegida con JWT
    app.use('/products', passportCall('jwt'),  viewsProductsRouter)         

    // Manejo de eventos de Socket.IO
    io.on('connection', async (socket) => {
        socket.on('productList', (data) => {
            console.log(data)
            io.emit('updatedProducts', data)
        })
        socket.on('cartList', (data) => {
            io.emit('updatedCarts', data)
        })
    
        let messages = (await messageModel.find()) ? await messageModel.find() : []
    
        socket.broadcast.emit('alerta')
        socket.emit('logs', messages)
        socket.on('message', (data) => {
            messages.push(data)
            messageModel.create(messages)
            io.emit('logs', messages)
        })
    })

    // Ruta de inicio
    app.get('/', (req, res) => res.render('index', { name: 'Coderhouse' }))
}

export default run


/*
app.use('/products', passportCall('jwt'),  viewsProductsRouter)         // Antes ingresaba directamente a la vista, le colocamos una capa (middleware), para que sea jwt, a traves de passport, que verifique si le da acceso o no a esta vista 'viewsProductsRouter' */
