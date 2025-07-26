import Product from '../models/product.model.js'

// creacion de productos
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body
    const newProduct = new Product({ name, description, price, stock, category })
    await newProduct.save()

    res.status(201).json({
      message: 'Product created successfully.',
      productId: newProduct._id
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Error creating the product.', error: err.message })
  }
}

// obtencion de todos los productos
export const products = async (req, res) => {
  try {
    // obtiene page y el limit de la query params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    // calcula cuantos doc saltar
    const skip = (page - 1) * limit

    // obtiene el total de productos
    const total = await Product.countDocuments()

    // obtiene los productos con su paginacion
    const products = await Product.find().skip(skip).limit(limit)

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products
    })
  } catch (err) {
    console.error('Error fetching products:', err)
    res.status(500).json({ message: 'Error fetching products.' })
  }
}
// obtencion de productos por id
export const productById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found.' })

    res.json(product)
  } catch (err) {
    res.status(500).json({ message: 'Error searching for product.', error: err.message })
  }
}

// actualizacion de productos (solo admin)
export const updateProduct = async (req, res) => {
  try {
    const updateProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    if (!updateProduct) return res.status(404).json({ message: 'Product not found.' })

    res.json({ message: 'Product updated.', product: updateProduct })
  } catch (err) {
    res.status(500).json({ message: 'Product  Error updating product.', error: err.message })
  }
}

// eliminacion de prodcto (solo admin)
export const deleteProduct = async (req, res) => {
  try {
    const deleteProduct = await Product.findByIdAndDelete(req.params.id)
    if (!deleteProduct) return res.status(404).json({ message: 'Product not found.' })

    res.json({ message: 'Product deleted.', product: deleteProduct })
  } catch (err) {
    console.error('Error deleting product:', err)
    res.status(500).json({ message: 'Error deleting product.', error: err.message })
  }
}
