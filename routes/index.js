
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'BigBlueButton Node.js Client' })
};

exports.client = function(req, res){
	res.render('client', { title: 'Client', user: req.param("username") });
};