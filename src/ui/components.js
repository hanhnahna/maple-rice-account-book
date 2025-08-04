/**
 * UI 컴포넌트 렌더링 모듈
 * 메이플 쌀먹 가계부 사용자 인터페이스 컴포넌트
 */

/**
 * 전체 UI 새로고침
 */
function refreshUI() {
    updateRecordsTable();
    updateStats();
    updateCharts();
    renderGoals();
    updatePredictions();
    updatePatternAnalysis();
    updateEquipmentValue();
    
    console.log('UI 새로고침 완료');
}

/**
 * 레코드 테이블 업데이트
 */
function updateRecordsTable() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;

    const records = getFilteredRecords();
    tbody.innerHTML = '';

    const sortedRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedRecords.forEach(record => {
        const row = createRecordRow(record);
        tbody.appendChild(row);
    });
}

/**
 * 레코드 행 생성
 * @param {Object} record - 레코드 데이터
 * @returns {HTMLTableRowElement} 테이블 행 요소
 */
function createRecordRow(record) {
    const tr = document.createElement('tr');
    tr.className = record.type === 'income' ? 'income-row' : 'expense-row';

    const date = new Date(record.date);
    const dateStr = formatDate(date, 'short');
    const typeText = record.type === 'income' ? '수익' : '지출';
    const typeColor = record.type === 'income' ? '#228B22' : '#DC143C';
    const amountPrefix = record.type === 'income' ? '+' : '-';

    const memoDisplay = record.memo ?
        `<span style="cursor: pointer;" onclick="addMemoToRecord(${record.id})">${record.memo.substring(0, 20)}${record.memo.length > 20 ? '...' : ''}</span>` :
        `<span style="color: #999; cursor: pointer;" onclick="addMemoToRecord(${record.id})">메모 추가</span>`;

    const tagsHTML = record.tags ? 
        record.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';

    tr.innerHTML = `
        <td>${dateStr}</td>
        <td style="color: ${typeColor}; font-weight: 500;">${typeText}</td>
        <td>${record.category}</td>
        <td style="font-weight: bold; color: ${typeColor}">
            ${amountPrefix}${formatMeso(record.amount)}
        </td>
        <td>
            ${memoDisplay}
            ${tagsHTML}
        </td>
        <td>
            <button class="delete-btn" onclick="deleteRecord(${record.id})" title="삭제">❌</button>
        </td>
    `;

    return tr;
}

/**
 * 통계 섹션 업데이트
 */
function updateStats() {
    const records = getFilteredRecords();
    const stats = calculateBasicStats(records);
    
    updateStatElement('currentMeso', stats.currentMeso);
    updateStatElement('totalIncome', stats.totalIncome);
    updateStatElement('totalExpense', stats.totalExpense);
    updateStatElement('netProfit', stats.netProfit, stats.netProfit >= 0 ? '#FF8C00' : '#DC143C');
    updateStatElement('dailyAverage', stats.dailyAverage);

    updateMesoValue();
    updateQuickAnalysis(stats);
    attachStatHoverEvents();
}

/**
 * 통계 요소 업데이트
 * @param {string} elementId - 요소 ID
 * @param {number} value - 값
 * @param {string} color - 색상 (선택사항)
 */
function updateStatElement(elementId, value, color = null) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = formatMeso(value);
    element.setAttribute('data-full', value);
    
    if (color) {
        element.style.color = color;
    }
}

/**
 * 간단 분석 업데이트
 * @param {Object} stats - 통계 데이터
 */
function updateQuickAnalysis(stats) {
    const quickAnalysis = document.getElementById('quickAnalysis');
    if (!quickAnalysis) return;

    if (stats.recordCount > 0) {
        const profitRate = stats.totalIncome > 0 ? Math.round((stats.netProfit / stats.totalIncome) * 100) : 0;
        const currentView = getCurrentView();
        const viewText = getViewDisplayText(currentView);

        quickAnalysis.innerHTML = `
            <strong>📊 빠른 분석:</strong>
            ${viewText} 수익률은 <strong style="color: ${profitRate >= 0 ? '#228B22' : '#DC143C'}">${profitRate}%</strong>입니다.
            ${getProfitRateMessage(profitRate)}
        `;
    } else {
        quickAnalysis.innerHTML = '<strong>📊 빠른 분석:</strong> 아직 기록된 데이터가 없습니다.';
    }
}

/**
 * 목표 목록 렌더링
 */
