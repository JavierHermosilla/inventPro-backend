export function pick (obj, allowedFields = []) {
  return allowedFields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      acc[field] = obj[field]
    }
    return acc
  }, {})
}
