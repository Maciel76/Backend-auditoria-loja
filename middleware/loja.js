// middleware/loja.js
const getLojaFromSession = (req, res, next) => {
  req.loja = req.session.loja || "000";
  next();
};

module.exports = { getLojaFromSession };
