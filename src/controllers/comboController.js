const comboService = require('../services/comboService');

/**
 * Get levels combo
 * @route GET /combo/levels
 */
const getLevelsCombo = async (req, res) => {
  try {
    const data = await comboService.getLevels();
    
    return res.status(200).json({
      data,
      message: 'success',
      status: true,
    });
  } catch (error) {
    console.error('Error getLevelsCombo:', error);
    return res.status(500).json({
      data: [],
      message: 'failed',
      status: false,
    });
  }
};

/**
 * Get subjects combo
 * @route GET /combo/subjects
 */
const getSubjectsCombo = async (req, res) => {
  try {
    const data = await comboService.getSubjects()

    return res.status(200).json({
      data,
      message: 'success',
      status: true
    })
  } catch (error) {
    console.error('Error getSubjectsCombo:', error)
    return res.status(500).json({
      data: [],
      message: 'failed',
      status: false
    })
  }
}

/**
 * Get majors combo
 * @route GET /combo/majors
 */
const getMajorsCombo = async (req, res) => {
  try {
    const data = await comboService.getMajors();
    
    return res.status(200).json({
      data,
      message: 'success',
      status: true,
    });
  } catch (error) {
    console.error('Error getMajorsCombo:', error);
    return res.status(500).json({
      data: [],
      message: 'failed',
      status: false,
    });
  }
};

/**
 * Get rombels combo
 * @route GET /combo/rombels
 */
const getRombelsCombo = async (req, res) => {
  try {
    const data = await comboService.getRombels();
    
    return res.status(200).json({
      data,
      message: 'success',
      status: true,
    });
  } catch (error) {
    console.error('Error getRombelsCombo:', error);
    return res.status(500).json({
      data: [],
      message: 'failed',
      status: false,
    });
  }
};

/**
 * Get roles combo (static)
 * @route GET /combo/roles
 */
const getRolesCombo = (req, res) => {
  try {
    const data = comboService.getRoles();
    
    return res.status(200).json({
      data,
      message: 'success',
      status: true,
    });
  } catch (error) {
    console.error('Error getRolesCombo:', error);
    return res.status(500).json({
      data: [],
      message: 'failed',
      status: false,
    });
  }
};

/**
 * Get teachers combo
 * @route GET /combo/teachers
 */
const getTeachersCombo = async (req, res) => {
  try {
    const data = await comboService.getTeachers();
    
    return res.status(200).json({
      data,
      message: 'success',
      status: true,
    });
  } catch (error) {
    console.error('Error getTeachersCombo:', error);
    return res.status(500).json({
      data: [],
      message: 'failed',
      status: false,
    });
  }
};

/**
 * Get students combo
 * @route GET /combo/students
 */
const getStudentsCombo = async (req, res) => {
  try {
    const data = await comboService.getStudents();
    
    return res.status(200).json({
      data,
      message: 'success',
      status: true,
    });
  } catch (error) {
    console.error('Error getStudentsCombo:', error);
    return res.status(500).json({
      data: [],
      message: 'failed',
      status: false,
    });
  }
};

module.exports = {
  getLevelsCombo,
  getMajorsCombo,
  getRombelsCombo,
  getRolesCombo,
  getTeachersCombo,
  getStudentsCombo,
  getSubjectsCombo
};
