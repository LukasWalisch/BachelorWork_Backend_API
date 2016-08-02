import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';

//Required Salt factor for the hashes.
SALT_WORK_FACTOR = 10;

const userSchema = new mongoose.Schema({
	username: {type: String, required: true, index:{unique: true}},
	password: {type: String, required: true},
	ratedMappings: Array,
	role: String,
	token: String
});

userSchema.pre('save', function(next){
	var user = this;

	//Only Hash the password if ti has been modified
	if (!user.isModified('password')) return next();

	//generate a salt
	bcrypt.genSalt
})

export default mongoose.model('User', userSchema);
