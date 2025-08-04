/**
 * 포맷팅 관련 유틸리티 함수들
 * 메이플 쌀먹 가계부 포맷터 모듈
 */

/**
 * 메소 포맷팅 - 억, 만 단위로 변환
 * @param {number} value - 메소 값
 * @returns {string} 포맷된 메소 문자열
 */
function formatMeso(value) {
    if (value >= 100000000) { // 1억 이상
        const billion = value / 100000000;
        return `${billion.toFixed(1)}억`;
    } else if (value >= 10000) { // 1만 이상
        const tenThousand = Math.floor(value / 10000);
        return `${tenThousand}만`;
    }
    return value.toLocaleString();
}

/**
 * 메소 파싱 - 문자열을 숫자로 변환
 * @param {string|number} input - 입력 값
 * @returns {number} 파싱된 메소 값
 */
function parseMeso(input) {
    if (!input) return 0;

    input = String(input).trim();
    input = input.replace(/,/g, '');

    if (input.includes('조')) {
        const parts = input.split('조');
        const trillion = parseFloat(parts[0]) || 0;
        let billion = 0;
        if (parts[1] && parts[1].includes('억')) {
            billion = parseFloat(parts[1].replace('억', '')) || 0;
        }
        return Math.floor(trillion * 1000000000000 + billion * 100000000);
    }

    if (input.includes('억')) {
        const num = parseFloat(input.replace('억', ''));
        return Math.floor(num * 100000000);
    }

    if (input.includes('.')) {
        const num = parseFloat(input);
        return Math.floor(num * 100000000);
    }

    const num = parseInt(input);
    return isNaN(num) ? 0 : num;
}

/**
 * 날짜 포맷팅
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @param {string} format - 포맷 타입 ('short', 'long', 'time')
 * @returns {string} 포맷된 날짜 문자열
 */
function formatDate(date, format = 'short') {
    const d = new Date(date);
    
    switch (format) {
        case 'short':
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        case 'long':
            return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        case 'time':
            return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        case 'date-only':
            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        case 'month-year':
            return `${d.getFullYear()}.${d.getMonth() + 1}`;
        default:
            return d.toLocaleString();
    }
}

/**
 * 퍼센테이지 포맷팅
 * @param {number} value - 값
 * @param {number} total - 전체 값
 * @param {number} decimals - 소수점 자리수
 * @returns {string} 포맷된 퍼센테이지
 */
function formatPercentage(value, total, decimals = 1) {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
}

/**
 * 통화 포맷팅
 * @param {number} value - 값
 * @param {string} currency - 통화 기호
 * @returns {string} 포맷된 통화
 */
function formatCurrency(value, currency = '₩') {
    return `${currency}${value.toLocaleString()}`;
}

/**
 * 숫자 포맷팅 (천 단위 콤마)
 * @param {number} value - 숫자 값
 * @returns {string} 포맷된 숫자
 */
function formatNumber(value) {
    return value.toLocaleString();
}

/**
 * 시간 범위 포맷팅
 * @param {number} hour - 시간 (0-23)
 * @returns {string} 시간 범위 문자열
 */
function formatTimeRange(hour) {
    return `${hour}시 ~ ${hour + 1}시`;
}

/**
 * 큰 숫자를 읽기 쉽게 포맷팅
 * @param {number} value - 숫자 값
 * @returns {string} 포맷된 문자열
 */
function formatLargeNumber(value) {
    if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
}

/**
 * 지속 시간 포맷팅
 * @param {number} minutes - 분 단위 시간
 * @returns {string} 포맷된 시간 문자열
 */
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes}분`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
    } else {
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`;
    }
}

/**
 * 성장률 포맷팅
 * @param {number} oldValue - 이전 값
 * @param {number} newValue - 새로운 값
 * @returns {Object} 성장률 정보 객체
 */
function formatGrowthRate(oldValue, newValue) {
    if (oldValue === 0) {
        return {
            rate: newValue > 0 ? Infinity : 0,
            formatted: newValue > 0 ? '∞%' : '0%',
            direction: newValue > 0 ? 'up' : 'same'
        };
    }
    
    const rate = ((newValue - oldValue) / oldValue) * 100;
    return {
        rate: rate,
        formatted: `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`,
        direction: rate > 0 ? 'up' : rate < 0 ? 'down' : 'same'
    };
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatMeso,
        parseMeso,
        formatDate,
        formatPercentage,
        formatCurrency,
        formatNumber,
        formatTimeRange,
        formatLargeNumber,
        formatDuration,
        formatGrowthRate
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleFormatters = {
        formatMeso,
        parseMeso,
        formatDate,
        formatPercentage,
        formatCurrency,
        formatNumber,
        formatTimeRange,
        formatLargeNumber,
        formatDuration,
        formatGrowthRate
    };
}