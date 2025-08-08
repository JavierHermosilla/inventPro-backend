import mongoose from 'mongoose'

const manualInventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['increase', 'decrease'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [255, 'Reason is too long'],
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true })

manualInventorySchema.index({ productId: 1, userId: 1 })

manualInventorySchema.pre('validate', function (next) {
  if (this.type === 'decrease' && !this.reason) {
    this.invalidate('reason', 'Reason is required when decreasing inventory')
  }
  next()
})

const ManualInventory = mongoose.model('ManualInventory', manualInventorySchema)

export default ManualInventory
