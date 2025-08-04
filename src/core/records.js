/**
 * 수익/지출 기록 관리 모듈
 * 메이플 쌀먹 가계부 기록 관리 및 분석
 */

/**
 * 레코드 추가
 * @param {Object} recordData - 레코드 데이터
 * @returns {Object} 결과 객체
 */
function addRecord(recordData) {
    try {
        // 입력 검증
        const validation = validateRecordInput(recordData);
        if (!validation.isValid) {
            return { success: false, error: validation.error };
        }

        const { type, category, amount, memo } = validation.data;
        
        // 레코드 생성
        const record = {
            id: Date.now(),
            type: type,
            category: category,
            amount: amount,
            memo: memo,
            tags: extractTags(memo),
            date: new Date().toISOString()
        };

        // 상태 업데이트
        if (window.MapleState) {
            window.MapleState.addRecord(record);
        } else {
            // Fallback: 직접 추가
            const records = getRecords();
            records.push(record);
            saveRecords(records);
        }

        return { success: true, record };

    } catch (error) {
        console.error('레코드 추가 실패:', error);
        return { success: false, error: '레코드 추가에 실패했습니다.' };
    }
}

/**
 * 레코드 삭제
 * @param {number} recordId - 삭제할 레코드 ID
 * @returns {Object} 결과 객체
 */
function deleteRecord(recordId) {
    try {
        if (window.MapleState) {
            window.MapleState.deleteRecord(recordId);
        } else {
            // Fallback: 직접 삭제
            const records = getRecords();
            const filteredRecords = records.filter(r => r.id !== recordId);
            saveRecords(filteredRecords);
        }

        return { success: true };

    } catch (error) {
        console.error('레코드 삭제 실패:', error);
        return { success: false, error: '레코드 삭제에 실패했습니다.' };
    }
}

/**
 * 레코드 업데이트
 * @param {number} recordId - 업데이트할 레코드 ID
 * @param {Object} updates - 업데이트할 데이터
 * @returns {Object} 결과 객체
 */
function updateRecord(recordId, updates) {
    try {
        if (window.MapleState) {
            window.MapleState.updateRecord(recordId, updates);
        } else {
            // Fallback: 직접 업데이트
            const records = getRecords();
            const recordIndex = records.findIndex(r => r.id === recordId);
            
            if (recordIndex === -1) {
                return { success: false, error: '레코드를 찾을 수 없습니다.' };
            }
            
            records[recordIndex] = { ...records[recordIndex], ...updates };
            saveRecords(records);
        }

        return { success: true };

    } catch (error) {
        console.error('레코드 업데이트 실패:', error);
        return { success: false, error: '레코드 업데이트에 실패했습니다.' };
    }
}

/**
 * 모든 레코드 조회
 * @returns {Array} 레코드 배열
 */
function getRecords() {
    try {
        if (window.MapleState) {
            return window.MapleState.getState('records') || [];
        } else {
            // Fallback: localStorage에서 직접 로딩
            const data = localStorage.getItem('mapleSsalMeokData');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.records || [];
            }
            return [];
        }
    } catch (error) {
        console.error('레코드 조회 실패:', error);
        return [];
    }
}

/**
 * 뷰별 필터링된 레코드 조회
 * @param {string} viewType - 뷰 타입 (daily, weekly, monthly, yearly)
 * @returns {Array} 필터링된 레코드 배열
 */
function getFilteredRecords(viewType = null) {
    const records = getRecords();
    const currentView = viewType || (window.MapleState ? window.MapleState.getState('currentView') : 'daily');
    
    if (window.MapleHelpers && window.MapleHelpers.filterRecordsByView) {
        return window.MapleHelpers.filterRecordsByView(records, currentView);
    } else {
        // Fallback 필터링
        return filterRecordsByViewFallback(records, currentView);
    }
}

/**
 * 카테고리별 레코드 조회
 * @param {string} category - 카테고리
 * @param {string} type - 타입 (income/expense, 선택사항)
 * @returns {Array} 필터링된 레코드 배열
 */
function getRecordsByCategory(category, type = null) {
    const records = getRecords();
    
    return records.filter(record => {
        const categoryMatch = record.category === category;
        const typeMatch = !type || record.type === type;
        return categoryMatch && typeMatch;
    });
}

/**
 * 기간별 레코드 조회
 * @param {Date} startDate - 시작 날짜
 * @param {Date} endDate - 끝 날짜
 * @returns {Array} 필터링된 레코드 배열
 */
function getRecordsByDateRange(startDate, endDate) {
    const records = getRecords();
    
    return records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
    });
}

/**
 * 태그별 레코드 조회
 * @param {string} tag - 태그 (# 포함)
 * @returns {Array} 필터링된 레코드 배열
 */
function getRecordsByTag(tag) {
    const records = getRecords();
    
    return records.filter(record => {
        return record.tags && record.tags.includes(tag);
    });
}

