/**
 * 전역 상태 관리 모듈
 * 메이플 쌀먹 가계부 애플리케이션 상태 관리
 */

// 전역 상태 객체
let appState = {
    // 데이터 상태
    records: [],
    goals: [],
    equipment: {},
    settings: {},
    
    // UI 상태
    currentView: 'daily',  // daily, weekly, monthly, yearly
    currentChart: 'combined',  // combined, income, expense, category
    charts: {},
    
    // 모달/팝업 상태
    pendingGoalId: null,
    modals: {},
    
    // 로딩 상태
    isLoading: false,
    isInitialized: false,
    
    // 에러 상태
    lastError: null,
    
    // 캐시 상태
    cachedCalculations: {},
    lastUpdateTime: null
};

// 카테고리 상수
const CATEGORIES = {
    income: ['보스 결정석', '재획', '아이템 판매', '에르다 조각 판매', '기타'],
    expense: ['큐브', '스타포스', '아이템 구매', '기타']
};

// 상태 변경 리스너들
const stateListeners = new Map();
let listenerIdCounter = 0;

/**
 * 상태 초기화
 */
function initializeState() {
    try {
        console.log('상태 초기화 시작...');
        
        // 저장된 데이터 로딩
        const savedData = window.MapleStorage ? 
            window.MapleStorage.loadData() : 
            loadDataFallback();
        
        // 상태 업데이트
        updateState({
            records: savedData.records || [],
            goals: savedData.goals || [],
            equipment: savedData.equipment || {},
            settings: savedData.settings || getDefaultSettings(),
            isInitialized: true,
            lastUpdateTime: new Date().toISOString()
        });
        
        console.log('상태 초기화 완료');
        notifyListeners('INIT_COMPLETE');
        
    } catch (error) {
        console.error('상태 초기화 실패:', error);
        setError('상태 초기화에 실패했습니다.');
    }
}

/**
 * 상태 업데이트
 * @param {Object} newState - 새로운 상태 값들
 * @param {boolean} persist - 저장소에 영구 저장 여부
 */
function updateState(newState, persist = false) {
    const prevState = { ...appState };
    
    // 상태 업데이트
    Object.assign(appState, newState);
    appState.lastUpdateTime = new Date().toISOString();
    
    // 캐시 무효화 (데이터가 변경된 경우)
    if (newState.records || newState.goals || newState.equipment) {
        invalidateCache();
    }
    
    // 영구 저장
    if (persist) {
        saveStateToStorage();
    }
    
    // 리스너들에게 변경사항 알림
    notifyListeners('STATE_UPDATED', { prevState, newState: appState });
}

/**
 * 특정 상태 값 가져오기
 * @param {string} key - 상태 키
 * @returns {any} 상태 값
 */
function getState(key) {
    if (key) {
        return appState[key];
    }
    return { ...appState }; // 전체 상태 복사본 반환
}

/**
 * 레코드 추가
 * @param {Object} record - 추가할 레코드
 */
function addRecord(record) {
    const newRecord = {
        id: Date.now(),
        ...record,
        date: record.date || new Date().toISOString()
    };
    
    const newRecords = [...appState.records, newRecord];
    
    // 현재 메소 업데이트
    let newCurrentMeso = appState.settings.currentMeso;
    if (record.type === 'income') {
        newCurrentMeso += record.amount;
    } else {
        newCurrentMeso -= record.amount;
    }
    
    updateState({
        records: newRecords,
        settings: {
            ...appState.settings,
            currentMeso: newCurrentMeso
        }
    }, true);
    
    notifyListeners('RECORD_ADDED', newRecord);
}

/**
 * 레코드 삭제
 * @param {number} recordId - 삭제할 레코드 ID
 */
function deleteRecord(recordId) {
    const recordToDelete = appState.records.find(r => r.id === recordId);
    if (!recordToDelete) return;
    
    const newRecords = appState.records.filter(r => r.id !== recordId);
    
    // 현재 메소 복원
    let newCurrentMeso = appState.settings.currentMeso;
    if (recordToDelete.type === 'income') {
        newCurrentMeso -= recordToDelete.amount;
    } else {
        newCurrentMeso += recordToDelete.amount;
    }
    
    updateState({
        records: newRecords,
        settings: {
            ...appState.settings,
            currentMeso: newCurrentMeso
        }
    }, true);
    
    notifyListeners('RECORD_DELETED', recordToDelete);
}

