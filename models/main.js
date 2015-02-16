var mongoose = require('mongoose'),
			Schema = mongoose.Schema;

var userSchema = new Schema({
		login: String,
		password: String,
		email: String,
		status: {type: String, default: 'User'},
		date: {type: Date, default: Date.now},
});

var postSchema = new Schema({
	title: {
		ru: String,
		en: String
	},
	description: {
		ru: String,
		en: String
	},
	hidden: Boolean,
	category: String,
	photo: String,
	date: {type: Date, default: Date.now}
});


// ------------------------
// *** Exports Block ***
// ------------------------


module.exports.User = mongoose.model('User', userSchema);
module.exports.Post = mongoose.model('Post', postSchema);