/**
 * 레코드 통계 계산
 * @param {Array} records - 레코드 배열 (선택사항, 기본값: 모든 레코드)
 * @returns {Object} 통계 객체
 */
function calculateRecordStatistics(records = null) {
    const recordsToAnalyze = records || getFilteredRecords();
    
    const stats = {
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        recordCount: recordsToAnalyze.length,
        incomeCount: 0,
        expenseCount: 0,
        averageIncome: 0,
        averageExpense: 0,
        categoryBreakdown: {
            income: {},
            expense: {}
        },
        dailyAverage: 0,
        profitRate: 0
    };

    // 기본 계산
    recordsToAnalyze.forEach(record => {
        if (record.type === 'income') {
            stats.totalIncome += record.amount;
            stats.incomeCount++;
            
            // 카테고리별 집계
            if (!stats.categoryBreakdown.income[record.category]) {
                stats.categoryBreakdown.income[record.category] = 0;
            }
            stats.categoryBreakdown.income[record.category] += record.amount;
            
        } else if (record.type === 'expense') {
            stats.totalExpense += record.amount;
            stats.expenseCount++;
            
            // 카테고리별 집계
            if (!stats.categoryBreakdown.expense[record.category]) {
                stats.categoryBreakdown.expense[record.category] = 0;
            }
            stats.categoryBreakdown.expense[record.category] += record.amount;
        }
    });

    // 파생 계산
    stats.netProfit = stats.totalIncome - stats.totalExpense;
    stats.averageIncome = stats.incomeCount > 0 ? stats.totalIncome / stats.incomeCount : 0;
    stats.averageExpense = stats.expenseCount > 0 ? stats.totalExpense / stats.expenseCount : 0;
    stats.profitRate = stats.totalIncome > 0 ? (stats.netProfit / stats.totalIncome) * 100 : 0;

    // 일평균 계산
    const currentView = window.MapleState ? window.MapleState.getState('currentView') : 'daily';
    const daysInPeriod = getDaysInPeriod(currentView);
    stats.dailyAverage = stats.totalIncome > 0 ? stats.totalIncome / daysInPeriod : 0;

    return stats;
}

/**
 * 시간대별 분석
 * @param {Array} records - 분석할 레코드 배열
 * @returns {Object} 시간대별 분석 결과
 */
function analyzeHourlyPatterns(records = null) {
    const recordsToAnalyze = records || getRecords();
    
    const hourlyData = {
        income: new Array(24).fill(0),
        expense: new Array(24).fill(0),
        counts: new Array(24).fill(0),
        averages: new Array(24).fill(0)
    };

    recordsToAnalyze.forEach(record => {
        const hour = new Date(record.date).getHours();
        hourlyData.counts[hour]++;
        
        if (record.type === 'income') {
            hourlyData.income[hour] += record.amount;
        } else {
            hourlyData.expense[hour] += record.amount;
        }
    });

    // 시간대별 평균 계산
    for (let i = 0; i < 24; i++) {
        if (hourlyData.counts[i] > 0) {
            hourlyData.averages[i] = hourlyData.income[i] / hourlyData.counts[i];
        }
    }

    return hourlyData;
}

/**
 * 요일별 분석
 * @param {Array} records - 분석할 레코드 배열
 * @returns {Object} 요일별 분석 결과
 */
function analyzeWeekdayPatterns(records = null) {
    const recordsToAnalyze = records || getRecords();
    
    const weekdayData = {
        income: new Array(7).fill(0),
        expense: new Array(7).fill(0),
        counts: new Array(7).fill(0),
        averages: new Array(7).fill(0)
    };

    recordsToAnalyze.forEach(record => {
        const day = new Date(record.date).getDay();
        weekdayData.counts[day]++;
        
        if (record.type === 'income') {
            weekdayData.income[day] += record.amount;
        } else {
            weekdayData.expense[day] += record.amount;
        }
    });

    // 요일별 평균 계산
    for (let i = 0; i < 7; i++) {
        if (weekdayData.counts[i] > 0) {
            weekdayData.averages[i] = weekdayData.income[i] / weekdayData.counts[i];
        }
    }

    return weekdayData;
}

/**
 * 월별 분석
 * @param {Array} records - 분석할 레코드 배열
 * @returns {Object} 월별 분석 결과
 */
function analyzeMonthlyTrends(records = null) {
    const recordsToAnalyze = records || getRecords();
    const monthlyData = {};

    recordsToAnalyze.forEach(record => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                income: 0,
                expense: 0,
                count: 0,
                profit: 0
            };
        }

        if (record.type === 'income') {
            monthlyData[monthKey].income += record.amount;
        } else {
            monthlyData[monthKey].expense += record.amount;
        }
        
        monthlyData[monthKey].count++;
        monthlyData[monthKey].profit = monthlyData[monthKey].income - monthlyData[monthKey].expense;
    });

    return monthlyData;
}

