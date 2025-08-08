import mongoose from 'mongoose'

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  rut: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])$/.test(v)
      },
      message: props => `${props.value} no es un RUT válido`
    }
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  categories: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true })

const Supplier = mongoose.model('Supplier', supplierSchema)

export default Supplier
