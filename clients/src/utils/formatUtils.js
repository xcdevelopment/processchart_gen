// src/utils/formatUtils.js
/**
 * 数値のフォーマットユーティリティ
 */
const formatUtils = {
    /**
     * 数値を小数点以下の桁数を指定してフォーマットする
     * @param {number} value - フォーマットする数値
     * @param {number} decimals - 小数点以下の桁数
     * @param {boolean} addCommas - 3桁ごとにカンマを追加するかどうか
     * @returns {string} - フォーマットされた数値
     */
    formatNumber: (value, decimals = 0, addCommas = true) => {
      if (value === null || value === undefined) return '';
      
      // 数値に変換
      const number = parseFloat(value);
      
      if (isNaN(number)) return '';
      
      // 小数点以下の桁数を制限
      const formatted = decimals > 0
        ? number.toFixed(decimals)
        : Math.round(number).toString();
      
      // 3桁ごとにカンマを追加
      if (addCommas) {
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
      }
      
      return formatted;
    },
    
    /**
     * 時間を「HH:MM:SS」形式でフォーマットする
     * @param {number} totalSeconds - 合計秒数
     * @returns {string} - フォーマットされた時間
     */
    formatTime: (totalSeconds) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    },
    
    /**
     * 分を「時間」や「日」に変換してフォーマットする
     * @param {number} minutes - 分数
     * @param {Object} options - オプション
     * @returns {string} - フォーマットされた時間
     */
    formatMinutes: (minutes, options = {}) => {
      const {
        showSeconds = false,
        hoursPerDay = 8,
        shortFormat = false,
        decimals = 1
      } = options;
      
      if (minutes === null || minutes === undefined) return '';
      
      // 秒数を含める場合
      if (showSeconds) {
        return formatUtils.formatTime(minutes * 60);
      }
      
      // 分を時間に変換
      const hours = minutes / 60;
      
      // 短い形式（時間のみ）
      if (shortFormat) {
        return formatUtils.formatNumber(hours, decimals) + '時間';
      }
      
      // 時間が8時間（一日分）を超える場合は日数も表示
      if (hours >= hoursPerDay) {
        const days = hours / hoursPerDay;
        const remainingHours = hours % hoursPerDay;
        
        return `${formatUtils.formatNumber(days, decimals)}日 ${formatUtils.formatNumber(remainingHours, decimals)}時間`;
      }
      
      return formatUtils.formatNumber(hours, decimals) + '時間';
    },
    
    /**
     * ファイルサイズをフォーマットする
     * @param {number} bytes - バイト数
     * @param {number} decimals - 小数点以下の桁数
     * @returns {string} - フォーマットされたファイルサイズ
     */
    formatFileSize: (bytes, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    
    /**
     * 日付をフォーマットする
     * @param {Date|string} date - 日付オブジェクトまたは日付文字列
     * @param {string} format - フォーマット（'yyyy-MM-dd', 'yyyy/MM/dd', 'yyyy年MM月dd日'など）
     * @returns {string} - フォーマットされた日付
     */
    formatDate: (date, format = 'yyyy-MM-dd') => {
      if (!date) return '';
      
      const d = new Date(date);
      
      if (isNaN(d.getTime())) return '';
      
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const seconds = d.getSeconds().toString().padStart(2, '0');
      
      return format
        .replace('yyyy', year)
        .replace('MM', month)
        .replace('dd', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    },
    
    /**
     * 日本語の曜日を取得する
     * @param {Date|string} date - 日付オブジェクトまたは日付文字列
     * @param {boolean} short - 短い形式（「月」など）にするかどうか
     * @returns {string} - 曜日
     */
    getDayOfWeekJp: (date, short = false) => {
      if (!date) return '';
      
      const d = new Date(date);
      
      if (isNaN(d.getTime())) return '';
      
      const dayOfWeek = d.getDay();
      const days = short
        ? ['日', '月', '火', '水', '木', '金', '土']
        : ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
      
      return days[dayOfWeek];
    },
    
    /**
     * パーセント値をフォーマットする
     * @param {number} value - パーセント値（例: 0.75）
     * @param {number} decimals - 小数点以下の桁数
     * @param {boolean} withSymbol - パーセント記号を含めるかどうか
     * @returns {string} - フォーマットされたパーセント値
     */
    formatPercent: (value, decimals = 0, withSymbol = true) => {
      if (value === null || value === undefined) return '';
      
      // 数値として解釈
      const number = parseFloat(value);
      
      if (isNaN(number)) return '';
      
      // パーセント値に変換（値が0〜1の場合は100倍する）
      const percentValue = number <= 1 ? number * 100 : number;
      
      // 小数点以下の桁数を制限
      const formatted = decimals > 0
        ? percentValue.toFixed(decimals)
        : Math.round(percentValue).toString();
      
      return withSymbol ? `${formatted}%` : formatted;
    },
    
    /**
     * 金額をフォーマットする
     * @param {number} value - 金額
     * @param {string} currency - 通貨コード（'JPY', 'USD'など）
     * @param {Object} options - フォーマットオプション
     * @returns {string} - フォーマットされた金額
     */
    formatCurrency: (value, currency = 'JPY', options = {}) => {
      if (value === null || value === undefined) return '';
      
      const {
        decimals = currency === 'JPY' ? 0 : 2,
        useSymbol = true,
        useGrouping = true
      } = options;
      
      try {
        // Intl.NumberFormatが利用可能な場合はそれを使用
        if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
          return new Intl.NumberFormat('ja-JP', {
            style: useSymbol ? 'currency' : 'decimal',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: useGrouping
          }).format(value);
        }
      } catch (e) {
        console.warn('Intl.NumberFormat is not supported, using fallback', e);
      }
      
      // フォールバック
      let formatted = formatUtils.formatNumber(value, decimals, useGrouping);
      
      if (useSymbol) {
        switch (currency) {
          case 'JPY':
            formatted = `¥${formatted}`;
            break;
          case 'USD':
            formatted = `$${formatted}`;
            break;
          case 'EUR':
            formatted = `€${formatted}`;
            break;
          default:
            formatted = `${currency} ${formatted}`;
        }
      }
      
      return formatted;
    },
    
    /**
     * 文字列を省略する
     * @param {string} text - 元の文字列
     * @param {number} maxLength - 最大文字数
     * @param {string} suffix - 省略記号
     * @returns {string} - 省略された文字列
     */
    truncateText: (text, maxLength = 20, suffix = '...') => {
      if (!text) return '';
      
      if (text.length <= maxLength) {
        return text;
      }
      
      return text.substring(0, maxLength - suffix.length) + suffix;
    }
  };
  
  export default formatUtils;