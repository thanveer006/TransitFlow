import mongoose from 'mongoose';

const RouteInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  distanceKm: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  }
}, { timestamps: true });

const RouteInfo = mongoose.model('RouteInfo', RouteInfoSchema);

export default RouteInfo;
