/**
 * 메이플 쌀먹 가계부 - 메인 애플리케이션 파일
 * 앱 초기화 및 전체 조율
 * 
 * @version 2.0.0
 * @description 모듈화된 메이플 스토리 가계부 애플리케이션
 */

// 전역 상태 및 설정
let appInitialized = false;
let moduleLoadErrors = [];

// 카테고리 옵션 정의 (하위 호환성)
const categories = {
    income: ['보스 결정석', '재획', '아이템 판매', '에르다 조각 판매', '기타'],
    expense: ['큐브', '스타포스', '아이템 구매', '기타']
};

/**
 * 애플리케이션 초기화
 */
async function init() {
    try {
        console.log('🍄 메이플 쌀먹 가계부 v2.0 초기화 시작...');
        
        // 로딩 표시
        showLoadingScreen(true);
        
        // 간단한 초기화로 변경
        setTimeout(() => {
            try {
                // 기본 카테고리 설정
                updateCategoryOptions();
                
                // UI 새로고침
                refreshUI();
                
                // 로딩 화면 제거
                showLoadingScreen(false);
                
                console.log('✅ 간단 초기화 완료');
                
            } catch (error) {
                console.error('초기화 중 오류:', error);
                showLoadingScreen(false);
                alert('초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ 애플리케이션 초기화 실패:', error);
        showLoadingScreen(false);
        alert('초기화에 실패했습니다. 페이지를 새로고침해주세요.');
    }
}

/**
 * 필수 모듈 로딩 검증
 */
async function validateModules() {
    const requiredModules = [
        { name: 'MapleHelpers', module: window.MapleHelpers },
        { name: 'MapleFormatters', module: window.MapleFormatters },
        { name: 'MapleValidators', module: window.MapleValidators },
        { name: 'MapleStorage', module: window.MapleStorage },
        { name: 'MapleState', module: window.MapleState },
        { name: 'MapleRecords', module: window.MapleRecords },
        { name: 'MapleGoals', module: window.MapleGoals },
        { name: 'MapleCharts', module: window.MapleCharts },
        { name: 'MapleAnalytics', module: window.MapleAnalytics },
        { name: 'MapleEquipment', module: window.MapleEquipment },
        { name: 'MaplePatterns', module: window.MaplePatterns },
        { name: 'MapleThemes', module: window.MapleThemes },
        { name: 'MapleComponents', module: window.MapleComponents },
        { name: 'MapleEvents', module: window.MapleEvents }
    ];

    const missingModules = [];
    
    requiredModules.forEach(({ name, module }) => {
        if (!module) {
            missingModules.push(name);
            moduleLoadErrors.push(`${name} 모듈을 로딩할 수 없습니다.`);
        }
    });

    if (missingModules.length > 0) {
        console.warn('⚠️ 일부 모듈이 로딩되지 않았습니다:', missingModules);
        // 치명적이지 않은 경우 경고만 표시하고 계속 진행
        if (missingModules.includes('MapleStorage') || missingModules.includes('MapleState')) {
            throw new Error('핵심 모듈 로딩 실패: ' + missingModules.join(', '));
        }
    }

    console.log('✅ 모듈 검증 완료');
}

/**
 * 핵심 시스템 초기화
 */
async function initializeCoreModules() {
    console.log('🔧 핵심 모듈 초기화...');
    
    // 1. 상태 관리 시스템 초기화
    if (window.MapleState) {
        await window.MapleState.initializeState();
    }
    
    // 2. 로컬 저장소 설정
    if (window.MapleStorage) {
        // 저장소 정리 (30일 이상 된 백업 삭제)
        window.MapleStorage.cleanupStorage(30);
    }
    
    console.log('✅ 핵심 모듈 초기화 완료');
}

/**
 * UI 시스템 초기화
 */
async function initializeUIModules() {
    console.log('🎨 UI 모듈 초기화...');
    
    // 1. 테마 시스템 초기화
    if (window.MapleThemes) {
        window.MapleThemes.initializeThemes();
    }
    
    // 2. 컴포넌트 시스템 초기화
    if (window.MapleComponents) {
        // 카테고리 옵션 초기화
        updateCategoryOptions();
    }
    
    console.log('✅ UI 모듈 초기화 완료');
}

/**
 * 기능 모듈 초기화
 */
async function initializeFeatureModules() {
    console.log('⚙️ 기능 모듈 초기화...');
    
    // 1. Chart.js 확인
    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js가 로딩되지 않았습니다. 차트 기능이 제한될 수 있습니다.');
        moduleLoadErrors.push('Chart.js 라이브러리가 필요합니다.');
    }
    
    // 2. 장비 시스템 초기화
    if (window.MapleEquipment) {
        window.MapleEquipment.updateEquipmentValue();
    }
    
    console.log('✅ 기능 모듈 초기화 완료');
}

/**
 * 이벤트 시스템 초기화
 */
async function initializeEventSystem() {
    console.log('🎯 이벤트 시스템 초기화...');
    
    if (window.MapleEvents) {
        window.MapleEvents.initializeEvents();
    }
    
    // 커스텀 이벤트 리스너 등록
    setupCustomEventListeners();
    
    console.log('✅ 이벤트 시스템 초기화 완료');
}

/**
 * 데이터 로딩 및 UI 렌더링
 */
async function loadDataAndRender() {
    console.log('📊 데이터 로딩 및 UI 렌더링...');
    
    try {
        // 1. 전체 UI 새로고침
        refreshUI();
        
        // 2. 초기 뷰 설정
        const savedView = getCurrentView();
        switchView(savedView);
        
        // 3. 초기 차트 설정
        const savedChart = getCurrentChart();
        switchChart(savedChart);
        
        console.log('✅ 데이터 로딩 및 UI 렌더링 완료');
        
    } catch (error) {
        console.error('❌ 데이터 로딩 실패:', error);
        showToast('데이터 로딩 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 백그라운드 작업 시작
 */
async function startBackgroundTasks() {
    console.log('🔄 백그라운드 작업 시작...');
    
    // 1. 패턴 분석 알림 (2초 후)
    setTimeout(() => {
        if (window.MaplePatterns) {
            window.MaplePatterns.showPatternAnalysis();
        }
    }, 2000);
    
    // 2. 자동 백업 (5분마다)
    setInterval(() => {
        if (window.MapleStorage) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            window.MapleStorage.createBackup(`auto_${timestamp}`);
            console.log('📦 자동 백업 생성');
        }
    }, 5 * 60 * 1000);
    
    // 3. 주기적 UI 업데이트 (30초마다)
    setInterval(() => {
        if (appInitialized && document.hasFocus()) {
            updateRealTimeElements();
        }
    }, 30000);
    
    console.log('✅ 백그라운드 작업 시작 완료');
}

/**
 * 커스텀 이벤트 리스너 설정
 */
function setupCustomEventListeners() {
    // 상태 변경 이벤트 리스너
    if (window.MapleState) {
        window.MapleState.addStateListener((event, data) => {
            handleStateChange(event, data);
        });
    }
    
    // 테마 변경 이벤트 리스너
    document.addEventListener('themeChanged', (e) => {
        console.log('테마 변경됨:', e.detail);
        // 차트 테마 업데이트
        if (window.MapleCharts) {
            window.MapleCharts.updateChartTheme();
        }
    });
    
    // 윈도우 포커스 이벤트
    window.addEventListener('focus', () => {
        if (appInitialized) {
            // 포커스 복귀 시 데이터 동기화
            refreshUI();
        }
    });
    
    // 페이지 언로드 이벤트
    window.addEventListener('beforeunload', (e) => {
        // 변경사항 저장
        if (window.MapleState) {
            window.MapleState.saveStateToStorage();
        }
    });
    
    // 에러 이벤트 (전역 에러 핸들링)
    window.addEventListener('error', (e) => {
        console.error('전역 에러:', e.error);
        logError('JavaScript Error', e.error);
    });
    
    // Promise 거부 이벤트
    window.addEventListener('unhandledrejection', (e) => {
        console.error('처리되지 않은 Promise 거부:', e.reason);
        logError('Unhandled Promise Rejection', e.reason);
    });
}

/**
 * 상태 변경 핸들러
 * @param {string} event - 이벤트 타입
 * @param {any} data - 이벤트 데이터
 */
function handleStateChange(event, data) {
    switch (event) {
        case 'RECORD_ADDED':
            console.log('새 레코드 추가됨:', data);
            // 실시간 차트 업데이트
            if (window.MapleCharts) {
                window.MapleCharts.updateChartRealtime(data);
            }
            break;
            
        case 'GOAL_ACHIEVED':
            console.log('목표 달성됨:', data);
            showToast(`목표 "${data.name}"을(를) 달성했습니다! 🎉`, 'success', 5000);
            break;
            
        case 'ERROR_OCCURRED':
            console.error('애플리케이션 오류:', data);
            showToast(data, 'error');
            break;
    }
}

/**
 * 애플리케이션 초기화 완료 표시
 */
function markAppAsInitialized() {
    appInitialized = true;
    document.body.classList.add('app-initialized');
    
    // 성능 정보 로깅
    if (performance.mark) {
        performance.mark('app-initialized');
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log(`⚡ 초기화 시간: ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
    }
    
    // 초기화 완료 이벤트 발생
    if (window.MapleEvents) {
        window.MapleEvents.dispatchCustomEvent('appInitialized', {
            timestamp: new Date().toISOString(),
            moduleErrors: moduleLoadErrors
        });
    }
    
    // 오류가 있다면 사용자에게 알림
    if (moduleLoadErrors.length > 0) {
        console.warn('⚠️ 일부 기능이 제한될 수 있습니다:', moduleLoadErrors);
        showToast('일부 모듈 로딩에 실패했습니다. 기능이 제한될 수 있습니다.', 'warning', 5000);
    }
}

/**
 * 초기화 오류 처리
 * @param {Error} error - 오류 객체
 */
function handleInitializationError(error) {
    console.error('초기화 중 치명적 오류 발생:', error);
    
    // 오류 화면 표시
    const errorHTML = `
        <div id="initError" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #f5f5f5; display: flex; align-items: center; justify-content: center;
            font-family: Arial, sans-serif; z-index: 10000;
        ">
            <div style="
                background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-width: 500px; text-align: center;
            ">
                <h2 style="color: #DC143C; margin-bottom: 20px;">🚨 초기화 오류</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    애플리케이션을 초기화하는 중 오류가 발생했습니다.<br>
                    페이지를 새로고침하거나 관리자에게 문의하세요.
                </p>
                <details style="margin-bottom: 20px; text-align: left;">
                    <summary style="cursor: pointer; color: #228B22;">오류 상세 정보</summary>
                    <pre style="background: #f8f8f8; padding: 10px; border-radius: 5px; font-size: 12px; overflow: auto;">
${error.stack || error.message}
                    </pre>
                </details>
                <button onclick="location.reload()" style="
                    background: #228B22; color: white; border: none; padding: 10px 20px;
                    border-radius: 5px; cursor: pointer; font-size: 16px;
                ">페이지 새로고침</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorHTML);
    
    // 에러 로깅
    logError('Initialization Error', error);
}

/**
 * 로딩 화면 표시/숨김
 * @param {boolean} show - 표시 여부
 */
function showLoadingScreen(show) {
    try {
        if (show) {
            // 이미 로딩 화면이 있으면 제거
            const existing = document.getElementById('appLoading');
            if (existing) {
                existing.remove();
            }
            
            const loadingHTML = `
                <div id="appLoading" style="
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: linear-gradient(135deg, #228B22, #32CD32);
                    display: flex; align-items: center; justify-content: center;
                    font-family: Arial, sans-serif; z-index: 9999; color: white;
                ">
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🍄</div>
                        <h2 style="margin-bottom: 10px;">메이플 쌀먹 가계부</h2>
                        <p style="margin-bottom: 30px; opacity: 0.9;">초기화 중...</p>
                        <div style="
                            width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3);
                            border-top: 3px solid white; border-radius: 50%;
                            animation: spin 1s linear infinite; margin: 0 auto;
                        "></div>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            
            document.body.insertAdjacentHTML('beforeend', loadingHTML);
        } else {
            const loading = document.getElementById('appLoading');
            if (loading) {
                loading.style.opacity = '0';
                loading.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (loading && loading.parentNode) {
                        loading.remove();
                    }
                }, 500);
            }
        }
    } catch (error) {
        console.error('로딩 화면 처리 오류:', error);
        // 오류가 발생해도 계속 진행
    }
}

/**
 * 실시간 업데이트 요소들
 */
function updateRealTimeElements() {
    // 현재 시간 업데이트 (있는 경우)
    const timeElements = document.querySelectorAll('.current-time');
    timeElements.forEach(el => {
        el.textContent = new Date().toLocaleTimeString();
    });
    
    // 메소 값 업데이트
    if (window.MapleComponents) {
        window.MapleComponents.updateMesoValue();
    }
}

/**
 * 에러 로깅
 * @param {string} type - 에러 타입
 * @param {Error} error - 에러 객체
 */
function logError(type, error) {
    const errorLog = {
        timestamp: new Date().toISOString(),
        type: type,
        message: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    // 로컬 스토리지에 에러 로그 저장
    try {
        const existingLogs = JSON.parse(localStorage.getItem('mapleErrorLogs') || '[]');
        existingLogs.push(errorLog);
        
        // 최대 50개 로그 유지
        if (existingLogs.length > 50) {
            existingLogs.splice(0, existingLogs.length - 50);
        }
        
        localStorage.setItem('mapleErrorLogs', JSON.stringify(existingLogs));
    } catch (e) {
        console.error('에러 로그 저장 실패:', e);
    }
}

// === 전역 함수들 (HTML에서 호출되는 함수들) ===

/**
 * 현재 메소 업데이트
 */
function updateCurrentMeso() {
    const input = document.getElementById('currentMesoInput');
    if (!input) return;

    const amount = window.MapleFormatters ? 
        window.MapleFormatters.parseMeso(input.value) : 
        parseInt(input.value) || 0;

    if (amount >= 0) {
        if (window.MapleState) {
            const settings = window.MapleState.getState('settings');
            settings.currentMeso = amount;
            window.MapleState.updateSettings(settings);
        }
        refreshUI();
    }
}

/**
 * 카테고리 옵션 업데이트
 */
function updateCategoryOptions() {
    if (window.MapleComponents) {
        window.MapleComponents.updateCategoryOptions();
    } else {
        // Fallback 구현
        const typeSelect = document.getElementById('type');
        const categorySelect = document.getElementById('category');
        
        if (typeSelect && categorySelect) {
            const type = typeSelect.value;
            categorySelect.innerHTML = '';
            
            categories[type].forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categorySelect.appendChild(option);
            });
        }
    }
}

/**
 * 레코드 추가
 */
function addRecord() {
    console.log('addRecord 함수 호출됨');
    
    // 입력 요소들 가져오기
    const typeElement = document.getElementById('type');
    const categoryElement = document.getElementById('category');
    const amountElement = document.getElementById('amount');
    const memoElement = document.getElementById('memo');
    
    if (!typeElement || !categoryElement || !amountElement) {
        console.error('필수 입력 요소를 찾을 수 없습니다.');
        alert('입력 필드를 확인해주세요.');
        return;
    }

    const type = typeElement.value;
    const category = categoryElement.value;
    const amountInput = amountElement.value.trim();
    const memo = memoElement ? memoElement.value.trim() : '';

    console.log('입력 값:', { type, category, amountInput, memo });

    // 입력값 검증
    if (!amountInput) {
        alert('금액을 입력해주세요.');
        amountElement.focus();
        return;
    }

    // 금액 파싱
    let amount = 0;
    if (window.MapleFormatters && window.MapleFormatters.parseMeso) {
        amount = window.MapleFormatters.parseMeso(amountInput);
    } else {
        // Fallback 파싱
        const cleanValue = amountInput.replace(/[^0-9.억만조]/g, '');
        if (amountInput.includes('억')) {
            amount = Math.floor(parseFloat(cleanValue) * 100000000);
        } else if (amountInput.includes('만')) {
            amount = Math.floor(parseFloat(cleanValue) * 10000);
        } else {
            amount = parseInt(cleanValue) || 0;
        }
    }

    if (amount <= 0) {
        alert('올바른 금액을 입력해주세요.');
        amountElement.focus();
        return;
    }

    // 레코드 생성
    const record = {
        id: Date.now(),
        type: type,
        category: category,
        amount: amount,
        memo: memo,
        date: new Date().toISOString()
    };

    console.log('생성된 레코드:', record);

    // 모듈이 있으면 모듈 사용, 없으면 직접 처리
    if (window.MapleRecords && window.MapleRecords.addRecord) {
        console.log('MapleRecords 모듈 사용');
        const result = window.MapleRecords.addRecord({
            type: type,
            category: category,
            amount: amountInput,
            memo: memo
        });

        if (result.success) {
            // 입력 필드 초기화
            amountElement.value = '';
            if (memoElement) memoElement.value = '';
            
            alert('기록이 추가되었습니다.');
            refreshUI();
        } else {
            alert(result.error);
        }
    } else {
        console.log('Fallback 모드: 직접 레코드 저장');
        
        // localStorage에서 기존 레코드 가져오기
        let records = [];
        try {
            const saved = localStorage.getItem('mapleSsalMeokData');
            if (saved) {
                const data = JSON.parse(saved);
                records = data.records || [];
            }
        } catch (e) {
            console.error('기존 데이터 로딩 실패:', e);
        }

        // 새 레코드 추가
        records.push(record);

        // localStorage에 저장
        try {
            const dataToSave = {
                records: records,
                goals: [],
                equipment: {},
                settings: {},
                lastModified: new Date().toISOString()
            };
            localStorage.setItem('mapleSsalMeokData', JSON.stringify(dataToSave));
            
            // 입력 필드 초기화
            amountElement.value = '';
            if (memoElement) memoElement.value = '';
            
            alert('기록이 추가되었습니다.');
            refreshUI();
        } catch (e) {
            console.error('데이터 저장 실패:', e);
            alert('데이터 저장에 실패했습니다.');
        }
    }
}

/**
 * 레코드 삭제
 * @param {number} id - 레코드 ID
 */
function deleteRecord(id) {
    console.log('deleteRecord 호출됨, ID:', id);
    
    // confirm 대화상자 대신 커스텀 확인 창 사용
    const confirmed = confirm('이 기록을 삭제하시겠습니까?');
    
    if (!confirmed) {
        console.log('삭제 취소됨');
        return;
    }

    // 모듈이 있으면 모듈 사용
    if (window.MapleRecords && window.MapleRecords.deleteRecord) {
        console.log('MapleRecords 모듈 사용하여 삭제');
        try {
            const result = window.MapleRecords.deleteRecord(id);
            
            if (result.success) {
                alert('기록이 삭제되었습니다.');
                refreshUI();
            } else {
                alert(result.error || '삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('모듈 삭제 오류:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    } else {
        console.log('Fallback 모드: 직접 레코드 삭제');
        
        try {
            // localStorage에서 기존 데이터 가져오기
            const saved = localStorage.getItem('mapleSsalMeokData');
            if (!saved) {
                alert('삭제할 데이터가 없습니다.');
                return;
            }

            const data = JSON.parse(saved);
            const records = data.records || [];
            
            // ID로 레코드 찾기 및 삭제
            const initialLength = records.length;
            const updatedRecords = records.filter(record => record.id != id);
            
            if (updatedRecords.length === initialLength) {
                alert('삭제할 기록을 찾을 수 없습니다.');
                return;
            }

            // 업데이트된 데이터 저장
            const updatedData = {
                ...data,
                records: updatedRecords,
                lastModified: new Date().toISOString()
            };
            
            localStorage.setItem('mapleSsalMeokData', JSON.stringify(updatedData));
            
            alert('기록이 삭제되었습니다.');
            refreshUI();
            
        } catch (error) {
            console.error('Fallback 삭제 오류:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    }
}

/**
 * 레코드에 메모 추가
 * @param {number} id - 레코드 ID
 */
function addMemoToRecord(id) {
    if (window.MapleRecords) {
        const records = window.MapleRecords.getRecords();
        const record = records.find(r => r.id === id);
        
        if (record) {
            const newMemo = prompt('메모를 입력하세요:', record.memo || '');
            if (newMemo !== null) {
                const result = window.MapleRecords.updateRecord(id, {
                    memo: newMemo,
                    tags: window.MapleHelpers ? 
                        window.MapleHelpers.extractTags(newMemo) : 
                        []
                });
                
                if (result.success) {
                    refreshUI();
                }
            }
        }
    }
}

/**
 * 뷰 전환
 * @param {string} view - 뷰 타입
 */
function switchView(view) {
    if (window.MapleState) {
        window.MapleState.switchView(view);
    }
    
    if (window.MapleComponents) {
        window.MapleComponents.updateViewTabs(view);
    }
    
    refreshUI();
}

/**
 * 차트 전환
 * @param {string} type - 차트 타입
 */
function switchChart(type) {
    console.log('switchChart 호출됨:', type);
    
    if (window.MapleState && window.MapleState.switchChart) {
        window.MapleState.switchChart(type);
    } else {
        // Fallback
        window.currentChart = type;
    }
    
    if (window.MapleComponents && window.MapleComponents.updateChartTabs) {
        window.MapleComponents.updateChartTabs(type);
    }
    
    if (window.MapleCharts && window.MapleCharts.updateCharts) {
        window.MapleCharts.updateCharts();
    } else {
        console.warn('MapleCharts 모듈이 로딩되지 않았습니다.');
    }
}

/**
 * 목표 추가
 */
function addGoal() {
    console.log('addGoal 함수 호출됨');
    
    // 입력 요소들 가져오기
    const goalNameElement = document.getElementById('goalName');
    const goalAmountElement = document.getElementById('goalAmount');
    const goalMemoElement = document.getElementById('goalMemo');
    
    if (!goalNameElement || !goalAmountElement) {
        console.error('필수 입력 요소를 찾을 수 없습니다.');
        alert('입력 필드를 확인해주세요.');
        return;
    }

    const goalName = goalNameElement.value.trim();
    const goalAmountInput = goalAmountElement.value.trim();
    const goalMemo = goalMemoElement ? goalMemoElement.value.trim() : '';

    console.log('목표 입력 값:', { goalName, goalAmountInput, goalMemo });

    // 입력값 검증
    if (!goalName) {
        alert('목표 이름을 입력해주세요.');
        goalNameElement.focus();
        return;
    }

    if (!goalAmountInput) {
        alert('목표 금액을 입력해주세요.');
        goalAmountElement.focus();
        return;
    }

    // 금액 파싱
    let amount = 0;
    if (window.MapleFormatters && window.MapleFormatters.parseMeso) {
        amount = window.MapleFormatters.parseMeso(goalAmountInput);
    } else {
        // Fallback 파싱
        const cleanValue = goalAmountInput.replace(/[^0-9.억만조]/g, '');
        if (goalAmountInput.includes('억')) {
            amount = Math.floor(parseFloat(cleanValue) * 100000000);
        } else if (goalAmountInput.includes('만')) {
            amount = Math.floor(parseFloat(cleanValue) * 10000);
        } else {
            amount = parseInt(cleanValue) || 0;
        }
    }

    if (amount <= 0) {
        alert('올바른 목표 금액을 입력해주세요.');
        goalAmountElement.focus();
        return;
    }

    // 목표 생성
    const goal = {
        id: Date.now(),
        name: goalName,
        amount: amount,
        memo: goalMemo,
        startDate: new Date().toISOString(),
        achieved: false,
        completed: false
    };

    console.log('생성된 목표:', goal);

    // 모듈이 있으면 모듈 사용
    if (window.MapleGoals && window.MapleGoals.addGoal) {
        console.log('MapleGoals 모듈 사용');
        const result = window.MapleGoals.addGoal({
            name: goalName,
            amount: goalAmountInput,
            memo: goalMemo
        });

        if (result.success) {
            // 입력 필드 초기화
            goalNameElement.value = '';
            goalAmountElement.value = '';
            if (goalMemoElement) goalMemoElement.value = '';
            
            alert('목표가 추가되었습니다.');
            refreshUI();
        } else {
            alert(result.error);
        }
    } else {
        console.log('Fallback 모드: 직접 목표 저장');
        
        try {
            // localStorage에서 기존 데이터 가져오기
            let data = { goals: [], records: [], equipment: {}, settings: {} };
            const saved = localStorage.getItem('mapleSsalMeokData');
            if (saved) {
                data = JSON.parse(saved);
            }

            const goals = data.goals || [];
            goals.push(goal);

            // localStorage에 저장
            const dataToSave = {
                ...data,
                goals: goals,
                lastModified: new Date().toISOString()
            };
            localStorage.setItem('mapleSsalMeokData', JSON.stringify(dataToSave));
            
            // 입력 필드 초기화
            goalNameElement.value = '';
            goalAmountElement.value = '';
            if (goalMemoElement) goalMemoElement.value = '';
            
            alert('목표가 추가되었습니다.');
            refreshUI();
            
        } catch (error) {
            console.error('목표 저장 실패:', error);
            alert('목표 저장에 실패했습니다.');
        }
    }
}

/**
 * 목표 삭제
 * @param {number} id - 목표 ID
 */
function deleteGoal(id) {
    console.log('deleteGoal 호출됨, ID:', id);
    
    const confirmed = confirm('이 목표를 삭제하시겠습니까?');
    
    if (!confirmed) {
        console.log('목표 삭제 취소됨');
        return;
    }

    // 모듈이 있으면 모듈 사용
    if (window.MapleGoals && window.MapleGoals.deleteGoal) {
        console.log('MapleGoals 모듈 사용하여 삭제');
        try {
            const result = window.MapleGoals.deleteGoal(id);
            
            if (result.success) {
                alert('목표가 삭제되었습니다.');
                refreshUI();
            } else {
                alert(result.error || '목표 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('모듈 목표 삭제 오류:', error);
            alert('목표 삭제 중 오류가 발생했습니다.');
        }
    } else {
        console.log('Fallback 모드: 직접 목표 삭제');
        
        try {
            // localStorage에서 기존 데이터 가져오기
            const saved = localStorage.getItem('mapleSsalMeokData');
            if (!saved) {
                alert('삭제할 목표가 없습니다.');
                return;
            }

            const data = JSON.parse(saved);
            const goals = data.goals || [];
            
            // ID로 목표 찾기 및 삭제
            const initialLength = goals.length;
            const updatedGoals = goals.filter(goal => goal.id != id);
            
            if (updatedGoals.length === initialLength) {
                alert('삭제할 목표를 찾을 수 없습니다.');
                return;
            }

            // 업데이트된 데이터 저장
            const updatedData = {
                ...data,
                goals: updatedGoals,
                lastModified: new Date().toISOString()
            };
            
            localStorage.setItem('mapleSsalMeokData', JSON.stringify(updatedData));
            
            alert('목표가 삭제되었습니다.');
            refreshUI();
            
        } catch (error) {
            console.error('Fallback 목표 삭제 오류:', error);
            alert('목표 삭제 중 오류가 발생했습니다.');
        }
    }
}

/**
 * 목표 완료
 * @param {number} id - 목표 ID
 */
function completeGoal(id) {
    if (window.MapleGoals) {
        const goals = window.MapleGoals.getGoals();
        const goal = goals.find(g => g.id === id);
        
        if (goal) {
            document.getElementById('goalExpenseMemo').value = goal.name;
            document.getElementById('completeGoalModal').style.display = 'block';
            
            // 전역 변수에 ID 저장 (모달에서 사용)
            window.pendingGoalId = id;
        }
    }
}

/**
 * 목표 완료 확인
 */
function confirmGoalComplete() {
    if (window.MapleGoals && window.pendingGoalId) {
        const category = document.getElementById('goalExpenseCategory').value;
        const memo = document.getElementById('goalExpenseMemo').value;

        const result = window.MapleGoals.completeGoal(window.pendingGoalId, {
            category: category,
            memo: memo
        });

        if (result.success) {
            closeModal('completeGoalModal');
            window.pendingGoalId = null;
            showToast('목표가 완료되었습니다! 🎉', 'success');
            refreshUI();
        } else {
            showToast(result.error, 'error');
        }
    }
}

/**
 * 장비 가치 업데이트
 */
function updateEquipmentValue() {
    console.log('updateEquipmentValue 호출됨');
    
    if (window.MapleEquipment && window.MapleEquipment.updateEquipmentValue) {
        window.MapleEquipment.updateEquipmentValue();
    } else {
        console.log('Fallback 모드: 직접 장비 가치 계산');
        
        try {
            // 장비 입력 필드들 찾기
            const equipmentInputs = document.querySelectorAll('[id^="equip-"]');
            let totalValue = 0;
            const equipmentData = {};

            equipmentInputs.forEach(input => {
                const itemId = input.id.replace('equip-', '');
                let value = 0;

                if (input.value.trim()) {
                    // 금액 파싱
                    if (input.value.includes('억')) {
                        value = parseFloat(input.value.replace(/[^0-9.]/g, '')) * 100000000;
                    } else if (input.value.includes('만')) {
                        value = parseFloat(input.value.replace(/[^0-9.]/g, '')) * 10000;
                    } else {
                        value = parseFloat(input.value.replace(/[^0-9]/g, '')) || 0;
                    }
                }

                equipmentData[itemId] = value;
                totalValue += value;
            });

            // UI 업데이트
            updateEquipmentTotalsFallback(totalValue);

            // localStorage에 저장
            try {
                const saved = localStorage.getItem('mapleSsalMeokData');
                let data = { records: [], goals: [], equipment: {}, settings: {} };
                if (saved) {
                    data = JSON.parse(saved);
                }
                
                data.equipment = equipmentData;
                localStorage.setItem('mapleSsalMeokData', JSON.stringify(data));
                
                console.log('장비 데이터 저장 완료:', equipmentData);
            } catch (e) {
                console.error('장비 데이터 저장 실패:', e);
            }

        } catch (error) {
            console.error('Fallback 장비 가치 계산 실패:', error);
        }
    }
}

/**
 * Fallback 모드: 장비 총합 UI 업데이트
 */
function updateEquipmentTotalsFallback(totalValue) {
    // 메소 시세 가져오기
    const mesoRateInput = document.getElementById('mesoRate');
    const rate = mesoRateInput ? (parseFloat(mesoRateInput.value) || 1000) : 1000;
    
    // 현금 가치 계산
    const cashValue = Math.floor(totalValue / 100000000 * rate);

    // UI 요소 업데이트
    const elements = {
        'totalRecovery': formatAmountFallback(totalValue),
        'expectedTotal': formatAmountFallback(totalValue),
        'expectedCash': '₩' + cashValue.toLocaleString()
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });

    console.log('장비 총합 업데이트:', { totalValue, cashValue });
}

/**
 * 다크모드 토글
 */
function toggleDarkMode() {
    if (window.MapleThemes) {
        window.MapleThemes.toggleDarkMode();
    }
}

/**
 * 설정 저장
 */
function saveSettings() {
    if (window.MapleState) {
        window.MapleState.saveStateToStorage();
        showToast('설정이 저장되었습니다.', 'success');
    }
}

/**
 * 메소 가치 업데이트
 */
function updateMesoValue() {
    console.log('updateMesoValue 호출됨');
    
    if (window.MapleComponents && window.MapleComponents.updateMesoValue) {
        window.MapleComponents.updateMesoValue();
    } else {
        // Fallback 구현
        const currentMesoInput = document.getElementById('currentMesoInput');
        const mesoRateInput = document.getElementById('mesoRate');
        const mesoValueElement = document.getElementById('mesoValue');
        
        if (currentMesoInput && mesoRateInput && mesoValueElement) {
            let currentMeso = 0;
            let rate = 0;

            // 메소 파싱
            if (currentMesoInput.value.includes('억')) {
                currentMeso = parseFloat(currentMesoInput.value.replace(/[^0-9.]/g, '')) * 100000000;
            } else {
                currentMeso = parseFloat(currentMesoInput.value.replace(/[^0-9]/g, '')) || 0;
            }

            // 시세 파싱
            rate = parseFloat(mesoRateInput.value) || 1000;

            // 가치 계산
            const value = Math.floor(currentMeso / 100000000 * rate);
            mesoValueElement.textContent = '₩' + value.toLocaleString();
            
            console.log('메소 가치 계산:', { currentMeso, rate, value });
            
            // localStorage에 설정 저장
            try {
                const saved = localStorage.getItem('mapleSsalMeokData');
                let data = { records: [], goals: [], equipment: {}, settings: {} };
                if (saved) {
                    data = JSON.parse(saved);
                }
                
                data.settings.currentMeso = currentMeso;
                data.settings.mesoRate = rate;
                
                localStorage.setItem('mapleSsalMeokData', JSON.stringify(data));
            } catch (e) {
                console.error('설정 저장 실패:', e);
            }
        }
    }
}

/**
 * 데이터 내보내기
 */
function exportData() {
    console.log('exportData 호출됨');
    
    if (window.MapleStorage && window.MapleStorage.exportData) {
        window.MapleStorage.exportData();
    } else {
        console.log('Fallback 모드: 직접 데이터 내보내기');
        
        try {
            // localStorage에서 데이터 가져오기
            const saved = localStorage.getItem('mapleSsalMeokData');
            let data = { records: [], goals: [], equipment: {}, settings: {} };
            
            if (saved) {
                data = JSON.parse(saved);
            }

            // 내보내기 데이터 생성
            const exportData = {
                ...data,
                exportDate: new Date().toISOString(),
                exportedBy: 'MapleStory Rice Budget App v2.0'
            };

            // JSON 파일로 다운로드
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `maple_budget_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('데이터가 성공적으로 내보내졌습니다.');
            console.log('데이터 내보내기 완료');
            
        } catch (error) {
            console.error('Fallback 데이터 내보내기 실패:', error);
            alert('데이터 내보내기에 실패했습니다.');
        }
    }
}

/**
 * 데이터 가져오기
 * @param {Event} event - 파일 입력 이벤트
 */
function importData(event) {
    console.log('importData 호출됨');
    
    const file = event.target.files[0];
    if (!file) {
        alert('파일이 선택되지 않았습니다.');
        return;
    }

    if (window.MapleStorage && window.MapleStorage.importData) {
        const merge = confirm('기존 데이터를 덮어씌우시겠습니까?\n(취소하면 데이터가 병합됩니다)');
        
        window.MapleStorage.importData(file, !merge)
            .then(() => {
                alert('데이터를 성공적으로 가져왔습니다.');
                setTimeout(() => location.reload(), 1000);
            })
            .catch(error => {
                alert(error.message);
            });
    } else {
        console.log('Fallback 모드: 직접 데이터 가져오기');
        
        if (!file.name.endsWith('.json')) {
            alert('JSON 파일만 가져올 수 있습니다.');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 데이터 유효성 검증
                if (!importedData || typeof importedData !== 'object') {
                    throw new Error('올바르지 않은 파일 형식입니다.');
                }

                const merge = confirm('기존 데이터를 덮어씌우시겠습니까?\n(취소하면 데이터가 병합됩니다)');
                
                let finalData;
                if (merge) {
                    // 기존 데이터와 병합
                    const saved = localStorage.getItem('mapleSsalMeokData');
                    let currentData = { records: [], goals: [], equipment: {}, settings: {} };
                    
                    if (saved) {
                        currentData = JSON.parse(saved);
                    }

                    finalData = {
                        records: [...(currentData.records || []), ...(importedData.records || [])],
                        goals: [...(currentData.goals || []), ...(importedData.goals || [])],
                        equipment: { ...(currentData.equipment || {}), ...(importedData.equipment || {}) },
                        settings: { ...(currentData.settings || {}), ...(importedData.settings || {}) },
                        lastModified: new Date().toISOString()
                    };
                } else {
                    // 덮어쓰기
                    finalData = {
                        records: importedData.records || [],
                        goals: importedData.goals || [],
                        equipment: importedData.equipment || {},
                        settings: importedData.settings || {},
                        lastModified: new Date().toISOString()
                    };
                }
                
                // 데이터 저장
                localStorage.setItem('mapleSsalMeokData', JSON.stringify(finalData));
                
                alert(`데이터를 성공적으로 가져왔습니다. (${merge ? '병합됨' : '덮어씌움'})`);
                setTimeout(() => location.reload(), 1000);
                
            } catch (error) {
                console.error('Fallback 데이터 가져오기 실패:', error);
                alert('파일을 읽는 중 오류가 발생했습니다. 올바른 형식인지 확인해주세요.');
            }
        };
        
        reader.onerror = function() {
            alert('파일 읽기에 실패했습니다.');
        };
        
        reader.readAsText(file);
    }
}

/**
 * 데이터 가져오기
 * @param {Event} event - 파일 입력 이벤트
 */
function importData(event) {
    if (window.MapleStorage) {
        const file = event.target.files[0];
        if (file) {
            const merge = confirm('기존 데이터를 덮어씌우시겠습니까?\n(취소하면 데이터가 병합됩니다)');
            
            window.MapleStorage.importData(file, !merge)
                .then(() => {
                    showToast('데이터를 성공적으로 가져왔습니다.', 'success');
                    setTimeout(() => location.reload(), 1000);
                })
                .catch(error => {
                    showToast(error.message, 'error');
                });
        }
    }
}

/**
 * 모달 닫기
 * @param {string} modalId - 모달 ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 전체 UI 새로고침
 */
function refreshUI() {
    console.log('refreshUI 호출됨');
    
    if (window.MapleComponents && window.MapleComponents.refreshUI) {
        console.log('MapleComponents 모듈 사용하여 UI 새로고침');
        window.MapleComponents.refreshUI();
    } else {
        console.log('Fallback 모드: 직접 UI 새로고침');
        
        try {
            // localStorage에서 데이터 로딩
            const saved = localStorage.getItem('mapleSsalMeokData');
            let data = { records: [], goals: [], equipment: {}, settings: {} };
            
            if (saved) {
                data = JSON.parse(saved);
            }

            // 기록 테이블 업데이트
            updateRecordsTableFallback(data.records);
            
            // 목표 목록 업데이트
            updateGoalsListFallback(data.goals);
            
            // 통계 업데이트
            updateStatsFallback(data.records);
            
            console.log('Fallback UI 새로고침 완료');
            
        } catch (error) {
            console.error('Fallback UI 새로고침 실패:', error);
        }
    }
}

/**
 * Fallback 모드: 레코드 테이블 업데이트
 */
function updateRecordsTableFallback(records) {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">등록된 기록이 없습니다.</td></tr>';
        return;
    }

    // 최신 순 정렬
    const sortedRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedRecords.forEach(record => {
        const tr = document.createElement('tr');
        tr.className = record.type === 'income' ? 'income-row' : 'expense-row';

        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        const typeText = record.type === 'income' ? '수익' : '지출';
        const typeColor = record.type === 'income' ? '#228B22' : '#DC143C';
        const amountPrefix = record.type === 'income' ? '+' : '-';
        const formattedAmount = formatAmountFallback(record.amount);

        tr.innerHTML = `
            <td>${dateStr}</td>
            <td style="color: ${typeColor}; font-weight: 500;">${typeText}</td>
            <td>${record.category}</td>
            <td style="font-weight: bold; color: ${typeColor}">
                ${amountPrefix}${formattedAmount}
            </td>
            <td>${record.memo || ''}</td>
            <td>
                <button class="delete-btn" onclick="deleteRecord(${record.id})" title="삭제">❌</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

/**
 * Fallback 모드: 목표 목록 업데이트
 */
function updateGoalsListFallback(goals) {
    const container = document.getElementById('goalsList');
    if (!container) return;

    container.innerHTML = '';
    
    if (!goals || goals.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">설정된 목표가 없습니다.</div>';
        return;
    }

    goals.forEach(goal => {
        const goalDiv = document.createElement('div');
        goalDiv.className = 'goal-item';

        const formattedAmount = formatAmountFallback(goal.amount);
        
        goalDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${goal.name}</strong>
                    ${goal.memo ? `<span style="color: #666; font-size: 0.9em;"> - ${goal.memo}</span>` : ''}
                </div>
                <div>
                    <button class="delete-btn" onclick="deleteGoal(${goal.id})" title="삭제">❌</button>
                </div>
            </div>
            <div style="margin-top: 10px; color: #666; font-size: 0.9em;">
                목표: ${formattedAmount}
            </div>
        `;
        
        container.appendChild(goalDiv);
    });
}

/**
 * Fallback 모드: 통계 업데이트
 */
function updateStatsFallback(records) {
    if (!records) return;

    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpense;

    // 통계 요소 업데이트
    updateElementText('totalIncome', formatAmountFallback(totalIncome));
    updateElementText('totalExpense', formatAmountFallback(totalExpense));
    updateElementText('netProfit', formatAmountFallback(netProfit));
}

/**
 * Fallback 모드: 금액 포맷팅
 */
function formatAmountFallback(amount) {
    if (amount >= 100000000) {
        return `${(amount / 100000000).toFixed(1)}억`;
    } else if (amount >= 10000) {
        return `${Math.floor(amount / 10000)}만`;
    }
    return amount.toLocaleString();
}

/**
 * 요소 텍스트 업데이트 헬퍼
 */
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// === Missing Global Functions for UI ===

/**
 * 차트 업데이트 (전역 함수)
 */
function updateCharts() {
    console.log('updateCharts 호출됨');
    if (window.MapleCharts && window.MapleCharts.updateCharts) {
        window.MapleCharts.updateCharts();
    } else {
        console.warn('MapleCharts 모듈이 로딩되지 않았습니다.');
    }
}

/**
 * 예측 업데이트
 */
function updatePredictions() {
    console.log('updatePredictions 호출됨');
    if (window.MapleAnalytics && window.MapleAnalytics.updatePredictions) {
        window.MapleAnalytics.updatePredictions();
    }
}

/**
 * 패턴 분석 업데이트
 */
function updatePatternAnalysis() {
    console.log('updatePatternAnalysis 호출됨');
    if (window.MaplePatterns && window.MaplePatterns.updatePatternAnalysis) {
        window.MaplePatterns.updatePatternAnalysis();
    }
}

// === Helper Functions ===

function getCurrentView() {
    return window.MapleState ? 
        window.MapleState.getState('currentView') : 
        'daily';
}

function getCurrentChart() {
    return window.MapleState ? 
        window.MapleState.getState('currentChart') : 
        'combined';
}

function showToast(message, type = 'info', duration = 3000) {
    if (window.MapleComponents) {
        window.MapleComponents.showToast(message, type, duration);
    } else {
        // Fallback: 간단한 alert
        alert(message);
    }
}

function saveData() {
    if (window.MapleState) {
        window.MapleState.saveStateToStorage();
    }
}

// === 전역 변수 및 함수 노출 ===

// 전역 상태 변수 (하위 호환성)
window.records = [];
window.goals = [];
window.equipment = {};
window.currentView = 'daily';
window.currentChart = 'combined';
window.charts = {};
window.pendingGoalId = null;
window.settings = {
    mesoRate: 1000,
    patternNotif: true,
    darkMode: false,
    currentMeso: 0
};
window.categories = categories;

// 전역 함수 노출 (HTML에서 호출)
window.init = init;
window.updateCurrentMeso = updateCurrentMeso;
window.updateCategoryOptions = updateCategoryOptions;
window.addRecord = addRecord;
window.deleteRecord = deleteRecord;
window.addMemoToRecord = addMemoToRecord;
window.switchView = switchView;
window.switchChart = switchChart;
window.addGoal = addGoal;
window.deleteGoal = deleteGoal;
window.completeGoal = completeGoal;
window.confirmGoalComplete = confirmGoalComplete;
window.updateEquipmentValue = updateEquipmentValue;
window.toggleDarkMode = toggleDarkMode;
window.saveSettings = saveSettings;
window.updateMesoValue = updateMesoValue;
window.exportData = exportData;
window.importData = importData;
window.closeModal = closeModal;
window.refreshUI = refreshUI;
window.updateCharts = updateCharts;
window.updatePredictions = updatePredictions;
window.updatePatternAnalysis = updatePatternAnalysis;

// DOMContentLoaded 이벤트에서 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded 이벤트 발생');
        try {
            init();
        } catch (error) {
            console.error('초기화 함수 호출 실패:', error);
            showLoadingScreen(false);
        }
    });
} else {
    // 이미 로딩이 완료된 경우 즉시 초기화
    console.log('페이지 이미 로드됨, 즉시 초기화');
    try {
        init();
    } catch (error) {
        console.error('초기화 함수 호출 실패:', error);
        showLoadingScreen(false);
    }
}

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (window.MapleEvents) {
        window.MapleEvents.cleanupEventListeners();
    }
});

console.log('🍄 메이플 쌀먹 가계부 v2.0 메인 스크립트 로딩 완료');