import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';

//Required Salt factor for the hashes.
const SALT_WORK_FACTOR = 10;

const userSchema = new mongoose.Schema({
	username: {type: String, required: true, index:{unique: true}},
	password: {type: String, required: true},
	ratedMappings: Array,
	comments: Array,
	role: {type: String, required: true},
	token: Object
});

userSchema.pre('save', function(next){
	var user = this;

	//Only Hash the password if ti has been modified
	if (!user.isModified('password')) return next();

	//generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err,salt){
		if(err) return next(err);

		//hash the password along with the new salt
		bcrypt.hash(user.password, salt, null, function(err,hash){
			if (err) return next(err);

			//override the clearthex password with the hashed one.
			user.password = hash;
			next();
		});
	});
});

//isMatch -> boolean
//catch callback with if(err) in calling function.
userSchema.methods.validatePassword = function(candidate,cb){
	bcrypt.compare(candidate, this.password, function(err, isMatch){
		if (err) return cb(err);
		return cb(null, isMatch);
	})
}

export default mongoose.model('User', userSchema);
