/**
 * 패턴 분석 기능 모듈
 * 메이플 쌀먹 가계부 행동 패턴 분석 및 알림
 */

/**
 * 패턴 분석 업데이트
 */
function updatePatternAnalysis() {
    const records = getRecords();
    
    if (records.length < 3) {
        displayInsufficientPatternData();
        return;
    }

    const hourlyPatterns = analyzeHourlyPatterns(records);
    const weekdayPatterns = analyzeWeekdayPatterns(records);
    const monthlyPatterns = analyzeMonthlyPatterns(records);
    const recommendations = generatePatternRecommendations(records);

    displayPatternAnalysis({
        hourly: hourlyPatterns,
        weekday: weekdayPatterns,
        monthly: monthlyPatterns,
        recommendations: recommendations
    });
}

/**
 * 시간대별 패턴 분석
 * @param {Array} records - 분석할 기록
 * @returns {Object} 시간대별 패턴 결과
 */
function analyzeHourlyPatterns(records) {
    const hourlyData = {
        income: new Array(24).fill(0),
        expense: new Array(24).fill(0),
        counts: new Array(24).fill(0),
        averages: new Array(24).fill(0),
        peaks: [],
        valleys: []
    };

    // 데이터 집계
    records.forEach(record => {
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

    // 피크 시간대 찾기 (상위 5개)
    const hourlyRanking = [];
    for (let i = 0; i < 24; i++) {
        if (hourlyData.counts[i] > 0) {
            hourlyRanking.push({
                hour: i,
                avgIncome: hourlyData.averages[i],
                totalIncome: hourlyData.income[i],
                count: hourlyData.counts[i],
                timeRange: `${i}시 ~ ${i + 1}시`
            });
        }
    }

    hourlyData.peaks = hourlyRanking
        .sort((a, b) => b.avgIncome - a.avgIncome)
        .slice(0, 5);

    // 저조한 시간대 (하위 3개)
    hourlyData.valleys = hourlyRanking
        .sort((a, b) => a.avgIncome - b.avgIncome)
        .slice(0, 3);

    return hourlyData;
}

/**
 * 요일별 패턴 분석
 * @param {Array} records - 분석할 기록
 * @returns {Object} 요일별 패턴 결과
 */
function analyzeWeekdayPatterns(records) {
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekdayData = {
        income: new Array(7).fill(0),
        expense: new Array(7).fill(0),
        counts: new Array(7).fill(0),
        averages: new Array(7).fill(0),
        details: []
    };

    // 데이터 집계
    records.forEach(record => {
        const day = new Date(record.date).getDay();
        weekdayData.counts[day]++;
        
        if (record.type === 'income') {
            weekdayData.income[day] += record.amount;
        } else {
            weekdayData.expense[day] += record.amount;
        }
    });

    // 요일별 평균 및 상세 정보 계산
    for (let i = 0; i < 7; i++) {
        if (weekdayData.counts[i] > 0) {
            weekdayData.averages[i] = weekdayData.income[i] / weekdayData.counts[i];
        }

        weekdayData.details.push({
            day: i,
            name: weekdays[i],
            avgIncome: weekdayData.averages[i],
            totalIncome: weekdayData.income[i],
            totalExpense: weekdayData.expense[i],
            count: weekdayData.counts[i],
            profit: weekdayData.income[i] - weekdayData.expense[i]
        });
    }

    // 수익률 기준 정렬
    weekdayData.details.sort((a, b) => b.avgIncome - a.avgIncome);

    return weekdayData;
}

/**
 * 월별 패턴 분석
 * @param {Array} records - 분석할 기록
 * @returns {Object} 월별 패턴 결과
 */
function analyzeMonthlyPatterns(records) {
    const monthlyData = {};
    const monthNames = [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
    ];

    // 월별 데이터 집계
    records.forEach(record => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                monthName: monthNames[date.getMonth()],
                income: 0,
                expense: 0,
                count: 0,
                profit: 0,
                profitRate: 0
            };
        }

        if (record.type === 'income') {
            monthlyData[monthKey].income += record.amount;
        } else {
            monthlyData[monthKey].expense += record.amount;
        }
        
        monthlyData[monthKey].count++;
    });

    // 월별 수익률 계산
    Object.values(monthlyData).forEach(month => {
        month.profit = month.income - month.expense;
        month.profitRate = month.income > 0 ? (month.profit / month.income * 100) : 0;
    });

    // 최근 6개월 데이터만 선별하여 정렬
    const sortedMonths = Object.entries(monthlyData)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 6)
        .map(([key, data]) => data);

    return {
        monthlyData: monthlyData,
        recentMonths: sortedMonths,
        bestMonth: Object.values(monthlyData).sort((a, b) => b.profit - a.profit)[0],
        worstMonth: Object.values(monthlyData).sort((a, b) => a.profit - b.profit)[0]
    };
}

