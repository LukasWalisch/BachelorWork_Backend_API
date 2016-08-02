/**
 * Created by Richard on 14.07.2016.
 */
import mongoose from 'mongoose';

const mappingSchema = new mongoose.Schema({
    patternId: {type: String, required: true},
    tacticId: {type: String, required: true},
	info: String
});


export default mongoose.model('Mapping', mappingSchema);
