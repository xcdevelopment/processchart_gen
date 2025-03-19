// src/hooks/useZoom.js
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * ズーム操作を管理するカスタムフック
 * @param {number} initialZoom - 初期ズームレベル（1.0 = 100%）
 * @param {number} minZoom - 最小ズームレベル
 * @param {number} maxZoom - 最大ズームレベル
 * @param {number} step - ズーム操作のステップ幅
 * @returns {Object} - ズーム関連の状態と操作メソッド
 */
export function useZoom(initialZoom = 1.0, minZoom = 0.1, maxZoom = 3.0, step = 0.1) {
  const [zoom, setZoom] = useState(initialZoom);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const dragStartRef = useRef(null);
  const positionRef = useRef(position);

  // positionのrefを更新
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  /**
   * ズームレベルを変更する
   * @param {number} newZoom - 新しいズームレベル
   */
  const changeZoom = useCallback((newZoom) => {
    // ズームレベルを制限
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoom(clampedZoom);
  }, [minZoom, maxZoom]);

  /**
   * ズームイン（拡大）
   */
  const zoomIn = useCallback(() => {
    setZoom(prevZoom => {
      const newZoom = Math.min(maxZoom, prevZoom + step);
      return Math.round(newZoom * 100) / 100; // 小数点2桁に丸める
    });
  }, [maxZoom, step]);

  /**
   * ズームアウト（縮小）
   */
  const zoomOut = useCallback(() => {
    setZoom(prevZoom => {
      const newZoom = Math.max(minZoom, prevZoom - step);
      return Math.round(newZoom * 100) / 100; // 小数点2桁に丸める
    });
  }, [minZoom, step]);

  /**
   * ズームをリセット（100%に戻す）
   */
  const resetZoom = useCallback(() => {
    setZoom(1.0);
    setPosition({ x: 0, y: 0 });
  }, []);

  /**
   * ズームをパーセント表示に変換
   * @returns {string} - パーセント表示
   */
  const zoomPercent = useCallback(() => {
    return `${Math.round(zoom * 100)}%`;
  }, [zoom]);

  /**
   * ドラッグ開始時の処理
   * @param {React.MouseEvent} event - マウスイベント
   */
  const handleDragStart = useCallback((event) => {
    if (event.button !== 0) return; // 左クリックのみ対応
    
    setIsDragging(true);
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      positionX: positionRef.current.x,
      positionY: positionRef.current.y
    };
    
    // ドラッグ中のテキスト選択を防止
    document.body.style.userSelect = 'none';
  }, []);

  /**
   * ドラッグ中の処理
   * @param {React.MouseEvent} event - マウスイベント
   */
  const handleDrag = useCallback((event) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    
    setPosition({
      x: dragStartRef.current.positionX + dx,
      y: dragStartRef.current.positionY + dy
    });
  }, [isDragging]);

  /**
   * ドラッグ終了時の処理
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
    document.body.style.userSelect = '';
  }, []);

  /**
   * マウスホイールによるズーム処理
   * @param {React.WheelEvent} event - ホイールイベント
   */
  const handleWheel = useCallback((event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      
      const delta = event.deltaY < 0 ? step : -step;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
      
      // ズーム時のフォーカスポイント（マウス位置）を考慮
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        // マウス位置（コンテナ内の相対位置）
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // 現在のコンテンツ上のマウス位置
        const contentX = (mouseX - position.x) / zoom;
        const contentY = (mouseY - position.y) / zoom;
        
        // 新しいズームでのコンテンツ上のマウス位置
        const newContentX = (mouseX - position.x) / newZoom;
        const newContentY = (mouseY - position.y) / newZoom;
        
        // 位置の調整
        const adjustedX = position.x + (contentX - newContentX) * newZoom;
        const adjustedY = position.y + (contentY - newContentY) * newZoom;
        
        setPosition({
          x: adjustedX,
          y: adjustedY
        });
      }
      
      setZoom(newZoom);
    }
  }, [zoom, position, minZoom, maxZoom, step]);

  // イベントリスナーの設定と解除
  useEffect(() => {
    const handleGlobalMouseMove = (event) => {
      if (isDragging) {
        handleDrag(event);
      }
    };
    
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };
    
    // キーボードショートカット
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '=') {
        // Ctrl/Cmd + '+' でズームイン
        event.preventDefault();
        zoomIn();
      } else if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        // Ctrl/Cmd + '-' でズームアウト
        event.preventDefault();
        zoomOut();
      } else if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        // Ctrl/Cmd + '0' でズームリセット
        event.preventDefault();
        resetZoom();
      }
    };
    
    // イベントリスナーの登録
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging, handleDrag, handleDragEnd, zoomIn, zoomOut, resetZoom]);

  return {
    zoom,
    zoomPercent: zoomPercent(),
    position,
    isDragging,
    containerRef,
    zoomIn,
    zoomOut,
    resetZoom,
    changeZoom,
    handleDragStart,
    handleWheel,
    // CSS変換スタイル
    transformStyle: {
      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
      transformOrigin: '0 0',
      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
    }
  };
}

export default useZoom;