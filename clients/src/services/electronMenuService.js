// src/services/electronMenuService.js
import { useEffect } from 'react';

/**
 * Electronメニューからのイベントを処理するサービス
 */
const ElectronMenuService = {
  /**
   * メニューイベントのリスナーを設定する
   * @param {Object} handlers - イベントハンドラーオブジェクト
   * @returns {Function} クリーンアップ関数
   */
  useMenuListeners: (handlers) => {
    useEffect(() => {
      // 登録解除用の関数を保持する配列
      const cleanupFunctions = [];
      
      // Electron環境かどうかを確認
      if (window.electron && window.electron.onMenuEvent) {
        // 各イベントタイプに対するリスナーを設定
        if (handlers.onNewProject) {
          const cleanup = window.electron.onMenuEvent('menu-new-project', () => {
            handlers.onNewProject();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onSaveProject) {
          const cleanup = window.electron.onMenuEvent('menu-save-project', () => {
            handlers.onSaveProject();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onSaveProjectAs) {
          const cleanup = window.electron.onMenuEvent('menu-save-project-as', () => {
            handlers.onSaveProjectAs();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onExportCsv) {
          const cleanup = window.electron.onMenuEvent('menu-export-csv', () => {
            handlers.onExportCsv();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onExportExcel) {
          const cleanup = window.electron.onMenuEvent('menu-export-excel', () => {
            handlers.onExportExcel();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onExportSvg) {
          const cleanup = window.electron.onMenuEvent('menu-export-svg', () => {
            handlers.onExportSvg();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onExportPng) {
          const cleanup = window.electron.onMenuEvent('menu-export-png', () => {
            handlers.onExportPng();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onImportCsv) {
          const cleanup = window.electron.onMenuEvent('menu-import-csv', () => {
            handlers.onImportCsv();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onImportExcel) {
          const cleanup = window.electron.onMenuEvent('menu-import-excel', () => {
            handlers.onImportExcel();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onViewProcessChart) {
          const cleanup = window.electron.onMenuEvent('menu-view-process-chart', () => {
            handlers.onViewProcessChart();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onViewWorkload) {
          const cleanup = window.electron.onMenuEvent('menu-view-workload', () => {
            handlers.onViewWorkload();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onViewImprovement) {
          const cleanup = window.electron.onMenuEvent('menu-view-improvement', () => {
            handlers.onViewImprovement();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onZoomIn) {
          const cleanup = window.electron.onMenuEvent('menu-zoom-in', () => {
            handlers.onZoomIn();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onZoomOut) {
          const cleanup = window.electron.onMenuEvent('menu-zoom-out', () => {
            handlers.onZoomOut();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onZoomReset) {
          const cleanup = window.electron.onMenuEvent('menu-zoom-reset', () => {
            handlers.onZoomReset();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onOpenHelp) {
          const cleanup = window.electron.onMenuEvent('menu-open-help', () => {
            handlers.onOpenHelp();
          });
          cleanupFunctions.push(cleanup);
        }
        
        if (handlers.onProjectOpened) {
          const cleanup = window.electron.onMenuEvent('project-opened', (data) => {
            handlers.onProjectOpened(data);
          });
          cleanupFunctions.push(cleanup);
        }
      } else {
        console.warn('Electron APIが利用できません。メニューイベントはサポートされません。');
      }
      
      // クリーンアップ関数を返す
      return () => {
        cleanupFunctions.forEach(cleanup => {
          if (typeof cleanup === 'function') {
            cleanup();
          }
        });
      };
    }, [handlers]);
  }
};

export default ElectronMenuService;