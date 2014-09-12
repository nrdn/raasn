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
var admin = require('./routes/admin.js');

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



// === Main Routes

app.get('/', main.index);
app.get('/lang/:locale', main.locale);

// === Blog Routes

app.get('/posts', blog.posts);
app.get('/posts/:id', blog.post);

// === Admin Posts Routes

app.get('/auth/posts', checkAuth, admin.posts_list);

app.get('/auth/posts/add', checkAuth, admin.posts_add);
app.post('/auth/posts/add', checkAuth, admin.posts_add_form);

app.get('/auth/posts/edit/:id', checkAuth, admin.posts_edit);
app.post('/auth/posts/edit/:id', checkAuth, admin.posts_edit_form);

// === Auth Routes

app.get('/auth', checkAuth, auth.main);

// === Login Routes

app.get('/login', auth.login);
app.post('/login', auth.login_form);

// === Logout Routes

app.get('/logout', auth.logout);

// === Registr Routes

app.get('/registr', auth.registr);
app.post('/registr', auth.registr_form);

// === Content Routes

app.get('/contacts', content.contacts);

// === Files Routes

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