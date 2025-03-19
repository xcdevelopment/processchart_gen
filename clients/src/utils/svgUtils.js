// src/utils/svgUtils.js
/**
 * SVG操作に関するユーティリティ関数
 */
const svgUtils = {
    /**
     * DOMノードからSVG文字列を生成する
     * @param {HTMLElement} node - SVGノード
     * @param {Object} options - オプション
     * @returns {string} - SVG文字列
     */
    getSvgString: (node, options = {}) => {
      // ノードのクローンを作成
      const clone = node.cloneNode(true);
      
      // スタイルを適用
      svgUtils.applyStyles(clone);
      
      // SVG属性を設定
      if (!clone.getAttribute('xmlns')) {
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      
      // オプション処理
      if (options.width) {
        clone.setAttribute('width', options.width);
      }
      
      if (options.height) {
        clone.setAttribute('height', options.height);
      }
      
      if (options.viewBox && !clone.getAttribute('viewBox')) {
        clone.setAttribute('viewBox', options.viewBox);
      }
      
      // シリアライズ
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clone);
      
      // CDATA, HTML Comments, Scriptsなどの削除
      svgString = svgString.replace(/<!\[CDATA\[.*?\]\]>/g, '');
      svgString = svgString.replace(/<!--.*?-->/g, '');
      svgString = svgString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      return svgString;
    },
    
    /**
     * SVGにインラインスタイルを適用する
     * @param {SVGElement} svg - SVG要素
     */
    applyStyles: (svg) => {
      // CSSOMの取得
      const styleSheets = document.styleSheets;
      
      // 適用するスタイルルールを収集
      const rules = [];
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const styleSheet = styleSheets[i];
          const cssRules = styleSheet.cssRules || styleSheet.rules;
          
          if (cssRules) {
            for (let j = 0; j < cssRules.length; j++) {
              rules.push(cssRules[j]);
            }
          }
        } catch (e) {
          console.warn('CSSRules could not be accessed', e);
        }
      }
      
      // SVG内の全要素に対してスタイルを適用
      const allElements = svg.querySelectorAll('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        
        // 現在のスタイル
        let styles = {};
        
        // 適用可能なルールを検索
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j];
          
          try {
            // 要素にセレクタが一致するか確認
            if (element.matches(rule.selectorText)) {
              const style = rule.style;
              
              // スタイルをコピー
              for (let k = 0; k < style.length; k++) {
                const property = style[k];
                styles[property] = style.getPropertyValue(property);
              }
            }
          } catch (e) {
            // 一部のセレクタはエラーになる可能性があるので無視
          }
        }
        
        // インラインスタイルを適用
        for (const property in styles) {
          element.style[property] = styles[property];
        }
      }
    },
    
    /**
     * SVGをPNG画像に変換する
     * @param {string} svgString - SVG文字列
     * @param {Object} options - 変換オプション
     * @returns {Promise<string>} - Base64エンコードされたPNG画像
     */
    convertSvgToPng: (svgString, options = {}) => {
      return new Promise((resolve, reject) => {
        const {
          width = 800,
          height = 600,
          scale = 2, // 高解像度用のスケーリング
          backgroundColor = 'white'
        } = options;
        
        // SVGをBase64エンコード
        const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
        
        // 画像を作成
        const img = new Image();
        img.onload = () => {
          try {
            // キャンバスを作成
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            
            // コンテキスト取得
            const ctx = canvas.getContext('2d');
            
            // 背景色の設定
            if (backgroundColor) {
              ctx.fillStyle = backgroundColor;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // スケーリング
            ctx.scale(scale, scale);
            
            // SVGの描画
            ctx.drawImage(img, 0, 0, width, height);
            
            // PNGに変換
            const pngBase64 = canvas.toDataURL('image/png');
            resolve(pngBase64);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = (error) => {
          reject(new Error('SVG画像の読み込みに失敗しました: ' + error.message));
        };
        
        // SVGを読み込み
        img.src = svgBase64;
      });
    },
    
    /**
     * プロセスチャートのSVGを生成する
     * @param {Array} steps - プロセスステップの配列
     * @param {Array} edges - エッジの配列
     * @param {Object} options - オプション
     * @returns {string} - SVG文字列
     */
    generateProcessChartSvg: (steps, edges, options = {}) => {
      const {
        padding = 20,
        nodeWidth = 120,
        nodeHeight = 80,
        fontSize = 12,
        lineColor = '#555',
        backgroundColor = 'white',
        includeLegend = true
      } = options;
      
      // キャンバスサイズの計算
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      steps.forEach(step => {
        const { position } = step;
        minX = Math.min(minX, position.x);
        minY = Math.min(minY, position.y);
        maxX = Math.max(maxX, position.x + nodeWidth);
        maxY = Math.max(maxY, position.y + nodeHeight);
      });
      
      // パディングを追加
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // 凡例のスペースを追加
      if (includeLegend) {
        maxY += 100;
      }
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      // SVGヘッダ
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" style="background-color: ${backgroundColor};">`;
      
      // 定義（マーカーなど）
      svg += `
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="${lineColor}" />
          </marker>
        </defs>
      `;
      
      // エッジの描画
      edges.forEach(edge => {
        const source = steps.find(step => step.id === edge.source);
        const target = steps.find(step => step.id === edge.target);
        
        if (source && target) {
          const sourceX = source.position.x + nodeWidth / 2;
          const sourceY = source.position.y + nodeHeight / 2;
          const targetX = target.position.x + nodeWidth / 2;
          const targetY = target.position.y + nodeHeight / 2;
          
          svg += `<line x1="${sourceX}" y1="${sourceY}" x2="${targetX}" y2="${targetY}" stroke="${lineColor}" stroke-width="2" marker-end="url(#arrowhead)" />`;
        }
      });
      
      // ノードの描画
      steps.forEach(step => {
        const { id, type, position, data } = step;
        const x = position.x;
        const y = position.y;
        
        // ノードの背景色
        let bgColor = 'white';
        let strokeColor = '#333';
        
        // タイプに応じたノード形状
        switch (type) {
          case 'process': // 加工（円形）
            svg += `
              <circle cx="${x + nodeWidth/2}" cy="${y + nodeHeight/2}" r="${nodeHeight/2}" 
                fill="${bgColor}" stroke="${strokeColor}" stroke-width="2" />
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2}" 
                font-family="Arial" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">
                ${data.label}
              </text>
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 + fontSize + 2}" 
                font-family="Arial" font-size="${fontSize - 2}" text-anchor="middle" dominant-baseline="middle">
                ${data.time}${data.timeUnit}
              </text>
            `;
            break;
            
          case 'inspection': // 検査（四角形）
            svg += `
              <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" 
                fill="${bgColor}" stroke="${strokeColor}" stroke-width="2" />
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2}" 
                font-family="Arial" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">
                ${data.label}
              </text>
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 + fontSize + 2}" 
                font-family="Arial" font-size="${fontSize - 2}" text-anchor="middle" dominant-baseline="middle">
                ${data.time}${data.timeUnit}
              </text>
            `;
            break;
            
          case 'transport': // 搬送（ひし形）
            svg += `
              <polygon points="${x + nodeWidth/2},${y} ${x + nodeWidth},${y + nodeHeight/2} ${x + nodeWidth/2},${y + nodeHeight} ${x},${y + nodeHeight/2}" 
                fill="${bgColor}" stroke="${strokeColor}" stroke-width="2" />
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2}" 
                font-family="Arial" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">
                ${data.label}
              </text>
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 + fontSize + 2}" 
                font-family="Arial" font-size="${fontSize - 2}" text-anchor="middle" dominant-baseline="middle">
                ${data.time}${data.timeUnit}
              </text>
            `;
            break;
            
          case 'delay': // 停滞（三角形）
            svg += `
              <polygon points="${x + nodeWidth/2},${y} ${x + nodeWidth},${y + nodeHeight} ${x},${y + nodeHeight}" 
                fill="${bgColor}" stroke="${strokeColor}" stroke-width="2" />
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 + fontSize}" 
                font-family="Arial" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">
                ${data.label}
              </text>
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 + 2*fontSize}" 
                font-family="Arial" font-size="${fontSize - 2}" text-anchor="middle" dominant-baseline="middle">
                ${data.time}${data.timeUnit}
              </text>
            `;
            break;
            
          case 'storage': // 保管（特殊四角形）
            svg += `
              <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" 
                fill="${bgColor}" stroke="${strokeColor}" stroke-width="2" />
              <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight * 0.3}" 
                fill="#f5f5f5" stroke="${strokeColor}" stroke-width="2" />
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 + fontSize}" 
                font-family="Arial" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">
                ${data.label}
              </text>
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 + 2*fontSize}" 
                font-family="Arial" font-size="${fontSize - 2}" text-anchor="middle" dominant-baseline="middle">
                ${data.time}${data.timeUnit}
              </text>
            `;
            break;
            
          default:
            svg += `
              <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" 
                fill="${bgColor}" stroke="${strokeColor}" stroke-width="2" />
              <text x="${x + nodeWidth/2}" y="${y + nodeHeight/2}" 
                font-family="Arial" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">
                ${data.label}
              </text>
            `;
        }
      });
      
      // 凡例の描画
      if (includeLegend) {
        const legendY = maxY - 80;
        const legendX = minX + 20;
        const itemWidth = 150;
        const itemHeight = 60;
        const spacing = 20;
        
        svg += `
          <g transform="translate(${legendX}, ${legendY})">
            <text font-family="Arial" font-size="${fontSize + 4}" font-weight="bold">凡例</text>
            
            <g transform="translate(0, 25)">
              <circle cx="${itemHeight/2}" cy="${itemHeight/2}" r="${itemHeight/3}" 
                fill="white" stroke="#333" stroke-width="2" />
              <text x="${itemHeight + spacing}" y="${itemHeight/2}" 
                font-family="Arial" font-size="${fontSize}" dominant-baseline="middle">加工</text>
            </g>
            
            <g transform="translate(${itemWidth}, 25)">
              <rect x="0" y="${itemHeight/6}" width="${itemHeight*2/3}" height="${itemHeight*2/3}" 
                fill="white" stroke="#333" stroke-width="2" />
              <text x="${itemHeight + spacing}" y="${itemHeight/2}" 
                font-family="Arial" font-size="${fontSize}" dominant-baseline="middle">検査</text>
            </g>
            
            <g transform="translate(${itemWidth*2}, 25)">
              <polygon points="${itemHeight/2},${itemHeight/6} ${itemHeight*5/6},${itemHeight/2} ${itemHeight/2},${itemHeight*5/6} ${itemHeight/6},${itemHeight/2}" 
                fill="white" stroke="#333" stroke-width="2" />
              <text x="${itemHeight + spacing}" y="${itemHeight/2}" 
                font-family="Arial" font-size="${fontSize}" dominant-baseline="middle">搬送</text>
            </g>
            
            <g transform="translate(${itemWidth*3}, 25)">
              <polygon points="${itemHeight/2},${itemHeight/6} ${itemHeight*5/6},${itemHeight*5/6} ${itemHeight/6},${itemHeight*5/6}" 
                fill="white" stroke="#333" stroke-width="2" />
              <text x="${itemHeight + spacing}" y="${itemHeight/2}" 
                font-family="Arial" font-size="${fontSize}" dominant-baseline="middle">停滞</text>
            </g>
            
            <g transform="translate(${itemWidth*4}, 25)">
              <rect x="0" y="${itemHeight/6}" width="${itemHeight*2/3}" height="${itemHeight*2/3}" 
                fill="white" stroke="#333" stroke-width="2" />
              <rect x="0" y="${itemHeight/6}" width="${itemHeight*2/3}" height="${itemHeight/6}" 
                fill="#f5f5f5" stroke="#333" stroke-width="2" />
              <text x="${itemHeight + spacing}" y="${itemHeight/2}" 
                font-family="Arial" font-size="${fontSize}" dominant-baseline="middle">保管</text>
            </g>
          </g>
        `;
      }
      
      // SVGフッター
      svg += '</svg>';
      
      return svg;
    }
  };
  
  export default svgUtils;