function renderGoals() {
    const container = document.getElementById('goalsList');
    if (!container) return;

    container.innerHTML = '';
    const activeGoals = getActiveGoals();

    activeGoals.forEach(goal => {
        const goalElement = createGoalElement(goal);
        container.appendChild(goalElement);
    });

    checkGoalsProgress();
}

/**
 * 목표 요소 생성
 * @param {Object} goal - 목표 데이터
 * @returns {HTMLDivElement} 목표 요소
 */
function createGoalElement(goal) {
    const currentAmount = calculateGoalCurrentAmount(goal);
    const progress = goal.amount > 0 ? Math.min((currentAmount / goal.amount) * 100, 100) : 0;
    const isAchieved = currentAmount >= goal.amount;

    const goalDiv = document.createElement('div');
    goalDiv.className = `goal-item ${isAchieved ? 'achieved' : ''}`;

    // 상단 정보 영역
    const topDiv = createGoalTopSection(goal, isAchieved);
    
    // 프로그레스 바 영역
    const progressContainer = createGoalProgressBar(progress, isAchieved);
    
    // 하단 금액 정보 영역
    const bottomDiv = createGoalBottomSection(currentAmount, goal.amount);

    goalDiv.appendChild(topDiv);
    goalDiv.appendChild(progressContainer);
    goalDiv.appendChild(bottomDiv);

    return goalDiv;
}

/**
 * 목표 상단 섹션 생성
 * @param {Object} goal - 목표 데이터
 * @param {boolean} isAchieved - 달성 여부
 * @returns {HTMLDivElement} 상단 섹션
 */
