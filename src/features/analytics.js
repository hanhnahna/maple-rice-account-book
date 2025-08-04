/**
 * 예측 분석, AI 추천 기능
 * 메이플 쌀먹 가계부 분석 및 예측 모듈
 */

/**
 * 수익 예측 업데이트
 */
function updatePredictions() {
    const records = getRecords();
    
    // 수익 기록만 필터링
    const incomeRecords = records.filter(r => r.type === 'income');
    
    if (incomeRecords.length < 3) {
        displayInsufficientDataMessage();
        return;
    }

    const predictions = calculatePredictions(records);
    const optimalTime = findOptimalTime(records);
    const recommendations = generateAIRecommendations(records);

    displayPredictions(predictions, optimalTime, recommendations);
}

/**
 * 수익 예측 계산
 * @param {Array} records - 기록 배열
 * @returns {Object} 예측 결과
 */
function calculatePredictions(records) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = records.filter(r => new Date(r.date) >= thirtyDaysAgo);
    
    // 일별 수익 계산
    const dailyIncome = calculateDailyIncome(recentRecords);
    const dailyValues = Object.values(dailyIncome);
    
    const avgDailyIncome = dailyValues.length > 0 ?
        dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;

    // 트렌드 분석
    const trend = analyzeTrend(dailyValues);
    
    // 예측 계산
    const weekPrediction = calculateWeeklyPrediction(avgDailyIncome, trend);
    const monthPrediction = calculateMonthlyPrediction(avgDailyIncome, trend);
    const quarterPrediction = calculateQuarterlyPrediction(avgDailyIncome, trend);

    return {
        daily: avgDailyIncome,
        weekly: weekPrediction,
        monthly: monthPrediction,
        quarterly: quarterPrediction,
        trend: trend,
        confidence: calculateConfidence(dailyValues)
    };
}

/**
 * 최적 수익 시간대 찾기
 * @param {Array} records - 기록 배열
 * @returns {Object} 최적 시간 정보
 */
function findOptimalTime(records) {
    const recentRecords = records.filter(r => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return r.type === 'income' && new Date(r.date) >= thirtyDaysAgo;
    });

    const hourlyIncome = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    recentRecords.forEach(record => {
        const hour = new Date(record.date).getHours();
        hourlyIncome[hour] += record.amount;
        hourlyCounts[hour]++;
    });

    let maxAvgIncome = 0;
    let optimalHour = 0;

    for (let i = 0; i < 24; i++) {
        if (hourlyCounts[i] > 0) {
            const avgIncome = hourlyIncome[i] / hourlyCounts[i];
            if (avgIncome > maxAvgIncome) {
                maxAvgIncome = avgIncome;
                optimalHour = i;
            }
        }
    }

    return {
        hour: optimalHour,
        timeRange: `${optimalHour}시 ~ ${optimalHour + 1}시`,
        avgIncome: maxAvgIncome,
        totalIncome: hourlyIncome[optimalHour],
        frequency: hourlyCounts[optimalHour]
    };
}

/**
 * AI 추천 생성
 * @param {Array} records - 기록 배열
 * @returns {Array} 추천 목록
 */
function generateAIRecommendations(records) {
    const recommendations = [];
    
    // 성장률 분석
    const growthAnalysis = analyzeGrowthRate(records);
    if (growthAnalysis.recommendation) {
        recommendations.push(growthAnalysis.recommendation);
    }

    // 카테고리 분석
    const categoryAnalysis = analyzeCategoryPerformance(records);
    if (categoryAnalysis.recommendation) {
        recommendations.push(categoryAnalysis.recommendation);
    }

    // 요일별 분석
    const weekdayAnalysis = analyzeWeekdayPatterns(records);
    if (weekdayAnalysis.recommendation) {
        recommendations.push(weekdayAnalysis.recommendation);
    }

    // 지출 패턴 분석
    const expenseAnalysis = analyzeExpensePatterns(records);
    if (expenseAnalysis.recommendation) {
        recommendations.push(expenseAnalysis.recommendation);
    }

    // 효율성 분석
    const efficiencyAnalysis = analyzeEfficiency(records);
    if (efficiencyAnalysis.recommendation) {
        recommendations.push(efficiencyAnalysis.recommendation);
    }

    return recommendations;
}

