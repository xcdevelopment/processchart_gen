// server/controllers/projectController.js
const Project = require('../models/Project');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    全プロジェクトの取得
// @route   GET /api/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res, next) => {
  // ユーザーに関連するプロジェクトのみ取得
  const projects = await Project.find({ createdBy: req.user.id });
  
  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects
  });
});

// @desc    特定のプロジェクトの取得
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new ErrorResponse(`ID: ${req.params.id} のプロジェクトが見つかりません`, 404));
  }
  
  // プロジェクト所有者のみアクセス可能
  if (project.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('このプロジェクトへのアクセス権限がありません', 403));
  }
  
  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    新規プロジェクトの作成
// @route   POST /api/projects
// @access  Private
exports.createProject = asyncHandler(async (req, res, next) => {
  // リクエストボディにユーザーIDを追加
  req.body.createdBy = req.user.id;
  
  const project = await Project.create(req.body);
  
  res.status(201).json({
    success: true,
    data: project
  });
});

// @desc    プロジェクトの更新
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = asyncHandler(async (req, res, next) => {
  let project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new ErrorResponse(`ID: ${req.params.id} のプロジェクトが見つかりません`, 404));
  }
  
  // プロジェクト所有者のみ更新可能
  if (project.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('このプロジェクトを更新する権限がありません', 403));
  }
  
  // 更新日時を設定
  req.body.updatedAt = Date.now();
  
  project = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    プロジェクトの削除
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new ErrorResponse(`ID: ${req.params.id} のプロジェクトが見つかりません`, 404));
  }
  
  // プロジェクト所有者のみ削除可能
  if (project.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('このプロジェクトを削除する権限がありません', 403));
  }
  
  await project.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});