/**
 * 탑 카테고리 조회
 * @param {string} type - 타입 (income/expense)
 * @param {number} limit - 반환할 개수
 * @returns {Array} 탑 카테고리 배열
 */
function getTopCategories(type, limit = 5) {
    const stats = calculateRecordStatistics();
    const categoryData = stats.categoryBreakdown[type];
    
    return Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([category, amount]) => ({ category, amount }));
}

/**
 * 레코드 검색
 * @param {string} query - 검색어
 * @param {Object} filters - 추가 필터 (type, category, dateRange 등)
 * @returns {Array} 검색 결과
 */
function searchRecords(query, filters = {}) {
    const records = getRecords();
    
    return records.filter(record => {
        // 텍스트 검색
        const textMatch = !query || 
            record.memo.toLowerCase().includes(query.toLowerCase()) ||
            record.category.toLowerCase().includes(query.toLowerCase());
        
        // 타입 필터
        const typeMatch = !filters.type || record.type === filters.type;
        
        // 카테고리 필터
        const categoryMatch = !filters.category || record.category === filters.category;
        
        // 날짜 범위 필터
        const dateMatch = !filters.dateRange || 
            (new Date(record.date) >= filters.dateRange.start && 
             new Date(record.date) <= filters.dateRange.end);
        
        // 금액 범위 필터
        const amountMatch = !filters.amountRange ||
            (record.amount >= filters.amountRange.min &&
             record.amount <= filters.amountRange.max);
        
        return textMatch && typeMatch && categoryMatch && dateMatch && amountMatch;
    });
}

/**
 * 중복 레코드 탐지
 * @param {number} timeThreshold - 시간 임계값 (분)
 * @returns {Array} 중복 가능성이 있는 레코드 그룹
 */
function detectDuplicateRecords(timeThreshold = 5) {
    const records = getRecords();
    const duplicates = [];
    
    for (let i = 0; i < records.length; i++) {
        for (let j = i + 1; j < records.length; j++) {
            const record1 = records[i];
            const record2 = records[j];
            
            // 같은 타입, 카테고리, 금액
            if (record1.type === record2.type &&
                record1.category === record2.category &&
                record1.amount === record2.amount) {
                
                // 시간 차이 확인
                const timeDiff = Math.abs(new Date(record1.date) - new Date(record2.date));
                if (timeDiff <= timeThreshold * 60 * 1000) {
                    duplicates.push([record1, record2]);
                }
            }
        }
    }
    
    return duplicates;
}

// === Helper Functions ===

function validateRecordInput(data) {
    if (!data.type || !['income', 'expense'].includes(data.type)) {
        return { isValid: false, error: '올바른 거래 유형을 선택해주세요.' };
    }
    
    if (!data.category) {
        return { isValid: false, error: '카테고리를 선택해주세요.' };
    }
    
    if (!data.amount || data.amount <= 0) {
        return { isValid: false, error: '올바른 금액을 입력해주세요.' };
    }
    
    return {
        isValid: true,
        data: {
            type: data.type,
            category: data.category,
            amount: data.amount,
            memo: data.memo || ''
        }
    };
}

function extractTags(text) {
    if (!text) return [];
    const tagRegex = /#[\w가-힣]+/g;
    return text.match(tagRegex) || [];
}

function saveRecords(records) {
    try {
        const existingData = JSON.parse(localStorage.getItem('mapleSsalMeokData') || '{}');
        existingData.records = records;
        localStorage.setItem('mapleSsalMeokData', JSON.stringify(existingData));
    } catch (error) {
        console.error('레코드 저장 실패:', error);
        throw error;
    }
}

function filterRecordsByViewFallback(records, currentView) {
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

function getDaysInPeriod(viewType) {
    switch (viewType) {
        case 'daily': return 1;
        case 'weekly': return 7;
        case 'monthly': return 30;
        case 'yearly': return 365;
        default: return 1;
    }
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addRecord,
        deleteRecord,
        updateRecord,
        getRecords,
        getFilteredRecords,
        getRecordsByCategory,
        getRecordsByDateRange,
        getRecordsByTag,
        calculateRecordStatistics,
        analyzeHourlyPatterns,
        analyzeWeekdayPatterns,
        analyzeMonthlyTrends,
        getTopCategories,
        searchRecords,
        detectDuplicateRecords
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleRecords = {
        addRecord,
        deleteRecord,
        updateRecord,
        getRecords,
        getFilteredRecords,
        getRecordsByCategory,
        getRecordsByDateRange,
        getRecordsByTag,
        calculateRecordStatistics,
        analyzeHourlyPatterns,
        analyzeWeekdayPatterns,
        analyzeMonthlyTrends,
        getTopCategories,
        searchRecords,
        detectDuplicateRecords
    };
}