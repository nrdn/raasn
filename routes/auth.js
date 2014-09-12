var User = require('../models/main.js').User;


// ------------------------
// *** Auth Block ***
// ------------------------


exports.main = function(req, res) {
  res.render('auth');
}


// ------------------------
// *** Login Block ***
// ------------------------


exports.login = function(req, res) {
  res.render('login');
}

exports.login_form = function(req, res) {
  var post = req.body;

  User.findOne({ 'login': post.login, 'password': post.password }).exec(function (err, person) {
    if (!person) return res.redirect('back');
    req.session.user_id = person._id;
    req.session.status = person.status;
    req.session.login = person.login;
    res.redirect('/auth');
  });
}


// ------------------------
// *** Logout Block ***
// ------------------------


exports.logout = function(req, res) {
  delete req.session.user_id;
  delete req.session.login;
  delete req.session.status;
  res.redirect('back');
}


// ------------------------
// *** Registr Block ***
// ------------------------


exports.registr = function(req, res) {
  if (!req.session.user_id)
    res.render('registr');
  else
    res.redirect('/');
}

exports.registr_form = function(req, res) {
  var post = req.body;

  var user = new User({
    login: post.login,
    password: post.password,
    email: post.email
  });

  user.save(function(err, user) {
    if(err) {throw err;}
    console.log('New User created');
    req.session.user_id = user._id;
    req.session.login = user.login;
    req.session.status = user.status;
    res.redirect('/login');
  });
}