/**
 * 성장률 분석
 * @param {Array} records - 기록 배열
 * @returns {Object} 성장률 분석 결과
 */
function analyzeGrowthRate(records) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const lastWeekIncome = records
        .filter(r => r.type === 'income' && new Date(r.date) >= sevenDaysAgo)
        .reduce((sum, r) => sum + r.amount, 0);

    const previousWeekIncome = records
        .filter(r => r.type === 'income' && 
                new Date(r.date) >= fourteenDaysAgo && 
                new Date(r.date) < sevenDaysAgo)
        .reduce((sum, r) => sum + r.amount, 0);

    if (previousWeekIncome === 0) return { growthRate: 0 };

    const growthRate = ((lastWeekIncome - previousWeekIncome) / previousWeekIncome) * 100;

    let recommendation = null;
    if (growthRate > 10) {
        recommendation = `📈 최근 수익이 ${growthRate.toFixed(1)}% 증가했습니다. 현재 전략을 유지하세요!`;
    } else if (growthRate < -10) {
        recommendation = `📉 최근 수익이 ${Math.abs(growthRate).toFixed(1)}% 감소했습니다. 새로운 수익원을 찾아보세요.`;
    } else if (Math.abs(growthRate) <= 5) {
        recommendation = `📊 수익이 안정적입니다. 새로운 도전을 고려해보세요.`;
    }

    return {
        growthRate: growthRate,
        lastWeekIncome: lastWeekIncome,
        previousWeekIncome: previousWeekIncome,
        recommendation: recommendation
    };
}

/**
 * 카테고리 성과 분석
 * @param {Array} records - 기록 배열
 * @returns {Object} 카테고리 분석 결과
 */
function analyzeCategoryPerformance(records) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentIncomeRecords = records.filter(r => 
        r.type === 'income' && new Date(r.date) >= thirtyDaysAgo
    );

    const categoryIncome = {};
    recentIncomeRecords.forEach(record => {
        categoryIncome[record.category] = (categoryIncome[record.category] || 0) + record.amount;
    });

    const sortedCategories = Object.entries(categoryIncome)
        .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length === 0) return {};

    const topCategory = sortedCategories[0];
    const totalIncome = Object.values(categoryIncome).reduce((a, b) => a + b, 0);
    const percentage = (topCategory[1] / totalIncome * 100).toFixed(1);

    return {
        topCategory: topCategory[0],
        amount: topCategory[1],
        percentage: percentage,
        recommendation: `💰 '${topCategory[0]}'이(가) 가장 큰 수익원입니다 (${formatMeso(topCategory[1])}, ${percentage}%).`
    };
}

/**
 * 요일별 패턴 분석
 * @param {Array} records - 기록 배열
 * @returns {Object} 요일별 분석 결과
 */
function analyzeWeekdayPatterns(records) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentIncomeRecords = records.filter(r => 
        r.type === 'income' && new Date(r.date) >= thirtyDaysAgo
    );

    const weekdayIncome = new Array(7).fill(0);
    const weekdayCounts = new Array(7).fill(0);

    recentIncomeRecords.forEach(record => {
        const day = new Date(record.date).getDay();
        weekdayIncome[day] += record.amount;
        weekdayCounts[day]++;
    });

    let bestDay = 0;
    let bestDayAvg = 0;

    for (let i = 0; i < 7; i++) {
        if (weekdayCounts[i] > 0) {
            const avg = weekdayIncome[i] / weekdayCounts[i];
            if (avg > bestDayAvg) {
                bestDayAvg = avg;
                bestDay = i;
            }
        }
    }

    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    
    return {
        bestDay: bestDay,
        bestDayName: weekdays[bestDay],
        avgIncome: bestDayAvg,
        recommendation: `📅 ${weekdays[bestDay]}에 평균 수익이 가장 높습니다 (${formatMeso(bestDayAvg)}).`
    };
}

/**
 * 지출 패턴 분석
 * @param {Array} records - 기록 배열
 * @returns {Object} 지출 분석 결과
 */
