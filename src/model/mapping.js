/**
 * Created by Richard on 14.07.2016.
 */
import mongoose from 'mongoose';

const mappingSchema = new mongoose.Schema({
    patternId: String,
    tacticId: String
});

export default mongoose.model('Mapping', mappingSchema);