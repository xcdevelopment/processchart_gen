// electron/database.js
const Datastore = require('nedb');
const path = require('path');
const { app } = require('electron');

/**
 * アプリケーションのデータベースを管理するクラス
 */
class DatabaseManager {
  constructor() {
    this.dbDir = path.join(app.getPath('userData'), 'databases');
    this.dbs = {};
    this.initialized = false;
  }

  /**
   * データベースを初期化する
   */
  initialize() {
    if (this.initialized) return;

    // 改善施策データベース
    this.dbs.improvements = new Datastore({
      filename: path.join(this.dbDir, 'improvements.db'),
      autoload: true
    });

    // プロジェクトメタデータデータベース
    this.dbs.projects = new Datastore({
      filename: path.join(this.dbDir, 'projects.db'),
      autoload: true
    });

    // テンプレートデータベース
    this.dbs.templates = new Datastore({
      filename: path.join(this.dbDir, 'templates.db'),
      autoload: true
    });

    // インデックスの作成
    this.dbs.improvements.ensureIndex({ fieldName: 'title' });
    this.dbs.improvements.ensureIndex({ fieldName: 'targetStepType' });
    this.dbs.improvements.ensureIndex({ fieldName: 'keywords' });
    
    this.dbs.projects.ensureIndex({ fieldName: 'name', unique: true });
    this.dbs.projects.ensureIndex({ fieldName: 'lastOpened' });
    
    this.dbs.templates.ensureIndex({ fieldName: 'name', unique: true });

    this.initialized = true;
    console.log('データベースが初期化されました');
  }

  /**
   * 指定されたデータベースからドキュメントを検索する
   * @param {string} dbName - データベース名
   * @param {Object} query - 検索クエリ
   * @param {Object} [options={}] - 検索オプション
   * @returns {Promise<Array>} - 検索結果
   */
  find(dbName, query = {}, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.dbs[dbName]) {
        return reject(new Error(`データベース '${dbName}' が存在しません`));
      }

      let dbQuery = this.dbs[dbName].find(query);
      
      // ソート
      if (options.sort) {
        dbQuery = dbQuery.sort(options.sort);
      }
      
      // 制限
      if (options.limit) {
        dbQuery = dbQuery.limit(options.limit);
      }
      
      // スキップ
      if (options.skip) {
        dbQuery = dbQuery.skip(options.skip);
      }
      
      dbQuery.exec((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }

  /**
   * 指定されたデータベースに新しいドキュメントを挿入する
   * @param {string} dbName - データベース名
   * @param {Object} doc - 挿入するドキュメント
   * @returns {Promise<Object>} - 挿入されたドキュメント
   */
  insert(dbName, doc) {
    return new Promise((resolve, reject) => {
      if (!this.dbs[dbName]) {
        return reject(new Error(`データベース '${dbName}' が存在しません`));
      }

      // タイムスタンプの追加
      const timestamp = new Date().toISOString();
      const docWithTimestamp = {
        ...doc,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      this.dbs[dbName].insert(docWithTimestamp, (err, newDoc) => {
        if (err) {
          reject(err);
        } else {
          resolve(newDoc);
        }
      });
    });
  }

  /**
   * 指定されたデータベースのドキュメントを更新する
   * @param {string} dbName - データベース名
   * @param {Object} query - 更新対象を特定するクエリ
   * @param {Object} update - 更新内容
   * @param {Object} [options={}] - 更新オプション
   * @returns {Promise<number>} - 更新されたドキュメント数
   */
  update(dbName, query, update, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.dbs[dbName]) {
        return reject(new Error(`データベース '${dbName}' が存在しません`));
      }

      // タイムスタンプの更新
      const timestamp = new Date().toISOString();
      const updateWithTimestamp = {
        ...update,
        updatedAt: timestamp
      };

      this.dbs[dbName].update(
        query,
        options.upsert ? updateWithTimestamp : { $set: updateWithTimestamp },
        { 
          multi: options.multi || false,
          upsert: options.upsert || false,
          returnUpdatedDocs: options.returnUpdatedDocs || false
        },
        (err, numAffected, affectedDocuments) => {
          if (err) {
            reject(err);
          } else if (options.returnUpdatedDocs) {
            resolve({ numAffected, affectedDocuments });
          } else {
            resolve(numAffected);
          }
        }
      );
    });
  }

  /**
   * 指定されたデータベースからドキュメントを削除する
   * @param {string} dbName - データベース名
   * @param {Object} query - 削除対象を特定するクエリ
   * @param {Object} [options={}] - 削除オプション
   * @returns {Promise<number>} - 削除されたドキュメント数
   */
  remove(dbName, query, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.dbs[dbName]) {
        return reject(new Error(`データベース '${dbName}' が存在しません`));
      }

      this.dbs[dbName].remove(
        query,
        { multi: options.multi || false },
        (err, numRemoved) => {
          if (err) {
            reject(err);
          } else {
            resolve(numRemoved);
          }
        }
      );
    });
  }

  /**
   * 指定されたデータベースから1つのドキュメントを取得する
   * @param {string} dbName - データベース名
   * @param {Object} query - 検索クエリ
   * @returns {Promise<Object>} - 検索結果
   */
  findOne(dbName, query = {}) {
    return new Promise((resolve, reject) => {
      if (!this.dbs[dbName]) {
        return reject(new Error(`データベース '${dbName}' が存在しません`));
      }

      this.dbs[dbName].findOne(query, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
    });
  }

  /**
   * 特定のデータベースをカウントする
   * @param {string} dbName - データベース名
   * @param {Object} query - 検索クエリ
   * @returns {Promise<number>} - ドキュメント数
   */
  count(dbName, query = {}) {
    return new Promise((resolve, reject) => {
      if (!this.dbs[dbName]) {
        return reject(new Error(`データベース '${dbName}' が存在しません`));
      }

      this.dbs[dbName].count(query, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
  }

  /**
   * データベースを圧縮する
   * @param {string} dbName - データベース名
   * @returns {Promise<void>}
   */
  compact(dbName) {
    return new Promise((resolve, reject) => {
      if (!this.dbs[dbName]) {
        return reject(new Error(`データベース '${dbName}' が存在しません`));
      }

      this.dbs[dbName].persistence.compactDatafile();
      resolve();
    });
  }

  /**
   * すべてのデータベースを圧縮する
   * @returns {Promise<void>}
   */
  compactAll() {
    const promises = Object.keys(this.dbs).map(dbName => this.compact(dbName));
    return Promise.all(promises);
  }
}

// シングルトンインスタンスを作成
const dbManager = new DatabaseManager();

module.exports = dbManager;