function analyzeExpensePatterns(records) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentExpenses = records
        .filter(r => r.type === 'expense' && new Date(r.date) >= sevenDaysAgo)
        .map(r => r.category);

    const expenseCount = {};
    recentExpenses.forEach(category => {
        expenseCount[category] = (expenseCount[category] || 0) + 1;
    });

    const sortedExpenses = Object.entries(expenseCount)
        .sort((a, b) => b[1] - a[1]);

    if (sortedExpenses.length === 0) return {};

    const frequentExpense = sortedExpenses[0];
    
    let recommendation = null;
    if (frequentExpense[1] > 10) {
        recommendation = `⚠️ 최근 일주일간 '${frequentExpense[0]}'에 ${frequentExpense[1]}번 지출했습니다. 지출 관리를 고려해보세요.`;
    } else if (frequentExpense[1] > 5) {
        recommendation = `💸 '${frequentExpense[0]}' 지출이 자주 발생하고 있습니다 (${frequentExpense[1]}번).`;
    }

    return {
        frequentCategory: frequentExpense[0],
        frequency: frequentExpense[1],
        recommendation: recommendation
    };
}

/**
 * 효율성 분석
 * @param {Array} records - 기록 배열
 * @returns {Object} 효율성 분석 결과
 */
function analyzeEfficiency(records) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRecords = records.filter(r => new Date(r.date) >= thirtyDaysAgo);
    
    const totalIncome = recentRecords
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpense = recentRecords
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);

    if (totalIncome === 0) return {};

    const profitRate = ((totalIncome - totalExpense) / totalIncome) * 100;
    const expenseRatio = (totalExpense / totalIncome) * 100;

    let recommendation = null;
    if (profitRate > 80) {
        recommendation = `🎉 높은 수익률을 기록하고 있습니다! (${profitRate.toFixed(1)}%)`;
    } else if (profitRate > 50) {
        recommendation = `👍 안정적인 수익률을 유지하고 있습니다 (${profitRate.toFixed(1)}%).`;
    } else if (profitRate > 0) {
        recommendation = `⚡ 지출 관리로 수익률을 더 높일 수 있습니다 (현재 ${profitRate.toFixed(1)}%).`;
    } else {
        recommendation = `🚨 지출이 수익을 초과하고 있습니다. 긴급한 개선이 필요합니다.`;
    }

    return {
        profitRate: profitRate,
        expenseRatio: expenseRatio,
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        recommendation: recommendation
    };
}

/**
 * 미래 수익 시뮬레이션
 * @param {number} days - 시뮬레이션할 일수
 * @returns {Object} 시뮬레이션 결과
 */
function simulateFutureIncome(days = 30) {
    const records = getRecords();
    const predictions = calculatePredictions(records);
    
    const scenarios = {
        conservative: predictions.daily * 0.8 * days,
        realistic: predictions.daily * days,
        optimistic: predictions.daily * 1.2 * days
    };

    // 트렌드 적용
    if (predictions.trend > 0.1) {
        scenarios.realistic *= (1 + predictions.trend / 100);
        scenarios.optimistic *= (1 + predictions.trend / 100 * 1.5);
    } else if (predictions.trend < -0.1) {
        scenarios.realistic *= (1 + predictions.trend / 100);
        scenarios.conservative *= (1 + predictions.trend / 100 * 1.5);
    }

    return {
        period: days,
        scenarios: scenarios,
        confidence: predictions.confidence,
        trend: predictions.trend
    };
}

/**
 * 투자 수익률 분석
 * @param {string} category - 분석할 카테고리 (선택사항)
 * @returns {Object} 투자 분석 결과
 */
function analyzeInvestmentROI(category = null) {
    const records = getRecords();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRecords = records.filter(r => new Date(r.date) >= thirtyDaysAgo);
    
    const investments = recentRecords.filter(r => 
        r.type === 'expense' && 
        (category ? r.category === category : ['큐브', '스타포스'].includes(r.category))
    );
    
    const returns = recentRecords.filter(r => 
        r.type === 'income' && 
        r.memo && r.memo.includes('강화') || r.memo.includes('큐브')
    );

    const totalInvestment = investments.reduce((sum, r) => sum + r.amount, 0);
    const totalReturn = returns.reduce((sum, r) => sum + r.amount, 0);
    
    const roi = totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0;

    return {
        totalInvestment: totalInvestment,
        totalReturn: totalReturn,
        netProfit: totalReturn - totalInvestment,
        roi: roi,
        investmentCount: investments.length,
        successRate: investments.length > 0 ? (returns.length / investments.length) * 100 : 0
    };
}

