export const users = (req, res) => res.send('List all users')
export const userById = (req, res) => res.send(`View user with ID: ${req.params.id}`)
export const updateUser = (req, res) => res.send(`Update user with ID: ${req.params.id}`)
export const deleteUser = (req, res) => res.send(`Delete user with ID: ${req.params.id}`)
