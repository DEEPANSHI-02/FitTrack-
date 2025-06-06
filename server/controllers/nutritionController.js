const { NutritionLog } = require('../models');

// @desc    Get nutrition logs with date range
// @route   GET /api/nutrition/logs
// @access  Private
exports.getNutritionLogs = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Count total documents
    const total = await NutritionLog.countDocuments(query);

    // Get nutrition logs
    const nutritionLogs = await NutritionLog.find(query)
      .skip(startIndex)
      .limit(limit)
      .sort({ date: -1 });

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.json({
      success: true,
      count: nutritionLogs.length,
      pagination: {
        ...pagination,
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
      data: nutritionLogs,
    });
  } catch (error) {
    console.error('Error in getNutritionLogs:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};

// @desc    Get nutrition log by ID
// @route   GET /api/nutrition/logs/:id
// @access  Private
exports.getNutritionLog = async (req, res) => {
  try {
    const nutritionLog = await NutritionLog.findById(req.params.id);

    if (!nutritionLog) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: 'Nutrition log not found',
        },
      });
    }

    // Check if log belongs to user
    if (nutritionLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to access this nutrition log',
        },
      });
    }

    res.json({
      success: true,
      data: nutritionLog,
    });
  } catch (error) {
    console.error('Error in getNutritionLog:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};

// @desc    Create nutrition log entry
// @route   POST /api/nutrition/logs
// @access  Private
exports.createNutritionLog = async (req, res) => {
  try {
    const { date, meals, waterIntake, notes } = req.body;
    console.log('Creating nutrition log with date:', date);

    // Validate date
    const logDate = new Date(date);
    const today = new Date();

    // Set both dates to start of day in UTC
    const logDateUTC = new Date(
      Date.UTC(
        logDate.getUTCFullYear(),
        logDate.getUTCMonth(),
        logDate.getUTCDate()
      )
    );
    const todayUTC = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );

    console.log('Log date (UTC):', logDateUTC);
    console.log('Today (UTC):', todayUTC);

    // Check if date is in the future
    if (logDateUTC > todayUTC) {
      console.log('Date is in the future');
      return res.status(400).json({
        success: false,
        error: {
          code: 'FUTURE_DATE',
          message: 'Cannot create nutrition log for future dates',
        },
      });
    }

    // Check if a log already exists for this date
    const existingLog = await NutritionLog.findOne({
      userId: req.user._id,
      date: {
        $gte: logDateUTC,
        $lt: new Date(logDateUTC.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingLog) {
      console.log('Log already exists for date:', date);
      return res.status(400).json({
        success: false,
        error: {
          code: 'LOG_EXISTS',
          message: 'A nutrition log already exists for this date',
          existingLogId: existingLog._id,
        },
      });
    }

    // Create nutrition log
    const nutritionLog = await NutritionLog.create({
      userId: req.user._id,
      date: logDateUTC,
      meals: meals || [],
      waterIntake: waterIntake || 0,
      notes: notes || '',
    });

    console.log('Nutrition log created successfully:', nutritionLog._id);

    res.status(201).json({
      success: true,
      data: nutritionLog,
      message: 'Nutrition log created successfully',
    });
  } catch (error) {
    console.error('Error in createNutritionLog:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};

// @desc    Update nutrition log
// @route   PUT /api/nutrition/logs/:id
// @access  Private
exports.updateNutritionLog = async (req, res) => {
  try {
    const { date, meals, waterIntake, notes } = req.body;

    const nutritionLog = await NutritionLog.findById(req.params.id);

    if (!nutritionLog) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: 'Nutrition log not found',
        },
      });
    }

    // Check if log belongs to user
    if (nutritionLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this nutrition log',
        },
      });
    }

    // Update fields
    if (date) {
      nutritionLog.date = date;
    }
    if (meals) {
      nutritionLog.meals = meals;
    }
    if (waterIntake !== undefined) {
      nutritionLog.waterIntake = waterIntake;
    }
    if (notes !== undefined) {
      nutritionLog.notes = notes;
    }

    // Save changes
    await nutritionLog.save();

    res.json({
      success: true,
      data: nutritionLog,
      message: 'Nutrition log updated successfully',
    });
  } catch (error) {
    console.error('Error in updateNutritionLog:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};

// @desc    Delete nutrition log
// @route   DELETE /api/nutrition/logs/:id
// @access  Private
exports.deleteNutritionLog = async (req, res) => {
  try {
    const nutritionLog = await NutritionLog.findById(req.params.id);

    if (!nutritionLog) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: 'Nutrition log not found',
        },
      });
    }

    // Check if log belongs to user
    if (nutritionLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this nutrition log',
        },
      });
    }

    await nutritionLog.deleteOne();

    res.json({
      success: true,
      message: 'Nutrition log deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteNutritionLog:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};

// @desc    Add meal to nutrition log
// @route   POST /api/nutrition/logs/:id/meals
// @access  Private
exports.addMeal = async (req, res) => {
  try {
    const { type, time, foods, notes } = req.body;

    if (!type || !foods || !Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'Meal type and at least one food item are required',
        },
      });
    }

    const nutritionLog = await NutritionLog.findById(req.params.id);

    if (!nutritionLog) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: 'Nutrition log not found',
        },
      });
    }

    // Check if log belongs to user
    if (nutritionLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this nutrition log',
        },
      });
    }

    // Create new meal
    const newMeal = {
      type,
      time: time || new Date(),
      foods,
      notes: notes || '',
    };

    // Add to meals array
    nutritionLog.meals.push(newMeal);

    // Save changes
    await nutritionLog.save();

    res.status(201).json({
      success: true,
      data: newMeal,
      nutritionLog: nutritionLog,
      message: 'Meal added successfully',
    });
  } catch (error) {
    console.error('Error in addMeal:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};

// @desc    Update meal in nutrition log
// @route   PUT /api/nutrition/logs/:id/meals/:mealId
// @access  Private
exports.updateMeal = async (req, res) => {
  try {
    const { type, time, foods, notes } = req.body;

    const nutritionLog = await NutritionLog.findById(req.params.id);

    if (!nutritionLog) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: 'Nutrition log not found',
        },
      });
    }

    // Check if log belongs to user
    if (nutritionLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this nutrition log',
        },
      });
    }

    // Find meal by ID
    const mealIndex = nutritionLog.meals.findIndex(
      meal => meal._id.toString() === req.params.mealId
    );

    if (mealIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEAL_NOT_FOUND',
          message: 'Meal not found',
        },
      });
    }

    // Update meal fields
    if (type) {
      nutritionLog.meals[mealIndex].type = type;
    }
    if (time) {
      nutritionLog.meals[mealIndex].time = time;
    }
    if (foods) {
      nutritionLog.meals[mealIndex].foods = foods;
    }
    if (notes !== undefined) {
      nutritionLog.meals[mealIndex].notes = notes;
    }

    // Save changes
    await nutritionLog.save();

    res.json({
      success: true,
      data: nutritionLog.meals[mealIndex],
      nutritionLog: nutritionLog,
      message: 'Meal updated successfully',
    });
  } catch (error) {
    console.error('Error in updateMeal:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};

// @desc    Delete meal from nutrition log
// @route   DELETE /api/nutrition/logs/:id/meals/:mealId
// @access  Private
exports.deleteMeal = async (req, res) => {
  try {
    const nutritionLog = await NutritionLog.findById(req.params.id);

    if (!nutritionLog) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: 'Nutrition log not found',
        },
      });
    }

    // Check if log belongs to user
    if (nutritionLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this nutrition log',
        },
      });
    }

    // Find meal by ID
    const mealIndex = nutritionLog.meals.findIndex(
      meal => meal._id.toString() === req.params.mealId
    );

    if (mealIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEAL_NOT_FOUND',
          message: 'Meal not found',
        },
      });
    }

    // Remove meal
    nutritionLog.meals.splice(mealIndex, 1);

    // Save changes
    await nutritionLog.save();

    res.json({
      success: true,
      nutritionLog: nutritionLog,
      message: 'Meal deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteMeal:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};

// @desc    Update water intake
// @route   PATCH /api/nutrition/water
// @access  Private
exports.updateWaterIntake = async (req, res) => {
  try {
    const { date, amount } = req.body;

    if (amount === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'Water amount is required',
        },
      });
    }

    // Parse the date properly
    const targetDate = date ? new Date(date) : new Date();
    // Set to start of day to ensure consistent matching
    targetDate.setHours(0, 0, 0, 0);

    let nutritionLog = await NutritionLog.findOne({
      userId: req.user._id,
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!nutritionLog) {
      // Create new log for the day
      nutritionLog = await NutritionLog.create({
        userId: req.user._id,
        date: targetDate,
        waterIntake: amount,
        meals: [],
      });
    } else {
      // Update existing log
      nutritionLog.waterIntake = amount;
      await nutritionLog.save();
    }

    res.json({
      success: true,
      data: nutritionLog,
      message: 'Water intake updated successfully',
    });
  } catch (error) {
    console.error('Error in updateWaterIntake:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};

// @desc    Get nutrition statistics
// @route   GET /api/nutrition/stats
// @access  Private
exports.getNutritionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date range query
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) {
        dateQuery.date.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.date.$lte = new Date(endDate);
      }
    }

    // Base query - user's logs
    const baseQuery = { userId: req.user._id, ...dateQuery };

    // Aggregate daily averages
    const dailyAverages = await NutritionLog.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          avgCalories: { $avg: '$totalCalories' },
          avgProtein: { $avg: '$totalProtein' },
          avgCarbs: { $avg: '$totalCarbs' },
          avgFat: { $avg: '$totalFat' },
          avgWaterIntake: { $avg: '$waterIntake' },
        },
      },
    ]);

    // Calorie intake over time
    const caloriesTrend = await NutritionLog.aggregate([
      { $match: baseQuery },
      { $sort: { date: 1 } },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          calories: '$totalCalories',
        },
      },
    ]);

    // Macronutrient distribution
    const macroDistribution = await NutritionLog.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalProtein: { $sum: '$totalProtein' },
          totalCarbs: { $sum: '$totalCarbs' },
          totalFat: { $sum: '$totalFat' },
        },
      },
      {
        $project: {
          _id: 0,
          protein: '$totalProtein',
          carbs: '$totalCarbs',
          fat: '$totalFat',
        },
      },
    ]);

    // Meal type distribution
    const mealTypeDistribution = await NutritionLog.aggregate([
      { $match: baseQuery },
      { $unwind: '$meals' },
      {
        $group: {
          _id: '$meals.type',
          count: { $sum: 1 },
          avgCalories: { $avg: { $sum: '$meals.foods.calories' } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        dailyAverages: dailyAverages.length > 0 ? dailyAverages[0] : null,
        caloriesTrend,
        macroDistribution:
          macroDistribution.length > 0 ? macroDistribution[0] : null,
        mealTypeDistribution,
      },
    });
  } catch (error) {
    console.error('Error in getNutritionStats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error',
      },
    });
  }
};