/**
 * 계절성 분석
 * @returns {Object} 계절성 분석 결과
 */
function analyzeSeasonality() {
    const records = getRecords();
    const monthlyData = {};

    records.forEach(record => {
        if (record.type === 'income') {
            const month = new Date(record.date).getMonth();
            monthlyData[month] = (monthlyData[month] || 0) + record.amount;
        }
    });

    // 월별 평균 계산
    const monthlyAverages = [];
    for (let i = 0; i < 12; i++) {
        monthlyAverages[i] = monthlyData[i] || 0;
    }

    const totalAverage = monthlyAverages.reduce((a, b) => a + b, 0) / 12;
    
    // 최고/최저 월 찾기
    const bestMonth = monthlyAverages.indexOf(Math.max(...monthlyAverages));
    const worstMonth = monthlyAverages.indexOf(Math.min(...monthlyAverages.filter(x => x > 0)));

    const monthNames = [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
    ];

    return {
        monthlyAverages: monthlyAverages,
        totalAverage: totalAverage,
        bestMonth: bestMonth,
        worstMonth: worstMonth,
        bestMonthName: monthNames[bestMonth],
        worstMonthName: monthNames[worstMonth],
        seasonalVariation: Math.max(...monthlyAverages) - Math.min(...monthlyAverages.filter(x => x > 0))
    };
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

function calculateDailyIncome(records) {
    const dailyIncome = {};
    
    records.filter(r => r.type === 'income').forEach(record => {
        const date = new Date(record.date).toDateString();
        dailyIncome[date] = (dailyIncome[date] || 0) + record.amount;
    });

    return dailyIncome;
}

function analyzeTrend(values) {
    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
}

function calculateWeeklyPrediction(dailyAvg, trend) {
    const base = dailyAvg * 7;
    return trend > 0 ? base * (1 + trend / 100) : base;
}

function calculateMonthlyPrediction(dailyAvg, trend) {
    const base = dailyAvg * 30;
    return trend > 0 ? base * (1 + trend / 100) : base;
}

function calculateQuarterlyPrediction(dailyAvg, trend) {
    const base = dailyAvg * 90;
    return trend > 0 ? base * (1 + trend / 100) : base;
}

function calculateConfidence(values) {
    if (values.length < 3) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // 변동계수를 이용한 신뢰도 계산 (낮을수록 높은 신뢰도)
    const cv = mean > 0 ? stdDev / mean : 1;
    return Math.max(0, Math.min(100, (1 - cv) * 100));
}

function displayPredictions(predictions, optimalTime, recommendations) {
    // 주간/월간 예측 표시
    const weekElement = document.getElementById('weekPrediction');
    const monthElement = document.getElementById('monthPrediction');
    const optimalElement = document.getElementById('optimalTime');
    const recommendationElement = document.getElementById('aiRecommendation');

    if (weekElement) weekElement.textContent = formatMeso(predictions.weekly);
    if (monthElement) monthElement.textContent = formatMeso(predictions.monthly);
    if (optimalElement) optimalElement.textContent = optimalTime.timeRange;
    if (recommendationElement) {
        recommendationElement.innerHTML = recommendations.join('<br>');
    }
}

function displayInsufficientDataMessage() {
    const elements = ['weekPrediction', 'monthPrediction', 'optimalTime'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '데이터 부족';
    });

    const recommendationElement = document.getElementById('aiRecommendation');
    if (recommendationElement) {
        recommendationElement.innerHTML = '최소 3개 이상의 수익 기록이 필요합니다.';
    }
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updatePredictions,
        calculatePredictions,
        findOptimalTime,
        generateAIRecommendations,
        analyzeGrowthRate,
        analyzeCategoryPerformance,
        analyzeWeekdayPatterns,
        analyzeExpensePatterns,
        analyzeEfficiency,
        simulateFutureIncome,
        analyzeInvestmentROI,
        analyzeSeasonality
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleAnalytics = {
        updatePredictions,
        calculatePredictions,
        findOptimalTime,
        generateAIRecommendations,
        analyzeGrowthRate,
        analyzeCategoryPerformance,
        analyzeWeekdayPatterns,
        analyzeExpensePatterns,
        analyzeEfficiency,
        simulateFutureIncome,
        analyzeInvestmentROI,
        analyzeSeasonality
    };
}