/**
 * 카테고리별 패턴 분석
 * @param {Array} records - 분석할 기록
 * @returns {Object} 카테고리 패턴 결과
 */
function analyzeCategoryPatterns(records) {
    const categoryData = {
        income: {},
        expense: {}
    };

    // 카테고리별 집계
    records.forEach(record => {
        const type = record.type;
        const category = record.category;
        
        if (!categoryData[type][category]) {
            categoryData[type][category] = {
                total: 0,
                count: 0,
                average: 0,
                frequency: 0
            };
        }
        
        categoryData[type][category].total += record.amount;
        categoryData[type][category].count++;
    });

    // 평균 및 빈도 계산
    Object.keys(categoryData).forEach(type => {
        Object.keys(categoryData[type]).forEach(category => {
            const data = categoryData[type][category];
            data.average = data.total / data.count;
            data.frequency = (data.count / records.filter(r => r.type === type).length) * 100;
        });
    });

    return categoryData;
}

/**
 * 재획 패턴 분석 (특별 분석)
 * @param {Array} records - 분석할 기록
 * @returns {Object} 재획 패턴 결과
 */
function analyzeRehouakPatterns(records) {
    const rehouakRecords = records.filter(r => 
        r.type === 'income' && r.category === '재획'
    );

    if (rehouakRecords.length < 5) {
        return { insufficient: true };
    }

    const rehouakByHour = {};
    const rehouakByDay = {};
    
    rehouakRecords.forEach(record => {
        const date = new Date(record.date);
        const hour = date.getHours();
        const day = date.getDay();
        
        // 시간대별
        if (!rehouakByHour[hour]) {
            rehouakByHour[hour] = { total: 0, count: 0 };
        }
        rehouakByHour[hour].total += record.amount;
        rehouakByHour[hour].count++;
        
        // 요일별
        if (!rehouakByDay[day]) {
            rehouakByDay[day] = { total: 0, count: 0 };
        }
        rehouakByDay[day].total += record.amount;
        rehouakByDay[day].count++;
    });

    // 최적 재획 시간대
    const bestHours = Object.entries(rehouakByHour)
        .map(([hour, data]) => ({
            hour: parseInt(hour),
            avg: data.total / data.count,
            total: data.total,
            count: data.count,
            timeRange: `${hour}시 ~ ${parseInt(hour) + 1}시`
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 3);

    return {
        totalRehouak: rehouakRecords.length,
        totalAmount: rehouakRecords.reduce((sum, r) => sum + r.amount, 0),
        averageAmount: rehouakRecords.reduce((sum, r) => sum + r.amount, 0) / rehouakRecords.length,
        bestHours: bestHours,
        hourlyData: rehouakByHour,
        dailyData: rehouakByDay
    };
}

/**
 * 지출 주의 패턴 분석
 * @param {Array} records - 분석할 기록
 * @returns {Array} 주의할 지출 패턴
 */
function analyzeSpendingAlerts(records) {
    const alerts = [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentExpenses = records.filter(r => 
        r.type === 'expense' && new Date(r.date) >= oneWeekAgo
    );

    // 빈번한 지출 카테고리
    const expenseCount = {};
    recentExpenses.forEach(record => {
        expenseCount[record.category] = (expenseCount[record.category] || 0) + 1;
    });

    Object.entries(expenseCount).forEach(([category, count]) => {
        if (count > 10) {
            alerts.push({
                type: 'frequent_expense',
                category: category,
                count: count,
                severity: 'high',
                message: `최근 일주일간 '${category}'에 ${count}번 지출했습니다.`
            });
        } else if (count > 5) {
            alerts.push({
                type: 'frequent_expense',
                category: category,
                count: count,
                severity: 'medium',
                message: `'${category}' 지출이 자주 발생하고 있습니다 (${count}번).`
            });
        }
    });

    // 큰 금액 지출
    const largeExpenses = recentExpenses
        .filter(r => r.amount > 1000000000) // 10억 이상
        .map(r => ({
            type: 'large_expense',
            amount: r.amount,
            category: r.category,
            date: r.date,
            severity: r.amount > 5000000000 ? 'high' : 'medium',
            message: `${r.category}에 ${formatMeso(r.amount)} 대량 지출`
        }));

    alerts.push(...largeExpenses);

    return alerts;
}

/**
 * 패턴 기반 추천 생성
 * @param {Array} records - 분석할 기록
 * @returns {Array} 추천 목록
 */
function generatePatternRecommendations(records) {
    const recommendations = [];
    const hourlyPatterns = analyzeHourlyPatterns(records);
    const weekdayPatterns = analyzeWeekdayPatterns(records);
    const rehouakPatterns = analyzeRehouakPatterns(records);
    const spendingAlerts = analyzeSpendingAlerts(records);

    // 최적 시간대 추천
    if (hourlyPatterns.peaks.length > 0) {
        const bestHour = hourlyPatterns.peaks[0];
        recommendations.push({
            type: 'optimal_time',
            priority: 'high',
            icon: '🕐',
            title: '최적 활동 시간',
            message: `${bestHour.timeRange}에 평균 수익이 가장 높습니다 (${formatMeso(bestHour.avgIncome)}).`,
            action: '이 시간대에 집중적으로 활동해보세요.'
        });
    }

    // 요일별 추천
    if (weekdayPatterns.details.length > 0) {
        const bestDay = weekdayPatterns.details[0];
        recommendations.push({
            type: 'optimal_day',
            priority: 'medium',
            icon: '📅',
            title: '최적 활동 요일',
            message: `${bestDay.name}에 평균 수익이 가장 높습니다.`,
            action: '이 요일에 더 많은 시간을 투자해보세요.'
        });
    }

    // 재획 시간 추천
    if (rehouakPatterns && !rehouakPatterns.insufficient && rehouakPatterns.bestHours.length > 0) {
        const bestRehouakTime = rehouakPatterns.bestHours[0];
        recommendations.push({
            type: 'rehouak_time',
            priority: 'medium',
            icon: '🎯',
            title: '최적 재획 시간',
            message: `${bestRehouakTime.timeRange}에 재획 평균 수익이 가장 높습니다.`,
            action: '이 시간에 재획을 시도해보세요.'
        });
    }

    // 지출 주의 알림
    spendingAlerts.forEach(alert => {
        if (alert.severity === 'high') {
            recommendations.push({
                type: 'spending_warning',
                priority: 'high',
                icon: '⚠️',
                title: '지출 주의',
                message: alert.message,
                action: '지출 패턴을 점검하고 절약 방안을 고려해보세요.'
            });
        }
    });

    return recommendations;
}

/**
 * 패턴 알림 표시
 */
function showPatternAnalysis() {
    const records = getRecords();
    
    if (records.length < 10) return;

    const patterns = analyzeGeneralPatterns();
    if (patterns.length === 0) return;

    // 알림 팝업 생성
    createPatternNotification(patterns);
}

/**
 * 일반 패턴 분석 (알림용)
 * @returns {Array} 알림할 패턴 목록
 */
function analyzeGeneralPatterns() {
    const patterns = [];
    const records = getRecords();
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // 시간대별 패턴
    const hourlyPatterns = analyzeHourlyPatterns(records);
    if (hourlyPatterns.peaks.length > 0) {
        const bestHour = hourlyPatterns.peaks[0];
        if (bestHour.hour === hour) {
            patterns.push(`📈 지금 시간대(${hour}시)는 평소 수익이 가장 많은 시간입니다!`);
        }
    }

    // 요일별 패턴 (목요일 보스 리셋)
    if (day === 4) {
        patterns.push(`🗓️ 오늘은 목요일! 주간 보스가 리셋되는 날입니다.`);
    }

    // 지출 주의 패턴
    const spendingAlerts = analyzeSpendingAlerts(records);
    const highAlerts = spendingAlerts.filter(alert => alert.severity === 'high');
    if (highAlerts.length > 0) {
        patterns.push(`⚠️ ${highAlerts[0].message}`);
    }

    return patterns;
}

/**
 * 주간 패턴 보고서 생성
 * @returns {Object} 주간 보고서
 */
function generateWeeklyPatternReport() {
    const records = getRecords();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyRecords = records.filter(r => new Date(r.date) >= oneWeekAgo);
    
    const report = {
        period: '최근 7일',
        totalRecords: weeklyRecords.length,
        totalIncome: weeklyRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0),
        totalExpense: weeklyRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0),
        dailyBreakdown: {},
        insights: []
    };

    // 일별 분석
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toDateString();
        
        const dayRecords = weeklyRecords.filter(r => 
            new Date(r.date).toDateString() === dateKey
        );
        
        report.dailyBreakdown[dateKey] = {
            income: dayRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0),
            expense: dayRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0),
            count: dayRecords.length
        };
    }

    // 인사이트 생성
    const profit = report.totalIncome - report.totalExpense;
    const profitRate = report.totalIncome > 0 ? (profit / report.totalIncome * 100) : 0;
    
    if (profitRate > 50) {
        report.insights.push('🎉 이번 주는 높은 수익률을 기록했습니다!');
    } else if (profitRate < 0) {
        report.insights.push('📉 이번 주는 지출이 수익을 초과했습니다.');
    }

    return report;
}

