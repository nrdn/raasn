var Post = require('../models/main.js').Post;


// ------------------------
// *** Posts Block ***
// ------------------------


exports.posts = function(req, res) {
  Post.aggregate()
  .group({
    '_id': {
      year: { $year: '$date' },
      month: { $month: '$date' },
      day: { $dayOfMonth: '$date' }
    },
    'posts': {
      $push: {
        title: '$title',
        description: '$description',
        _id: '$_id',
        time: {
          hours: { $hour: '$date' },
          minutes: { $minute: '$date' }
        }
      }
    },
    'count': { $sum: 1 }
  })
  .sort({'_id.year': -1, '_id.month': -1, '_id.day': -1})
  .exec(function(err, dates) {
    res.render('posts', {dates: dates});
  });
}


// ------------------------
// *** Post Block ***
// ------------------------


exports.post = function(req, res) {
  var id = req.params.id;

  Post.findById(id).exec(function(err, post) {
    res.render('posts/post.jade', {post: post});
  });
}