/**
 * 일반적인 헬퍼 함수들
 * 메이플 쌀먹 가계부 유틸리티 모듈
 */

/**
 * 플로팅 정보 표시
 * @param {Event} e - 마우스 이벤트
 */
function showFloatingInfo(e) {
    const info = document.getElementById('floatingInfo');
    const value = parseFloat(this.getAttribute('data-full'));

    info.textContent = value.toLocaleString() + ' 메소';
    info.style.display = 'block';
    info.style.left = e.pageX + 10 + 'px';
    info.style.top = e.pageY - 30 + 'px';
}

/**
 * 플로팅 정보 숨기기
 */
function hideFloatingInfo() {
    document.getElementById('floatingInfo').style.display = 'none';
}

/**
 * 메모에서 태그 추출
 * @param {string} text - 메모 텍스트
 * @returns {Array} 추출된 태그 배열
 */
function extractTags(text) {
    if (!text) return [];
    const tagRegex = /#[\w가-힣]+/g;
    return text.match(tagRegex) || [];
}

/**
 * 날짜 필터링 - 현재 뷰에 따라 기록 필터링
 * @param {Array} records - 모든 기록
 * @param {string} currentView - 현재 뷰 (daily, weekly, monthly, yearly)
 * @returns {Array} 필터링된 기록
 */
function filterRecordsByView(records, currentView) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return records.filter(record => {
        const recordDate = new Date(record.date);

        switch (currentView) {
            case 'daily':
                return recordDate >= today;
            case 'weekly':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return recordDate >= weekAgo;
            case 'monthly':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return recordDate >= monthAgo;
            case 'yearly':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return recordDate >= yearAgo;
            default:
                return true;
        }
    });
}

/**
 * 모달 닫기
 * @param {string} modalId - 모달 ID
 */
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

/**
 * 스로틀 함수 - 함수 호출 횟수를 제한하여 성능 최적화
 * @param {Function} func - 실행할 함수
 * @param {number} delay - 제한 시간 (ms)
 * @returns {Function} 스로틀된 함수
 */
function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    };
}

/**
 * 메모이제이션 함수 - 함수 결과를 캐시하여 성능 최적화
 * @param {Function} func - 메모이제이션할 함수
 * @returns {Function} 메모이제이션된 함수
 */
function memoize(func) {
    const cache = new Map();
    return function (...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = func.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

/**
 * CSS 커스텀 속성 값 가져오기
 * @param {string} property - CSS 속성명
 * @returns {string} 속성 값
 */
function getCSSProperty(property) {
    return getComputedStyle(document.body).getPropertyValue(property);
}

/**
 * 고유 ID 생성
 * @returns {number} 타임스탬프 기반 ID
 */
function generateId() {
    return Date.now();
}

/**
 * 배열 깊은 복사
 * @param {Array} arr - 복사할 배열
 * @returns {Array} 복사된 배열
 */
function deepCopyArray(arr) {
    return JSON.parse(JSON.stringify(arr));
}

/**
 * 객체 깊은 복사
 * @param {Object} obj - 복사할 객체
 * @returns {Object} 복사된 객체
 */
function deepCopyObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 요일 이름 배열
 */
const WEEKDAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showFloatingInfo,
        hideFloatingInfo,
        extractTags,
        filterRecordsByView,
        closeModal,
        getCSSProperty,
        generateId,
        deepCopyArray,
        deepCopyObject,
        debounce,
        WEEKDAY_NAMES
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleHelpers = {
        showFloatingInfo,
        hideFloatingInfo,
        extractTags,
        filterRecordsByView,
        closeModal,
        getCSSProperty,
        generateId,
        deepCopyArray,
        deepCopyObject,
        debounce,
        WEEKDAY_NAMES
    };
}