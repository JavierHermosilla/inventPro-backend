import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'shipped', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
})

export default mongoose.model('Order', orderSchema)