function createGoalTopSection(goal, isAchieved) {
    const topDiv = document.createElement('div');
    topDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';

    const infoDiv = document.createElement('div');
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = goal.name;
    infoDiv.appendChild(nameStrong);

    if (goal.memo) {
        const memoSpan = document.createElement('span');
        memoSpan.style.cssText = 'color: #666; font-size: 0.9em;';
        memoSpan.textContent = ` - ${goal.memo}`;
        infoDiv.appendChild(memoSpan);
    }

    if (isAchieved) {
        const achievedSpan = document.createElement('span');
        achievedSpan.style.cssText = 'color: #4CAF50; margin-left: 10px;';
        achievedSpan.textContent = '✓ 달성';
        infoDiv.appendChild(achievedSpan);
    }

    const buttonsDiv = document.createElement('div');
    
    if (isAchieved) {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.textContent = '완료';
        completeBtn.onclick = () => completeGoal(goal.id);
        buttonsDiv.appendChild(completeBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '❌';
    deleteBtn.onclick = () => deleteGoal(goal.id);
    buttonsDiv.appendChild(deleteBtn);

    topDiv.appendChild(infoDiv);
    topDiv.appendChild(buttonsDiv);

    return topDiv;
}

/**
 * 목표 프로그레스 바 생성
 * @param {number} progress - 진행률
 * @param {boolean} isAchieved - 달성 여부
 * @returns {HTMLDivElement} 프로그레스 바 컨테이너
 */
function createGoalProgressBar(progress, isAchieved) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'goal-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'goal-progress-bar';
    progressBar.style.width = `${progress}%`;
    
    if (isAchieved) {
        progressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
    }
    
    progressBar.textContent = `${Math.floor(progress)}%`;
    progressContainer.appendChild(progressBar);

    return progressContainer;
}

/**
 * 목표 하단 섹션 생성
 * @param {number} currentAmount - 현재 금액
 * @param {number} targetAmount - 목표 금액
 * @returns {HTMLDivElement} 하단 섹션
 */
function createGoalBottomSection(currentAmount, targetAmount) {
    const bottomDiv = document.createElement('div');
    bottomDiv.style.cssText = 'display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.9em; color: #666;';

    const currentSpan = document.createElement('span');
    currentSpan.textContent = `현재: ${formatMeso(currentAmount)}`;
    
    const targetSpan = document.createElement('span');
    targetSpan.textContent = `목표: ${formatMeso(targetAmount)}`;
    
    bottomDiv.appendChild(currentSpan);
    bottomDiv.appendChild(targetSpan);

    return bottomDiv;
}

/**
 * 목표 진행상황 체크
 */
function checkGoalsProgress() {
    const goals = getActiveGoals();
    let totalGoalAmount = 0;
    let totalCurrentAmount = 0;

    goals.forEach(goal => {
        const currentAmount = calculateGoalCurrentAmount(goal);
        totalGoalAmount += goal.amount;
        totalCurrentAmount += Math.min(currentAmount, goal.amount);

        // 새로 달성된 목표 체크
        if (!goal.achieved && currentAmount >= goal.amount) {
            showGoalAchievementModal(goal);
            markGoalAsAchieved(goal);
        }
    });

    updateTotalGoalProgress(totalCurrentAmount, totalGoalAmount);
}

/**
 * 전체 목표 진행률 업데이트
 * @param {number} currentAmount - 현재 달성 금액
 * @param {number} totalAmount - 전체 목표 금액
 */
function updateTotalGoalProgress(currentAmount, totalAmount) {
    const totalProgress = totalAmount > 0 ? Math.min((currentAmount / totalAmount) * 100, 100) : 0;

    const progressElement = document.getElementById('totalGoalProgress');
    const infoElement = document.getElementById('totalGoalInfo');

    if (progressElement) {
        progressElement.style.width = totalProgress + '%';
        progressElement.textContent = Math.floor(totalProgress) + '%';
    }

    if (infoElement) {
        infoElement.innerHTML = `총 목표: ${formatMeso(totalAmount)} / 달성: ${formatMeso(currentAmount)}`;
    }
}

/**
 * 목표 달성 모달 표시
 * @param {Object} goal - 달성된 목표
 */
function showGoalAchievementModal(goal) {
    const modal = document.getElementById('goalModal');
    const achievement = document.getElementById('goalAchievement');
    
    if (modal && achievement) {
        achievement.innerHTML = `
            목표 "<strong>${goal.name}</strong>"을(를) 달성했습니다!<br>
            목표 금액: <strong>${formatMeso(goal.amount)}</strong>
        `;
        modal.style.display = 'block';
    }
}

/**
 * 카테고리 옵션 업데이트
 */
function updateCategoryOptions() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    
    if (!typeSelect || !categorySelect) return;

    const type = typeSelect.value;
    const categories = getCategories();
    
    categorySelect.innerHTML = '';
    
    if (categories[type]) {
        categories[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }
}

/**
 * 메소 가치 업데이트
 */
function updateMesoValue() {
    const currentMeso = getCurrentMeso();
    const rate = getMesoRate();
    const value = Math.floor(currentMeso / 100000000 * rate);
    
    const element = document.getElementById('mesoValue');
    if (element) {
        element.textContent = '₩' + value.toLocaleString();
    }
}

/**
 * 플로팅 정보 표시를 위한 호버 이벤트 연결
 */
function attachStatHoverEvents() {
    const statElements = document.querySelectorAll('.summary-value');
    statElements.forEach(el => {
        el.style.cursor = 'pointer';
        el.onmousemove = showFloatingInfo;
        el.onmouseleave = hideFloatingInfo;
    });
}

/**
 * 뷰 탭 업데이트
 * @param {string} activeView - 활성 뷰
 */
function updateViewTabs(activeView) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.tab[onclick*="${activeView}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

/**
 * 차트 탭 업데이트
 * @param {string} activeChart - 활성 차트 타입
 */
function updateChartTabs(activeChart) {
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.chart-tab[onclick*="${activeChart}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

/**
 * 로딩 스피너 표시/숨김
 * @param {boolean} show - 표시 여부
 * @param {string} message - 로딩 메시지 (선택사항)
 */
function showLoadingSpinner(show, message = '로딩 중...') {
    let spinner = document.getElementById('loadingSpinner');
    
    if (show) {
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.id = 'loadingSpinner';
            spinner.className = 'loading-spinner';
            spinner.innerHTML = `
                <div class="spinner"></div>
                <div class="loading-message">${message}</div>
            `;
            document.body.appendChild(spinner);
        }
        spinner.style.display = 'flex';
    } else {
        if (spinner) {
            spinner.style.display = 'none';
        }
    }
}

/**
 * 토스트 알림 표시
 * @param {string} message - 메시지
 * @param {string} type - 타입 ('success', 'error', 'info', 'warning')
 * @param {number} duration - 표시 시간 (ms)
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 애니메이션
    setTimeout(() => toast.classList.add('show'), 100);
    
    // 자동 제거
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

/**
 * 확인 대화상자 표시
 * @param {string} message - 메시지
 * @param {Function} onConfirm - 확인 시 콜백
 * @param {Function} onCancel - 취소 시 콜백 (선택사항)
 */
function showConfirmDialog(message, onConfirm, onCancel = null) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    
    dialog.innerHTML = `
        <div class="confirm-message">${message}</div>
        <div class="confirm-buttons">
            <button class="confirm-yes">예</button>
            <button class="confirm-no">아니오</button>
        </div>
    `;
    
    const yesBtn = dialog.querySelector('.confirm-yes');
    const noBtn = dialog.querySelector('.confirm-no');
    
    yesBtn.onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };
    
    noBtn.onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

// === Helper Functions ===

function getFilteredRecords() {
    return window.MapleRecords ? 
        window.MapleRecords.getFilteredRecords() : 
        [];
}

function getActiveGoals() {
    return window.MapleGoals ? 
        window.MapleGoals.getActiveGoals() : 
        [];
}

function calculateGoalCurrentAmount(goal) {
    const records = window.MapleRecords ? 
        window.MapleRecords.getRecords() : 
        [];
    
    return records
        .filter(r => r.type === 'income' && new Date(r.date) >= new Date(goal.startDate))
        .reduce((sum, r) => sum + r.amount, 0) - (goal.usedAmount || 0);
}

function calculateBasicStats(records) {
    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const currentView = getCurrentView();
    const daysInPeriod = getDaysInPeriod(currentView);
    const dailyAverage = totalIncome > 0 ? totalIncome / daysInPeriod : 0;

    return {
        currentMeso: getCurrentMeso(),
        totalIncome,
        totalExpense,
        netProfit,
        dailyAverage,
        recordCount: records.length
    };
}

function getCurrentView() {
    return window.MapleState ? 
        window.MapleState.getState('currentView') : 
        'daily';
}

function getCurrentMeso() {
    const settings = window.MapleState ? 
        window.MapleState.getState('settings') : 
        {};
    return settings.currentMeso || 0;
}

function getMesoRate() {
    const settings = window.MapleState ? 
        window.MapleState.getState('settings') : 
        {};
    return settings.mesoRate || 1000;
}

function getCategories() {
    return window.MapleState ? 
        window.MapleState.CATEGORIES : 
        { income: [], expense: [] };
}

function formatMeso(value) {
    return window.MapleFormatters ? 
        window.MapleFormatters.formatMeso(value) : 
        value.toLocaleString();
}

function formatDate(date, format) {
    return window.MapleFormatters ? 
        window.MapleFormatters.formatDate(date, format) : 
        date.toLocaleString();
}

function showFloatingInfo(e) {
    if (window.MapleHelpers && window.MapleHelpers.showFloatingInfo) {
        window.MapleHelpers.showFloatingInfo.call(this, e);
    }
}

function hideFloatingInfo() {
    if (window.MapleHelpers && window.MapleHelpers.hideFloatingInfo) {
        window.MapleHelpers.hideFloatingInfo();
    }
}

function getViewDisplayText(view) {
    const texts = {
        daily: '오늘',
        weekly: '이번 주',
        monthly: '이번 달',
        yearly: '올해'
    };
    return texts[view] || view;
}

function getProfitRateMessage(profitRate) {
    if (profitRate > 50) return '훌륭한 성과입니다!';
    if (profitRate > 0) return '꾸준히 수익을 내고 있습니다.';
    return '지출 관리가 필요합니다.';
}

function getDaysInPeriod(view) {
    const days = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };
    return days[view] || 1;
}

function markGoalAsAchieved(goal) {
    if (window.MapleGoals) {
        const goalData = { ...goal, achieved: true };
        window.MapleGoals.updateGoal(goal.id, goalData);
    }
}

// 전역 함수로 노출 (HTML에서 호출)
window.refreshUI = refreshUI;
window.updateCategoryOptions = updateCategoryOptions;
window.showToast = showToast;
window.showConfirmDialog = showConfirmDialog;

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        refreshUI,
        updateRecordsTable,
        updateStats,
        renderGoals,
        updateCategoryOptions,
        updateMesoValue,
        showLoadingSpinner,
        showToast,
        showConfirmDialog,
        updateViewTabs,
        updateChartTabs
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleComponents = {
        refreshUI,
        updateRecordsTable,
        updateStats,
        renderGoals,
        updateCategoryOptions,
        updateMesoValue,
        showLoadingSpinner,
        showToast,
        showConfirmDialog,
        updateViewTabs,
        updateChartTabs
    };
}