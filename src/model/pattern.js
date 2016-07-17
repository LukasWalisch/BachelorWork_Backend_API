/**
 * Created by lukas on 14.07.2016.
 */

import mongoose from 'mongoose'

const patternSchema = new mongoose.Schema({
    name: String,
    info: String,
    mappingIds: Array,
    relatedPatternIds: Array
});

export default mongoose.model('Pattern', patternSchema);