/**
 * 레코드 업데이트
 * @param {number} recordId - 업데이트할 레코드 ID
 * @param {Object} updates - 업데이트할 필드들
 */
function updateRecord(recordId, updates) {
    const recordIndex = appState.records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) return;
    
    const newRecords = [...appState.records];
    newRecords[recordIndex] = { ...newRecords[recordIndex], ...updates };
    
    updateState({ records: newRecords }, true);
    notifyListeners('RECORD_UPDATED', newRecords[recordIndex]);
}

/**
 * 목표 추가
 * @param {Object} goal - 추가할 목표
 */
function addGoal(goal) {
    const newGoal = {
        id: Date.now(),
        ...goal,
        startDate: goal.startDate || new Date().toISOString(),
        achieved: false,
        completed: false,
        usedAmount: 0
    };
    
    const newGoals = [...appState.goals, newGoal];
    updateState({ goals: newGoals }, true);
    
    notifyListeners('GOAL_ADDED', newGoal);
}

/**
 * 목표 삭제
 * @param {number} goalId - 삭제할 목표 ID
 */
function deleteGoal(goalId) {
    const goalToDelete = appState.goals.find(g => g.id === goalId);
    if (!goalToDelete) return;
    
    const newGoals = appState.goals.filter(g => g.id !== goalId);
    updateState({ goals: newGoals }, true);
    
    notifyListeners('GOAL_DELETED', goalToDelete);
}

/**
 * 목표 완료
 * @param {number} goalId - 완료할 목표 ID
 * @param {Object} expenseRecord - 지출 기록 (선택사항)
 */
function completeGoal(goalId, expenseRecord = null) {
    const goalIndex = appState.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;
    
    const newGoals = [...appState.goals];
    newGoals[goalIndex] = {
        ...newGoals[goalIndex],
        completed: true,
        completedDate: new Date().toISOString(),
        usedAmount: newGoals[goalIndex].amount
    };
    
    // 지출 기록이 있다면 추가
    if (expenseRecord) {
        addRecord(expenseRecord);
    }
    
    updateState({ goals: newGoals }, true);
    notifyListeners('GOAL_COMPLETED', newGoals[goalIndex]);
}

/**
 * 장비 가치 업데이트
 * @param {string} itemId - 장비 아이템 ID
 * @param {number} value - 가치
 */
function updateEquipmentValue(itemId, value) {
    const newEquipment = {
        ...appState.equipment,
        [itemId]: value
    };
    
    updateState({ equipment: newEquipment }, true);
    notifyListeners('EQUIPMENT_UPDATED', { itemId, value });
}

/**
 * 설정 업데이트
 * @param {Object} newSettings - 새로운 설정
 */
function updateSettings(newSettings) {
    const updatedSettings = {
        ...appState.settings,
        ...newSettings
    };
    
    updateState({ settings: updatedSettings }, true);
    notifyListeners('SETTINGS_UPDATED', updatedSettings);
}

/**
 * 뷰 변경
 * @param {string} view - 새로운 뷰
 */
function switchView(view) {
    updateState({ currentView: view });
    notifyListeners('VIEW_CHANGED', view);
}

/**
 * 차트 타입 변경
 * @param {string} chartType - 새로운 차트 타입
 */
function switchChart(chartType) {
    updateState({ currentChart: chartType });
    notifyListeners('CHART_CHANGED', chartType);
}

/**
 * 로딩 상태 설정
 * @param {boolean} isLoading - 로딩 상태
 */
function setLoading(isLoading) {
    updateState({ isLoading });
    notifyListeners('LOADING_CHANGED', isLoading);
}

/**
 * 에러 상태 설정
 * @param {string|Error} error - 에러 메시지 또는 에러 객체
 */
function setError(error) {
    const errorMessage = error instanceof Error ? error.message : error;
    updateState({ lastError: errorMessage });
    notifyListeners('ERROR_OCCURRED', errorMessage);
}

/**
 * 에러 상태 지우기
 */
function clearError() {
    updateState({ lastError: null });
    notifyListeners('ERROR_CLEARED');
}

/**
 * 상태 리스너 등록
 * @param {Function} callback - 상태 변경 시 호출될 콜백
 * @param {string|Array} events - 감시할 이벤트 (선택사항)
 * @returns {number} 리스너 ID
 */
