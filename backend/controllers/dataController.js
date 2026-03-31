import RouteInfo from '../models/RouteInfo.js';

// @route   GET /api/data
// @desc    Get all root data
// @access  Public
export const getData = async (req, res) => {
  try {
    // const data = await RouteInfo.find();
    res.json({ message: 'Success', data: [] });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
