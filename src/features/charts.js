/**
 * Chart.js 관련 모든 기능
 * 메이플 쌀먹 가계부 차트 관리 모듈
 */

// 차트 인스턴스 저장소
let chartInstances = {};

// 차트 색상 팔레트
const CHART_COLORS = {
    income: {
        primary: '#228B22',
        secondary: '#32CD32',
        tertiary: '#00FF00',
        quaternary: '#7CFC00'
    },
    expense: {
        primary: '#DC143C',
        secondary: '#FF6347',
        tertiary: '#FF4500'
    },
    profit: '#FF8C00',
    background: {
        income: 'rgba(34, 139, 34, 0.1)',
        expense: 'rgba(220, 20, 60, 0.1)',
        profit: 'rgba(255, 140, 0, 0.1)'
    }
};

/**
 * 모든 차트 업데이트
 */
function updateCharts() {
    const currentChart = getCurrentChartType();
    
    switch (currentChart) {
        case 'combined':
            updateCombinedChart();
            break;
        case 'income':
            updateIncomeChart();
            break;
        case 'expense':
            updateExpenseChart();
            break;
        case 'category':
            updateCategoryChart();
            break;
        default:
            updateCombinedChart();
    }
}

/**
 * 종합 차트 업데이트 (라인 차트)
 */
function updateCombinedChart() {
    const ctx = getChartContext();
    if (!ctx) return;

    destroyExistingChart('main');

    const chartData = prepareCombinedChartData();
    const config = createCombinedChartConfig(chartData);
    
    chartInstances.main = new Chart(ctx, config);
}

/**
 * 수익 분석 차트 업데이트 (극지역 차트)
 */
function updateIncomeChart() {
    const ctx = getChartContext();
    if (!ctx) return;

    destroyExistingChart('main');

    const chartData = prepareIncomeChartData();
    const config = createPolarAreaChartConfig(chartData, 'income');
    
    chartInstances.main = new Chart(ctx, config);
}

/**
 * 지출 분석 차트 업데이트 (극지역 차트)
 */
function updateExpenseChart() {
    const ctx = getChartContext();
    if (!ctx) return;

    destroyExistingChart('main');

    const chartData = prepareExpenseChartData();
    const config = createPolarAreaChartConfig(chartData, 'expense');
    
    chartInstances.main = new Chart(ctx, config);
}

/**
 * 카테고리별 차트 업데이트 (막대 차트)
 */
function updateCategoryChart() {
    const ctx = getChartContext();
    if (!ctx) return;

    destroyExistingChart('main');

    const chartData = prepareCategoryChartData();
    const config = createBarChartConfig(chartData);
    
    chartInstances.main = new Chart(ctx, config);
}

/**
 * 종합 차트 데이터 준비
 */
function prepareCombinedChartData() {
    const currentView = getCurrentView();
    const records = getFilteredRecords();
    
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    const profitData = [];

    const periods = getPeriodLabels(currentView);
    
    periods.forEach(period => {
        labels.push(period.label);
        
        const periodRecords = filterRecordsByPeriod(records, period);
        
        const income = periodRecords
            .filter(r => r.type === 'income')
            .reduce((sum, r) => sum + r.amount, 0);
            
        const expense = periodRecords
            .filter(r => r.type === 'expense')
            .reduce((sum, r) => sum + r.amount, 0);

        incomeData.push(income);
        expenseData.push(expense);
        profitData.push(income - expense);
    });

    return {
        labels,
        datasets: [
            {
                label: '수익',
                data: incomeData,
                borderColor: CHART_COLORS.income.primary,
                backgroundColor: CHART_COLORS.background.income,
                tension: 0.4,
                fill: true,
                borderWidth: 3
            },
            {
                label: '지출',
                data: expenseData,
                borderColor: CHART_COLORS.expense.primary,
                backgroundColor: CHART_COLORS.background.expense,
                tension: 0.4,
                fill: true,
                borderWidth: 3
            },
            {
                label: '순이익',
                data: profitData,
                borderColor: CHART_COLORS.profit,
                backgroundColor: CHART_COLORS.background.profit,
                tension: 0.4,
                fill: false,
                borderWidth: 2,
                borderDash: [5, 5]
            }
        ]
    };
}

/**
 * 수익 차트 데이터 준비
 */
