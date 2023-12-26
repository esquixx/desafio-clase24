import { Router } from 'express'
import productModel from '../dao/models/products.model.js'
import cartModel from '../dao/models/carts.model.js'

const router = Router()

router.post('/', async (req, res) => {
    try {
        const cart = req.body
        const addCart = await cartModel.create(cart)
        res.json({ status: 'success', payload: addCart })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', error: error.message })
    }
})

router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const pid = req.params.pid
        const product = await productModel.findById(pid)
        if (!product) {
            return res.status(404).json({ error: "Invalid product" })
        }

        const cid = req.params.cid
        const cart = await cartModel.findById(cid)
        if (!cart) {
            return res.status(404).json({ error: 'Invalid cart' })
        }

        const existingProduct = cart.products.findIndex((item) => item.product.equals(pid))
        if (existingProduct !== -1) {
            cart.products[existingProduct].quantity += 1
        } else {
            const newProduct = {
                product: pid,
                quantity: 1,
            }
            cart.products.push(newProduct)
        }
        const result = await cart.save()
        res.json({ status: 'success', payload: result })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', error: error.message })
    }
})

router.get('/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid
        const cart = await cartModel.findById(cartId)
        if (!cart) {
            return res
            .status(404)
            .json({ error: `The cart with id ${cartId} does not exist` })
        }
        res.json({ status: 'success', payload: cart })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', error: error.message })
    }
})

router.put('/:cid/product/:pid', async (req, res) => {
    try {
        const cid = req.params.cid
        const cart = await cartModel.findById(cid)
        if (!cart) {
            return res.status(404).json({ error: 'Invalid cart' })
        }
        const pid = req.params.pid
        const existingProduct = cart.products.findIndex((item) => item.product.equals(pid))
        if (existingProduct === -1) {
            return res.status(404).json({ error: 'Invalid product' })
        }
        const quantity = req.body.quantity
        if (!Number.isInteger(quantity) || quantity < 0) {
            return res
                .status(400)
                .json({ status: error, message: 'Quantity must be a positive integer' })
        }
        cart.products[existingProduct].quantity = quantity
        const result = await cart.save()
        res.json({
            status: "success",
            payload: result
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', error: error.message })
    }
})

router.put('/:cid', async (req, res) => {
    try {
        const cid = req.params.cid
        const cart = await cartModel.findById(cid)
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Invalid cart' })
        }
        const products = req.body.products
        if (!Array.isArray(products)) {
            return res
                .status(400)
                .json({ status: "error", message: 'The product array format is invalid' 
            })
        }
        cart.products = products
        const result = await cart.save()

        const totalPages = 1
        const prevPage = null
        const nextPage = null
        const page = 1
        const hasPrevPage = false
        const hasNextPage = false
        const prevLink = null
        const nextLink = null

        res.json({
            status: 'success',
            payload: result.products,
            totalPages,
            prevPage,
            nextPage,
            page,
            hasPrevPage,
            hasNextPage,
            prevLink,
            nextLink,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', error: error.message })
    }
})

router.delete('/:cid', async (req, res) => {
    try {
        const cid = req.params.cid
        const cart = await cartModel.findByIdAndUpdate(cid, { products: [] }, { new: true }).lean().exec()
        if (!cart) {
            return res
                .status(404)
                .json({ status: 'success', message: 'Invalid cart' })
        }
        res.json({
            status: 'success',
            payload: cart,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', error: error.message })
    }
})

router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const cid = req.params.cid
        const cart = await cartModel.findById(cid)
        if (!cart) {
            return res.status(404).json({ error: 'Invalid cart' })
        }
        const pid = req.params.pid
        const existingProduct = cart.products.findIndex((item) => item.product.equals(pid))
        if (existingProduct === -1) {
            return res.status(404).json({ error: 'Invalid product' })
        }
        cart.products.splice(existingProduct, 1)
        const result = await cart.save()
        res.json({
            status: 'success',
            payload: result,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', error: error.message })
    }
})

export default router