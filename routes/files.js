exports.sitemap = function(req, res){
  res.sendfile('sitemap.xml',  {root: './public'});
}

exports.robots = function(req, res){
  res.sendfile('robots.txt',  {root: './public'});
}