// === Helper Functions ===

function getRecords() {
    // main-complete.js의 전역 변수 사용
    return window.records || [];
}

function formatMeso(value) {
    // main-complete.js의 formatMeso 함수 사용
    if (window.formatMeso) {
        return window.formatMeso(value);
    }
    // 폴백: 기본 포맷
    if (value >= 100000000) {
        const billions = value / 100000000;
        return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
    } else if (value >= 10000) {
        const tenThousands = Math.floor(value / 10000);
        return `${tenThousands.toLocaleString()}만`;
    }
    return value.toLocaleString();
}

function displayPatternAnalysis(patterns) {
    // 시간대별 패턴 표시
    displayHourlyPatterns(patterns.hourly);
    
    // 요일별 패턴 표시
    displayWeekdayPatterns(patterns.weekday);
    
    // 월별 패턴 표시
    displayMonthlyPatterns(patterns.monthly);
    
    // 추천사항 표시
    displayPatternRecommendations(patterns.recommendations);
}

function displayHourlyPatterns(hourlyData) {
    const element = document.getElementById('hourlyPattern');
    if (!element) return;

    let html = '';
    hourlyData.peaks.slice(0, 5).forEach(item => {
        html += `
            <div class="pattern-detail">
                <strong>${item.timeRange}</strong><br>
                평균 수익: ${formatMeso(item.avgIncome)}<br>
                총 수익: ${formatMeso(item.totalIncome)} (${item.count}회)
            </div>
        `;
    });

    element.innerHTML = html || '<div class="pattern-detail">데이터가 없습니다.</div>';
}

