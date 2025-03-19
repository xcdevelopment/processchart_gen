// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// ルーターのインポート
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const improvementRoutes = require('./routes/improvementRoutes');

// 環境変数の読み込み
dotenv.config();

// Expressアプリケーションの作成
const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェアの設定
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// APIルーターの設定
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/improvements', improvementRoutes);

// 本番環境の場合はフロントエンドの静的ファイルを提供
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// データベース接続
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB Atlasに接続しました');
    
    // サーバー起動
    app.listen(PORT, () => {
      console.log(`サーバーがポート ${PORT} で起動しました`);
    });
  })
  .catch((error) => {
    console.error('MongoDB接続エラー:', error);
  });

// 未処理のエラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('未処理のPromise rejection:', error);
});