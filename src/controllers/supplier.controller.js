export const supplier = (req, res) => res.send('List all supplier')
export const addsupplier = (req, res) => res.send('Add supplier')
export const editsupplier = (req, res) => res.send(`Edit to supplier with ID: ${req.params.id}`)
export const deletesupplier = (req, res) => res.send(`Update to supplier with ID: ${req.params.id}`)
