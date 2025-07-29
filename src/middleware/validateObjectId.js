import mongoose from 'mongoose'

export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName]
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.starus(400).json({ message: `Invalid ${paramName}` })
  }
  next()
}