function prepareIncomeChartData() {
    const records = getFilteredRecords();
    const incomeRecords = records.filter(r => r.type === 'income');
    
    const categoryData = {};
    incomeRecords.forEach(record => {
        categoryData[record.category] = (categoryData[record.category] || 0) + record.amount;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = generateColors(labels.length, 'income');

    return {
        labels,
        datasets: [{
            data,
            backgroundColor: colors.map(color => color + '99'),
            borderColor: colors,
            borderWidth: 2
        }]
    };
}

/**
 * 지출 차트 데이터 준비
 */
function prepareExpenseChartData() {
    const records = getFilteredRecords();
    const expenseRecords = records.filter(r => r.type === 'expense');
    
    const categoryData = {};
    expenseRecords.forEach(record => {
        categoryData[record.category] = (categoryData[record.category] || 0) + record.amount;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = generateColors(labels.length, 'expense');

    return {
        labels,
        datasets: [{
            data,
            backgroundColor: colors.map(color => color + '99'),
            borderColor: colors,
            borderWidth: 2
        }]
    };
}

/**
 * 카테고리별 차트 데이터 준비
 */
function prepareCategoryChartData() {
    const records = getFilteredRecords();
    const categories = getAllCategories();
    
    const incomeData = [];
    const expenseData = [];

    categories.forEach(category => {
        const income = records
            .filter(r => r.type === 'income' && r.category === category)
            .reduce((sum, r) => sum + r.amount, 0);

        const expense = records
            .filter(r => r.type === 'expense' && r.category === category)
            .reduce((sum, r) => sum + r.amount, 0);

        incomeData.push(income);
        expenseData.push(expense);
    });

    return {
        labels: categories,
        datasets: [
            {
                label: '수익',
                data: incomeData,
                backgroundColor: CHART_COLORS.income.primary,
                borderColor: CHART_COLORS.income.primary,
                borderWidth: 1,
                borderRadius: 5
            },
            {
                label: '지출',
                data: expenseData,
                backgroundColor: CHART_COLORS.expense.primary,
                borderColor: CHART_COLORS.expense.primary,
                borderWidth: 1,
                borderRadius: 5
            }
        ]
    };
}

/**
 * 라인 차트 설정 생성
 */
function createCombinedChartConfig(data) {
    return {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: getCSSColor('--text-color'),
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: CHART_COLORS.profit,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatMeso(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getCSSColor('--text-color'),
                        callback: function(value) {
                            return formatMeso(value);
                        }
                    },
                    grid: {
                        color: getCSSColor('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getCSSColor('--text-color')
                    },
                    grid: {
                        color: getCSSColor('--border-color')
                    }
                }
            }
        }
    };
}

/**
 * 극지역 차트 설정 생성
 */
function createPolarAreaChartConfig(data, type) {
    return {
        type: 'polarArea',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: getCSSColor('--text-color'),
                        font: { size: 14 },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label}: ${formatMeso(data.datasets[0].data[i])}`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                strokeStyle: data.datasets[0].borderColor[i],
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${formatMeso(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    ticks: {
                        color: getCSSColor('--text-color'),
                        callback: function(value) {
                            return formatMeso(value);
                        }
                    },
                    grid: {
                        color: getCSSColor('--border-color')
                    }
                }
            }
        }
    };
}

/**
 * 막대 차트 설정 생성
 */
function createBarChartConfig(data) {
    return {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getCSSColor('--text-color'),
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatMeso(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: false,
                    ticks: {
                        color: getCSSColor('--text-color'),
                        callback: function(value) {
                            return formatMeso(value);
                        }
                    },
                    grid: {
                        color: getCSSColor('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getCSSColor('--text-color'),
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    };
}

/**
 * 차트 다운로드
 * @param {string} filename - 파일명
 * @param {string} chartId - 차트 ID (기본값: 'main')
 */
function downloadChart(filename = 'chart.png', chartId = 'main') {
    const chart = chartInstances[chartId];
    if (!chart) {
        alert('다운로드할 차트를 찾을 수 없습니다.');
        return;
    }

    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 차트 테마 업데이트 (다크모드 대응)
 */
function updateChartTheme() {
    Object.values(chartInstances).forEach(chart => {
        if (chart) {
            chart.update();
        }
    });
}

/**
 * 차트 애니메이션 설정
 * @param {boolean} enabled - 애니메이션 활성화 여부
 */
function setChartAnimation(enabled) {
    const animationConfig = enabled ? {
        duration: 1000,
        easing: 'easeInOutQuart'
    } : false;

    Object.values(chartInstances).forEach(chart => {
        if (chart) {
            chart.options.animation = animationConfig;
            chart.update();
        }
    });
}

/**
 * 실시간 차트 업데이트
 * @param {Object} newRecord - 새로운 레코드
 */
function updateChartRealtime(newRecord) {
    const currentChart = getCurrentChartType();
    
    // 현재 차트에 따라 실시간 업데이트
    switch (currentChart) {
        case 'combined':
            updateCombinedChartRealtime(newRecord);
            break;
        case 'income':
        case 'expense':
            updatePolarChartRealtime(newRecord);
            break;
        case 'category':
            updateCategoryChartRealtime(newRecord);
            break;
    }
}

/**
 * 종합 차트 실시간 업데이트
 */
function updateCombinedChartRealtime(newRecord) {
    const chart = chartInstances.main;
    if (!chart) return;

    const now = new Date();
    const timeLabel = formatTimeForChart(now);
    
    // 라벨 추가
    chart.data.labels.push(timeLabel);
    
    // 데이터 추가
    chart.data.datasets.forEach(dataset => {
        if (dataset.label === '수익' && newRecord.type === 'income') {
            dataset.data.push(newRecord.amount);
        } else if (dataset.label === '지출' && newRecord.type === 'expense') {
            dataset.data.push(newRecord.amount);
        } else {
            dataset.data.push(0);
        }
    });

    // 오래된 데이터 제거 (최대 50개 유지)
    if (chart.data.labels.length > 50) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => {
            dataset.data.shift();
        });
    }

    chart.update('none'); // 애니메이션 없이 업데이트
}

// === Helper Functions ===

function getChartContext() {
    const canvas = document.getElementById('mainChart');
    return canvas ? canvas.getContext('2d') : null;
}

function destroyExistingChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

function getCurrentChartType() {
    return window.MapleState ? 
        window.MapleState.getState('currentChart') : 
        'combined';
}

function getCurrentView() {
    return window.MapleState ? 
        window.MapleState.getState('currentView') : 
        'daily';
}

function getFilteredRecords() {
    return window.MapleRecords ? 
        window.MapleRecords.getFilteredRecords() : 
        [];
}

function getAllCategories() {
    const categories = window.MapleState ? 
        window.MapleState.CATEGORIES : 
        { income: [], expense: [] };
    
    return [...new Set([...categories.income, ...categories.expense])];
}

function formatMeso(value) {
    return window.MapleFormatters ? 
        window.MapleFormatters.formatMeso(value) : 
        value.toLocaleString();
}

function getCSSColor(property) {
    return window.MapleHelpers ? 
        window.MapleHelpers.getCSSProperty(property) : 
        '#333';
}

function generateColors(count, type) {
    const baseColors = type === 'income' ? 
        Object.values(CHART_COLORS.income) : 
        Object.values(CHART_COLORS.expense);

    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

function getPeriodLabels(viewType) {
    const now = new Date();
    const periods = [];

    switch (viewType) {
        case 'daily':
            // 24시간
            for (let i = 0; i < 24; i++) {
                periods.push({
                    label: `${i}시`,
                    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), i),
                    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), i + 1)
                });
            }
            break;
        case 'weekly':
            // 7일
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                periods.push({
                    label: `${date.getMonth() + 1}/${date.getDate()}`,
                    start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                });
            }
            break;
        case 'monthly':
            // 30일
            for (let i = 29; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                periods.push({
                    label: `${date.getMonth() + 1}/${date.getDate()}`,
                    start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                });
            }
            break;
        case 'yearly':
            // 12개월
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                periods.push({
                    label: `${date.getFullYear()}.${date.getMonth() + 1}`,
                    start: new Date(date.getFullYear(), date.getMonth(), 1),
                    end: new Date(date.getFullYear(), date.getMonth() + 1, 1)
                });
            }
            break;
    }

    return periods;
}

function filterRecordsByPeriod(records, period) {
    return records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= period.start && recordDate < period.end;
    });
}

function formatTimeForChart(date) {
    const currentView = getCurrentView();
    
    switch (currentView) {
        case 'daily':
            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        case 'weekly':
        case 'monthly':
            return `${date.getMonth() + 1}/${date.getDate()}`;
        case 'yearly':
            return `${date.getFullYear()}.${date.getMonth() + 1}`;
        default:
            return date.toLocaleString();
    }
}

function updatePolarChartRealtime(newRecord) {
    // 극지역 차트는 전체 데이터 재계산이 필요하므로 전체 업데이트
    if (newRecord.type === 'income') {
        updateIncomeChart();
    } else {
        updateExpenseChart();
    }
}

function updateCategoryChartRealtime(newRecord) {
    // 카테고리 차트는 전체 데이터 재계산이 필요하므로 전체 업데이트
    updateCategoryChart();
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateCharts,
        updateCombinedChart,
        updateIncomeChart,
        updateExpenseChart,
        updateCategoryChart,
        downloadChart,
        updateChartTheme,
        setChartAnimation,
        updateChartRealtime,
        CHART_COLORS
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleCharts = {
        updateCharts,
        updateCombinedChart,
        updateIncomeChart,
        updateExpenseChart,
        updateCategoryChart,
        downloadChart,
        updateChartTheme,
        setChartAnimation,
        updateChartRealtime,
        CHART_COLORS
    };
}