function displayWeekdayPatterns(weekdayData) {
    const element = document.getElementById('weekdayPattern');
    if (!element) return;

    let html = '';
    weekdayData.details.forEach(item => {
        html += `
            <div class="pattern-detail">
                <strong>${item.name}</strong><br>
                평균 수익: ${formatMeso(item.avgIncome)}<br>
                총 수익: ${formatMeso(item.totalIncome)} (${item.count}회)
            </div>
        `;
    });

    element.innerHTML = html || '<div class="pattern-detail">데이터가 없습니다.</div>';
}

function displayMonthlyPatterns(monthlyData) {
    const element = document.getElementById('monthlyPattern');
    if (!element) return;

    let html = '';
    monthlyData.recentMonths.forEach(month => {
        const profitColor = month.profit >= 0 ? '#228B22' : '#DC143C';
        html += `
            <div class="pattern-detail">
                <strong>${month.year}.${month.month}</strong><br>
                수익: ${formatMeso(month.income)}<br>
                지출: ${formatMeso(month.expense)}<br>
                순이익: <span style="color: ${profitColor}">${formatMeso(month.profit)}</span><br>
                수익률: ${month.profitRate.toFixed(1)}%
            </div>
        `;
    });

    element.innerHTML = html || '<div class="pattern-detail">데이터가 없습니다.</div>';
}

function displayPatternRecommendations(recommendations) {
    const element = document.getElementById('recommendationPattern');
    if (!element) return;

    let html = '';
    recommendations.forEach(rec => {
        html += `
            <div class="pattern-detail">
                <strong>${rec.icon} ${rec.title}</strong><br>
                ${rec.message}<br>
                <em>${rec.action}</em>
            </div>
        `;
    });

    element.innerHTML = html || '<div class="pattern-detail">추천 정보가 없습니다.</div>';
}

function displayInsufficientPatternData() {
    const elements = ['hourlyPattern', 'weekdayPattern', 'monthlyPattern', 'recommendationPattern'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<div class="pattern-detail">최소 3개 이상의 기록이 필요합니다.</div>';
        }
    });
}

function createPatternNotification(patterns) {
    const popup = document.createElement('div');
    popup.className = 'popup-notification';
    popup.innerHTML = `
        <div class="popup-title">🧙 쌀먹 가계부 비서의 분석</div>
        <div>${patterns.join('<br>')}</div>
        <button onclick="this.parentElement.remove()" style="margin-top: 15px; width: 100%;">확인</button>
    `;

    document.body.appendChild(popup);

    // 10초 후 자동 제거
    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
        }
    }, 10000);
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updatePatternAnalysis,
        analyzeHourlyPatterns,
        analyzeWeekdayPatterns,
        analyzeMonthlyPatterns,
        analyzeCategoryPatterns,
        analyzeRehouakPatterns,
        analyzeSpendingAlerts,
        generatePatternRecommendations,
        showPatternAnalysis,
        analyzeGeneralPatterns,
        generateWeeklyPatternReport
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MaplePatterns = {
        updatePatternAnalysis,
        analyzeHourlyPatterns,
        analyzeWeekdayPatterns,
        analyzeMonthlyPatterns,
        analyzeCategoryPatterns,
        analyzeRehouakPatterns,
        analyzeSpendingAlerts,
        generatePatternRecommendations,
        showPatternAnalysis,
        analyzeGeneralPatterns,
        generateWeeklyPatternReport
    };
}