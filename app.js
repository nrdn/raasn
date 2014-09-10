var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });
var async = require('async');

var mongoose = require('mongoose'),
    models = require('./models/main.js');
      mongoose.connect('localhost', 'main');

var express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    accepts = require('accepts'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    methodOverride = require('method-override'),
      app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.locals.pretty = true;

app.use(express.static(__dirname + '/public'));
app.use(multer({ dest: __dirname + '/uploads'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(cookieParser());

app.use(session({
  key: 'raasn.sess',
  resave: false,
  saveUninitialized: false,
  secret: 'keyboard cat',
  cookie: {
    path: '/',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));


app.use(function(req, res, next) {
  res.locals.session = req.session;
  res.locals.locale = req.cookies.locale || 'ru';
  next();
});


// -------------------
// *** Model Block ***
// -------------------


var User = models.User;
var Post = models.Post;


// ------------------------
// *** Midleware Block ***
// ------------------------


function checkAuth (req, res, next) {
  if (req.session.user_id)
    next();
  else
    res.redirect('/login');
}


// ------------------------
// *** Handlers Block ***
// ------------------------


var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};


function toMatrix(arr, row) {
  var a = [];
  for (var i = 0; i < row;) {
    a[i] ? a[i].push(arr.shift()) : (a[i] = []);
    i = ++i % row;
    if (!arr.length) return a;
  }
}


// ------------------------
// *** Post parms Block ***
// ------------------------




// ------------------------
// *** Index Block ***
// ------------------------


app.route('/').get(function(req, res) {
  res.redirect('/posts')
});


// ------------------------
// *** Posts Block ***
// ------------------------


app.route('/posts').get(function(req, res) {
  Post.aggregate()
  .group({
    '_id': { month: { $month: '$date' }, day: { $dayOfMonth: '$date' }, year: { $year: '$date' } },
    'posts': { $push: {title: '$title', description: '$description', _id: '$_id'} },
    'count': { $sum: 1 }
  })
  .sort({'_id.year': -1, '_id.month': -1, '_id.day': -1})
  .exec(function(err, dates) {
    res.render('posts', {dates: dates});
  });
});


// ------------------------
// *** Post Block ***
// ------------------------


app.route('/posts/:id').get(function(req, res) {
  var id = req.params.id;

  Post.findById(id).exec(function(err, post) {
    res.render('posts/post.jade', {post: post});
  });
});


// ------------------------
// *** Set Locale Block ***
// ------------------------


app.route('/lang/:locale').get(function(req, res) {
  res.cookie('locale', req.params.locale);
  res.redirect('back');
});


// ------------------------
// *** Auth Block ***
// ------------------------


app.route('/auth').get(checkAuth, function (req, res) {
  res.render('auth');
});


// ------------------------
// *** Admin Posts Block ***
// ------------------------


app.route('/auth/posts').get(checkAuth, function(req, res) {
  Post.find().exec(function(err, posts) {
    res.render('auth/posts/', {posts: posts});
  });
});


// ------------------------
// *** Add Posts Block ***
// ------------------------


var add_posts= app.route('/auth/posts/add');

add_posts.get(checkAuth, function(req, res) {
  res.render('auth/posts/add.jade');
});

add_posts.post(checkAuth, function(req, res) {
  var post = req.body;
  var files = req.files;

  var post_item = new Post();

  post_item.title.ru = post.ru.title;
  post_item.description.ru = post.ru.description;
  post_item.date = new Date(post.date.year, post.date.month, post.date.date);

  post_item.save(function(err, post_item) {
    res.redirect('/auth/posts');
  });
});


// ------------------------
// *** Edit Posts Block ***
// ------------------------


var edit_posts = app.route('/auth/posts/edit/:id');


edit_posts.get(checkAuth, function(req, res) {
  var id = req.params.id;

  Post.findById(id).exec(function(err, post) {
    res.render('auth/posts/edit.jade', {post: post});
  });
});

edit_posts.post(checkAuth, function(req, res) {
  var post = req.body;
  var id = req.params.id;

  Post.findById(id).exec(function(err, post_item) {

    post_item.title.ru = post.ru.title;
    post_item.description.ru = post.ru.description;
    post_item.date = new Date(post.date.year, post.date.month, post.date.date);

    post_item.save(function(err, post_item) {
      res.redirect('/auth/posts');
    });
  });
});


// ------------------------
// *** Login Block ***
// ------------------------


var login = app.route('/login');

login.get(function (req, res) {
  res.render('login');
});

login.post(function(req, res) {
  var post = req.body;

  User.findOne({ 'login': post.login, 'password': post.password }, function (err, person) {
    if (!person) return res.redirect('back');
    req.session.user_id = person._id;
    req.session.status = person.status;
    req.session.login = person.login;
    res.redirect('/auth');
  });
});


// ------------------------
// *** Logout Block ***
// ------------------------


app.route('/logout').get(function (req, res) {
  delete req.session.user_id;
  delete req.session.login;
  delete req.session.status;
  res.redirect('back');
});


// ------------------------
// *** Registr Block ***
// ------------------------


var registr = app.route('/registr');

registr.get(function(req, res) {
  if (!req.session.user_id)
    res.render('registr');
  else
    res.redirect('/');
});

registr.post(function (req, res) {
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
});


// ------------------------
// *** Static Block ***
// ------------------------


app.route('/contacts').get(function (req, res) {
  res.render('static/contacts.jade');
});

app.route('/sitemap.xml').get(function(req, res){
  res.sendfile('sitemap.xml',  {root: './public'});
});

app.route('/robots.txt').get(function(req, res){
  res.sendfile('robots.txt',  {root: './public'});
});


// ------------------------
// *** Error Handling Block ***
// ------------------------


// app.use(function(req, res, next) {
//   var accept = accepts(req);
//   res.status(404);

//   // respond with html page
//   if (accept.types('html')) {
//     res.render('error', { url: req.url, status: 404 });
//     return;
//   }

//   // respond with json
//   if (accept.types('json')) {
//       res.send({
//       error: {
//         status: 'Not found'
//       }
//     });
//     return;
//   }

//   // default to plain-text
//   res.type('txt').send('Not found');
// });

// app.use(function(err, req, res, next) {
//   var status = err.status || 500;

//   res.status(status);
//   res.render('error', { error: err, status: status });
// });


// ------------------------
// *** Connect server Block ***
// ------------------------


app.listen(3000);
console.log('http://127.0.0.1:3000')