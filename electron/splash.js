// electron/splash.js
const { BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * スプラッシュウィンドウを作成・管理するクラス
 */
class SplashScreen {
  constructor() {
    this.window = null;
    this.hideTimeout = null;
    this.isDestroyed = false;
  }

  /**
   * スプラッシュウィンドウを作成して表示する
   * @returns {BrowserWindow} - スプラッシュウィンドウのインスタンス
   */
  create() {
    // すでに作成済みの場合は既存のものを返す
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    // ウィンドウのオプション
    const windowOptions = {
      width: 500,
      height: 300,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      },
      center: true,
      show: false
    };

    // ウィンドウ作成
    this.window = new BrowserWindow(windowOptions);
    this.isDestroyed = false;

    // スプラッシュ画面のHTMLを読み込む
    const splashHtml = path.join(__dirname, 'splash.html');
    
    // 開発環境ではローカルファイルを読み込む
    // 本番環境では埋め込みリソースから読み込む
    if (fs.existsSync(splashHtml)) {
      // ローカルファイルの読み込み
      this.window.loadFile(splashHtml);
    } else {
      // 動的に生成したHTMLを読み込む
      const htmlContent = this.generateSplashHtml();
      this.window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    }

    // 準備が完了したら表示
    this.window.once('ready-to-show', () => {
      if (!this.isDestroyed) {
        this.window.show();
      }
    });

    // ウィンドウが閉じられたときの処理
    this.window.on('closed', () => {
      this.isDestroyed = true;
      this.window = null;
      
      // タイムアウトがある場合はクリア
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });

    return this.window;
  }

  /**
   * スプラッシュウィンドウを閉じる
   * @param {number} delay - 遅延時間（ミリ秒）
   */
  close(delay = 0) {
    if (!this.window || this.isDestroyed) {
      return;
    }

    if (delay > 0) {
      // 指定時間後に閉じる
      this.hideTimeout = setTimeout(() => {
        if (this.window && !this.isDestroyed) {
          this.window.close();
          this.window = null;
          this.isDestroyed = true;
        }
      }, delay);
    } else {
      // すぐに閉じる
      this.window.close();
      this.window = null;
      this.isDestroyed = true;
    }
  }

  /**
   * 状態テキストを更新する
   * @param {string} text - 表示するテキスト
   */
  updateStatus(text) {
    if (!this.window || this.isDestroyed) {
      return;
    }

    this.window.webContents.executeJavaScript(`
      document.getElementById('status').textContent = ${JSON.stringify(text)};
    `).catch(err => {
      console.error('スプラッシュ画面の状態更新に失敗しました:', err);
    });
  }

  /**
   * プログレスバーの値を更新する
   * @param {number} value - 進捗値（0-100）
   */
  updateProgress(value) {
    if (!this.window || this.isDestroyed) {
      return;
    }

    const progress = Math.max(0, Math.min(100, value));
    
    this.window.webContents.executeJavaScript(`
      document.getElementById('progress-bar').style.width = '${progress}%';
    `).catch(err => {
      console.error('スプラッシュ画面のプログレスバー更新に失敗しました:', err);
    });
  }

  /**
   * スプラッシュ画面のHTMLを動的に生成する
   * @returns {string} - HTML文字列
   */
  generateSplashHtml() {
    const packageInfo = require('../package.json');
    const appVersion = packageInfo.version || '1.0.0';
    const appName = packageInfo.productName || '業務プロセス可視化・改善ツール';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${appName}</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            color: #333;
            background-color: rgba(245, 247, 250, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            border-radius: 8px;
            user-select: none;
          }
          
          .container {
            padding: 20px;
            width: 80%;
          }
          
          .logo {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
          }
          
          h1 {
            font-size: 1.5rem;
            margin: 10px 0;
            color: #1976d2;
          }
          
          .version {
            font-size: 0.8rem;
            color: #666;
            margin-bottom: 30px;
          }
          
          .progress-container {
            width: 100%;
            height: 4px;
            background-color: #e0e0e0;
            border-radius: 2px;
            overflow: hidden;
            margin: 20px 0;
          }
          
          .progress-bar {
            height: 100%;
            width: 0%;
            background-color: #1976d2;
            transition: width 0.3s ease;
          }
          
          .status {
            font-size: 0.9rem;
            color: #666;
            height: 20px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100">
              <path fill="#1976d2" d="M3,3H21V21H3V3M7.73,18.04C8.13,18.89 8.92,19.59 10.27,19.59C11.77,19.59 12.8,18.79 12.8,17.04V11.26H11.1V17C11.1,17.86 10.75,18.08 10.2,18.08C9.62,18.08 9.38,17.68 9.11,17.21L7.73,18.04M13.71,17.86C14.21,18.84 15.22,19.59 16.8,19.59C18.4,19.59 19.6,18.76 19.6,17.23C19.6,15.82 18.79,15.19 17.35,14.57L16.93,14.39C16.2,14.08 15.89,13.87 15.89,13.37C15.89,12.96 16.2,12.64 16.7,12.64C17.18,12.64 17.5,12.85 17.79,13.37L19.1,12.5C18.55,11.54 17.77,11.17 16.7,11.17C15.19,11.17 14.22,12.13 14.22,13.4C14.22,14.78 15.03,15.43 16.25,15.95L16.67,16.13C17.45,16.47 17.91,16.68 17.91,17.26C17.91,17.74 17.46,18.09 16.76,18.09C15.93,18.09 15.45,17.66 15.09,17.06L13.71,17.86Z" />
            </svg>
          </div>
          <h1>${appName}</h1>
          <div class="version">バージョン ${appVersion}</div>
          <div class="progress-container">
            <div id="progress-bar" class="progress-bar"></div>
          </div>
          <div id="status" class="status">起動しています...</div>
        </div>
      </body>
      </html>
    `;
  }
}

// シングルトンインスタンスをエクスポート
module.exports = new SplashScreen();