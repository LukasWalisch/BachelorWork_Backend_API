import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	username: String,
	password: String,
	ratedMappings: Array
});

export default mongoose.model('Tactic', tacticsSchema);
