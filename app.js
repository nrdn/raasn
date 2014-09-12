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
// *** Routes Block ***
// -------------------

var main = require('./routes/main.js');
var blog = require('./routes/blog.js');
var auth = require('./routes/auth.js');
var content = require('./routes/content.js');
var files = require('./routes/files.js');
// var admin = require('./routes/admin.js');

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
// *** Main Block ***
// ------------------------

app.get('/', main.index);
app.get('/lang/:locale', main.locale);

// ------------------------
// *** Blog Block ***
// ------------------------

app.get('/posts', blog.posts);
app.get('/posts/:id', blog.post);

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
  var date = new Date();
  var hours = date.getHours();
  var minutes = date.getMinutes();

  var post_item = new Post();

  post_item.title.ru = post.ru.title;
  post_item.description.ru = post.ru.description;
  post_item.date = new Date(Date.UTC(post.date.year, post.date.month, post.date.date, hours, minutes));

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
  var date = new Date();
  var hours = date.getHours();
  var minutes = date.getMinutes();

  Post.findById(id).exec(function(err, post_item) {

    post_item.title.ru = post.ru.title;
    post_item.description.ru = post.ru.description;
    post_item.date = new Date(Date.UTC(post.date.year, post.date.month, post.date.date, hours, minutes));

    post_item.save(function(err, post_item) {
      res.redirect('/auth/posts');
    });
  });
});



// ------------------------
// *** Auth Block ***
// ------------------------

app.get('/auth', checkAuth, auth.main);

// ------------------------
// *** Login Block ***
// ------------------------

app.get('/login', auth.login);
app.post('/login', auth.login_form);

// ------------------------
// *** Logout Block ***
// ------------------------

app.get('/logout', auth.logout);

// ------------------------
// *** Registr Block ***
// ------------------------

app.get('/registr', auth.registr);
app.post('/registr', auth.registr_form);

// ------------------------
// *** Content Block ***
// ------------------------

app.get('/contacts', content.contacts);

// ------------------------
// *** Files Block ***
// ------------------------

app.get('/sitemap.xml', files.sitemap);
app.get('/robots.txt', files.robots);

// ------------------------
// *** Error Handling Block ***
// ------------------------


app.use(function(req, res, next) {
  var accept = accepts(req);
  res.status(404);

  // respond with html page
  if (accept.types('html')) {
    res.render('error', { url: req.url, status: 404 });
    return;
  }

  // respond with json
  if (accept.types('json')) {
      res.send({
      error: {
        status: 'Not found'
      }
    });
    return;
  }

  // default to plain-text
  res.type('txt').send('Not found');
});

app.use(function(err, req, res, next) {
  var status = err.status || 500;

  res.status(status);
  res.render('error', { error: err, status: status });
});


// ------------------------
// *** Connect server Block ***
// ------------------------


app.listen(3000);
console.log('http://127.0.0.1:3000')