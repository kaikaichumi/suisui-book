const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Store = require('../models/Store');
const Staff = require('../models/Staff');
const ServiceCategory = require('../models/ServiceCategory');
const Portfolio = require('../models/Portfolio');

// GET /api/discover/categories - 列出所有啟用的服務分類
router.get('/categories', async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ active: true })
      .sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('取得分類失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// GET /api/discover/stylists/featured - 取得推薦設計師
router.get('/stylists/featured', async (req, res) => {
  try {
    const stylists = await Staff.find({
      active: true,
      discoverable: true,
      featured: true
    })
      .populate('storeId', 'name slug address location coverImage')
      .populate('categories', 'name slug icon')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(10);

    const stylistIds = stylists.map(s => s._id);
    const portfolios = await Portfolio.aggregate([
      { $match: { staffId: { $in: stylistIds }, active: true } },
      { $sort: { sortOrder: 1 } },
      { $group: { _id: '$staffId', images: { $push: { url: '$thumbnailUrl', imageUrl: '$imageUrl', title: '$title' } } } },
      { $project: { images: { $slice: ['$images', 3] } } }
    ]);

    const portfolioMap = {};
    portfolios.forEach(p => { portfolioMap[p._id.toString()] = p.images; });

    const results = stylists.map(s => ({
      ...s.toObject(),
      portfolioPreview: portfolioMap[s._id.toString()] || []
    }));

    res.json(results);
  } catch (error) {
    console.error('取得推薦設計師失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// GET /api/discover/stylists/:slugOrId - 設計師完整個人檔案
router.get('/stylists/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;

    let stylist;
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      stylist = await Staff.findOne({ _id: slugOrId, active: true });
    }
    if (!stylist) {
      stylist = await Staff.findOne({ slug: slugOrId, active: true });
    }
    if (!stylist) {
      return res.status(404).json({ message: '找不到此設計師' });
    }

    await stylist.populate('storeId', 'name slug address phone location coverImage businessHours');
    await stylist.populate('categories', 'name slug icon');
    await stylist.populate('services', 'name description priceMin priceMax duration');

    const portfolio = await Portfolio.find({ staffId: stylist._id, active: true })
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      ...stylist.toObject(),
      portfolio
    });
  } catch (error) {
    console.error('取得設計師檔案失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// GET /api/discover/stylists - 搜尋設計師（geo + 分類 + 關鍵字）
router.get('/stylists', async (req, res) => {
  try {
    const {
      lat, lng, radius = 10,
      category, q, minRating,
      sort = 'rating',
      page = 1, limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Step 1: 若有座標，先找附近的店家
    let nearbyStoreIds = null;
    let storeDistanceMap = {};

    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const radiusMeters = parseFloat(radius) * 1000;

      const nearbyStores = await Store.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parsedLng, parsedLat] },
            distanceField: 'distance',
            maxDistance: radiusMeters,
            query: { active: true },
            spherical: true
          }
        },
        { $project: { _id: 1, distance: 1 } }
      ]);

      nearbyStoreIds = nearbyStores.map(s => s._id);
      nearbyStores.forEach(s => {
        storeDistanceMap[s._id.toString()] = Math.round(s.distance);
      });

      if (nearbyStoreIds.length === 0) {
        return res.json({ stylists: [], total: 0, page: pageNum, totalPages: 0 });
      }
    }

    // Step 2: 組合查詢條件
    const staffQuery = { active: true, discoverable: true };

    if (nearbyStoreIds) {
      staffQuery.storeId = { $in: nearbyStoreIds };
    }
    if (category) {
      staffQuery.categories = mongoose.Types.ObjectId.isValid(category)
        ? new mongoose.Types.ObjectId(category)
        : category;
    }
    if (minRating) {
      staffQuery['rating.average'] = { $gte: parseFloat(minRating) };
    }
    if (q) {
      staffQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { specialties: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }

    // Step 3: 排序
    const sortOptions = {
      rating: { 'rating.average': -1, 'rating.count': -1 },
      newest: { createdAt: -1 },
      name: { name: 1 }
    };
    const sortBy = sortOptions[sort] || sortOptions.rating;

    // Step 4: 查詢 + 分頁
    const [stylists, total] = await Promise.all([
      Staff.find(staffQuery)
        .populate('storeId', 'name slug address location coverImage')
        .populate('categories', 'name slug icon')
        .sort(sortBy)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Staff.countDocuments(staffQuery)
    ]);

    // Step 5: 附上作品集縮圖預覽
    const stylistIds = stylists.map(s => s._id);
    const portfolios = await Portfolio.aggregate([
      { $match: { staffId: { $in: stylistIds }, active: true } },
      { $sort: { sortOrder: 1 } },
      { $group: { _id: '$staffId', images: { $push: { url: '$thumbnailUrl', imageUrl: '$imageUrl', title: '$title' } } } },
      { $project: { images: { $slice: ['$images', 3] } } }
    ]);

    const portfolioMap = {};
    portfolios.forEach(p => { portfolioMap[p._id.toString()] = p.images; });

    const results = stylists.map(s => {
      const obj = s.toObject();
      obj.portfolioPreview = portfolioMap[s._id.toString()] || [];
      if (storeDistanceMap[s.storeId?._id?.toString()]) {
        obj.distance = storeDistanceMap[s.storeId._id.toString()];
      }
      return obj;
    });

    // 若依距離排序
    if (sort === 'distance' && lat && lng) {
      results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    res.json({
      stylists: results,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('搜尋設計師失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// GET /api/discover/stores/nearby - 搜尋附近店家
router.get('/stores/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10, category, page = 1, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: '請提供位置座標 (lat, lng)' });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const matchQuery = { active: true };
    if (category) {
      matchQuery.categories = mongoose.Types.ObjectId.isValid(category)
        ? new mongoose.Types.ObjectId(category)
        : category;
    }

    const stores = await Store.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distance',
          maxDistance: parseFloat(radius) * 1000,
          query: matchQuery,
          spherical: true
        }
      },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
      {
        $project: {
          name: 1, slug: 1, address: 1, phone: 1, description: 1,
          location: 1, coverImage: 1, categories: 1, distance: 1,
          businessHours: 1
        }
      }
    ]);

    res.json({ stores, page: pageNum });
  } catch (error) {
    console.error('搜尋附近店家失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