function addStateListener(callback, events = null) {
    const listenerId = ++listenerIdCounter;
    stateListeners.set(listenerId, { callback, events });
    return listenerId;
}

/**
 * 상태 리스너 제거
 * @param {number} listenerId - 리스너 ID
 */
function removeStateListener(listenerId) {
    stateListeners.delete(listenerId);
}

/**
 * 리스너들에게 알림
 * @param {string} event - 이벤트 타입
 * @param {any} data - 이벤트 데이터
 */
function notifyListeners(event, data = null) {
    stateListeners.forEach(({ callback, events }) => {
        if (!events || events.includes(event)) {
            try {
                callback(event, data, appState);
            } catch (error) {
                console.error('상태 리스너 실행 중 오류:', error);
            }
        }
    });
}

/**
 * 캐시된 계산 결과 가져오기
 * @param {string} key - 캐시 키
 * @returns {any} 캐시된 값
 */
function getCachedCalculation(key) {
    return appState.cachedCalculations[key];
}

/**
 * 계산 결과 캐시
 * @param {string} key - 캐시 키
 * @param {any} value - 캐시할 값
 */
function setCachedCalculation(key, value) {
    appState.cachedCalculations[key] = {
        value,
        timestamp: Date.now()
    };
}

/**
 * 캐시 무효화
 * @param {string} key - 특정 키만 무효화 (선택사항)
 */
function invalidateCache(key = null) {
    if (key) {
        delete appState.cachedCalculations[key];
    } else {
        appState.cachedCalculations = {};
    }
}

/**
 * 저장소에 상태 저장
 */
function saveStateToStorage() {
    try {
        const dataToSave = {
            records: appState.records,
            goals: appState.goals,
            equipment: appState.equipment,
            settings: appState.settings
        };
        
        if (window.MapleStorage) {
            window.MapleStorage.saveData(dataToSave);
        } else {
            saveDataFallback(dataToSave);
        }
    } catch (error) {
        console.error('상태 저장 실패:', error);
        setError('데이터 저장에 실패했습니다.');
    }
}

/**
 * 기본 설정 반환
 */
function getDefaultSettings() {
    return {
        mesoRate: 1000,
        patternNotif: true,
        darkMode: false,
        currentMeso: 0,
        autoBackup: true,
        backupInterval: 24
    };
}

/**
 * 저장소 모듈이 없을 때의 fallback 함수들
 */
function loadDataFallback() {
    try {
        const data = localStorage.getItem('mapleSsalMeokData');
        return data ? JSON.parse(data) : {
            records: [],
            goals: [],
            equipment: {},
            settings: getDefaultSettings()
        };
    } catch (error) {
        console.error('Fallback 데이터 로딩 실패:', error);
        return {
            records: [],
            goals: [],
            equipment: {},
            settings: getDefaultSettings()
        };
    }
}

function saveDataFallback(data) {
    try {
        localStorage.setItem('mapleSsalMeokData', JSON.stringify(data));
    } catch (error) {
        console.error('Fallback 데이터 저장 실패:', error);
        throw error;
    }
}

/**
 * 상태 디버깅 정보 출력
 */
function debugState() {
    console.group('메이플 쌀먹 가계부 상태 정보');
    console.log('현재 상태:', appState);
    console.log('리스너 수:', stateListeners.size);
    console.log('캐시된 계산:', Object.keys(appState.cachedCalculations));
    console.log('마지막 업데이트:', appState.lastUpdateTime);
    console.groupEnd();
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeState,
        updateState,
        getState,
        addRecord,
        deleteRecord,
        updateRecord,
        addGoal,
        deleteGoal,
        completeGoal,
        updateEquipmentValue,
        updateSettings,
        switchView,
        switchChart,
        setLoading,
        setError,
        clearError,
        addStateListener,
        removeStateListener,
        getCachedCalculation,
        setCachedCalculation,
        invalidateCache,
        saveStateToStorage,
        debugState,
        CATEGORIES
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleState = {
        initializeState,
        updateState,
        getState,
        addRecord,
        deleteRecord,
        updateRecord,
        addGoal,
        deleteGoal,
        completeGoal,
        updateEquipmentValue,
        updateSettings,
        switchView,
        switchChart,
        setLoading,
        setError,
        clearError,
        addStateListener,
        removeStateListener,
        getCachedCalculation,
        setCachedCalculation,
        invalidateCache,
        saveStateToStorage,
        debugState,
        CATEGORIES
    };
}