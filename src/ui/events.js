/**
 * 이벤트 리스너 관리 모듈
 * 메이플 쌀먹 가계부 사용자 상호작용 이벤트 처리
 */

// 이벤트 리스너 저장소
const eventListeners = new Map();
let eventIdCounter = 0;

/**
 * 이벤트 시스템 초기화
 */
function initializeEvents() {
    console.log('이벤트 시스템 초기화 시작...');
    
    // 기본 이벤트 리스너 등록
    setupBasicEventListeners();
    
    // 키보드 이벤트 등록
    setupKeyboardEvents();
    
    // 폼 이벤트 등록
    setupFormEvents();
    
    // 네비게이션 이벤트 등록
    setupNavigationEvents();
    
    // 모달 이벤트 등록
    setupModalEvents();
    
    // 툴팁 이벤트 등록
    setupTooltipEvents();
    
    // 반응형 이벤트 등록
    setupResponsiveEvents();
    
    // PWA 이벤트 등록
    setupPWAEvents();
    
    console.log('이벤트 시스템 초기화 완료');
}

/**
 * 기본 이벤트 리스너 설정
 */
function setupBasicEventListeners() {
    // 엔터키 이벤트
    addEventListenerSafe('amount', 'keypress', (e) => {
        if (e.key === 'Enter') addRecord();
    });

    addEventListenerSafe('goalAmount', 'keypress', (e) => {
        if (e.key === 'Enter') addGoal();
    });

    // 타입 변경 이벤트
    addEventListenerSafe('type', 'change', updateCategoryOptions);

    // 현재 메소 업데이트 이벤트
    addEventListenerSafe('currentMesoInput', 'blur', updateCurrentMeso);
    addEventListenerSafe('currentMesoInput', 'keypress', (e) => {
        if (e.key === 'Enter') updateCurrentMeso();
    });

    // 메소 시세 변경 이벤트
    addEventListenerSafe('mesoRate', 'change', updateMesoValue);
    addEventListenerSafe('mesoRate', 'input', debounce(updateMesoValue, 500));

    // 장비 가치 입력 이벤트
    setupEquipmentEvents();
}

/**
 * 키보드 이벤트 설정
 */
function setupKeyboardEvents() {
    // 전역 키보드 단축키
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd 조합키
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    saveData();
                    showToast('데이터가 저장되었습니다.', 'success');
                    break;
                case 'z':
                    e.preventDefault();
                    // 실행 취소 기능 (향후 구현)
                    break;
                case 'n':
                    e.preventDefault();
                    focusAmountInput();
                    break;
                case 'd':
                    e.preventDefault();
                    toggleDarkMode();
                    break;
            }
        }
        
        // ESC 키로 모달 닫기
        if (e.key === 'Escape') {
            closeAllModals();
        }
        
        // F키 단축키
        switch (e.key) {
            case 'F1':
                e.preventDefault();
                showHelpModal();
                break;
            case 'F5':
                e.preventDefault();
                refreshUI();
                showToast('UI가 새로고침되었습니다.', 'info');
                break;
        }
    });

    // 숫자 키패드 지원
    document.addEventListener('keypress', (e) => {
        // 포커스된 입력 필드가 없을 때만
        if (!document.activeElement || 
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            
            if (e.key >= '0' && e.key <= '9') {
                focusAmountInput();
                // 입력된 숫자를 필드에 추가
                const amountInput = document.getElementById('amount');
                if (amountInput) {
                    amountInput.value += e.key;
                }
            }
        }
    });
}

/**
 * 폼 이벤트 설정
 */
function setupFormEvents() {
    // 폼 검증 이벤트
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            validateAndSubmitForm(form);
        });
    });

    // 입력 필드 실시간 검증
    setupInputValidation();
    
    // 자동 저장 이벤트
    setupAutoSave();
}

/**
 * 네비게이션 이벤트 설정
 */
function setupNavigationEvents() {
    // 탭 전환 이벤트
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const view = extractViewFromElement(e.target);
            if (view) {
                switchView(view);
                updateViewTabs(view);
            }
        });
    });

    // 차트 탭 전환 이벤트
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const chartType = extractChartTypeFromElement(e.target);
            if (chartType) {
                switchChart(chartType);
                updateChartTabs(chartType);
            }
        });
    });

    // 페이지 내 스크롤 네비게이션
    setupSmoothScrolling();
}

/**
 * 모달 이벤트 설정
 */
function setupModalEvents() {
    // 모달 외부 클릭으로 닫기
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // 모달 드래그 지원
    setupModalDragging();
    
    // 모달 크기 조정 지원
    setupModalResizing();
}

/**
 * 툴팁 이벤트 설정
 */
function setupTooltipEvents() {
    document.querySelectorAll('.tooltip').forEach(tooltip => {
        tooltip.addEventListener('mouseenter', (e) => {
            const tooltipText = tooltip.querySelector('.tooltiptext');
            if (tooltipText) {
                positionTooltip(tooltipText, e);
            }
        });

        tooltip.addEventListener('mouseleave', () => {
            // 툴팁 숨김은 CSS로 처리
        });

        tooltip.addEventListener('mousemove', (e) => {
            const tooltipText = tooltip.querySelector('.tooltiptext');
            if (tooltipText && tooltipText.style.display !== 'none') {
                positionTooltip(tooltipText, e);
            }
        });
    });
}

/**
 * 반응형 이벤트 설정
 */
function setupResponsiveEvents() {
    // 화면 크기 변경 감지
    window.addEventListener('resize', debounce(() => {
        handleScreenResize();
    }, 250));

    // 방향 전환 감지 (모바일)
    window.addEventListener('orientationchange', () => {
        setTimeout(handleOrientationChange, 500);
    });

    // 터치 이벤트 (모바일)
    setupTouchEvents();
}

/**
 * PWA 이벤트 설정
 */
function setupPWAEvents() {
    // 서비스 워커 등록
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker 등록 성공:', registration);
            })
            .catch(error => {
                console.log('Service Worker 등록 실패:', error);
            });
    }

    // 온라인/오프라인 상태 감지
    window.addEventListener('online', () => {
        document.body.classList.remove('offline');
        showToast('온라인 상태로 전환되었습니다.', 'success');
    });

    window.addEventListener('offline', () => {
        document.body.classList.add('offline');
        showToast('오프라인 상태입니다.', 'warning');
    });

    // 앱 설치 이벤트
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        showInstallPrompt(e);
    });
}

/**
 * 장비 관련 이벤트 설정
 */
function setupEquipmentEvents() {
    const equipmentInputs = document.querySelectorAll('[id^="equip-"]');
    equipmentInputs.forEach(input => {
        const itemId = input.id.replace('equip-', '');
        
        // 입력 완료 시 업데이트
        input.addEventListener('blur', () => {
            const value = parseMeso(input.value);
            updateEquipmentValue(itemId, value);
        });

        // 엔터키 입력 시 업데이트
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = parseMeso(input.value);
                updateEquipmentValue(itemId, value);
                input.blur();
            }
        });

        // 실시간 미리보기 (debounced)
        input.addEventListener('input', debounce(() => {
            const value = parseMeso(input.value);
            previewEquipmentUpdate(itemId, value);
        }, 300));
    });
}

/**
 * 입력 검증 이벤트 설정
 */
function setupInputValidation() {
    // 금액 입력 필드 검증
    const amountInputs = document.querySelectorAll('input[type="text"][id$="Amount"], input[id="amount"]');
    amountInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            validateAmountInput(e.target);
        });

        input.addEventListener('paste', (e) => {
            setTimeout(() => validateAmountInput(e.target), 0);
        });
    });

    // 이름 입력 필드 검증
    const nameInputs = document.querySelectorAll('input[id$="Name"]');
    nameInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            validateNameInput(e.target);
        });
    });
}

/**
 * 자동 저장 이벤트 설정
 */
function setupAutoSave() {
    let autoSaveTimer;
    
    // 데이터 변경 감지 시 자동 저장
    const autoSaveFields = document.querySelectorAll('input, textarea, select');
    autoSaveFields.forEach(field => {
        field.addEventListener('change', () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                saveData();
                console.log('자동 저장 실행');
            }, 5000); // 5초 후 자동 저장
        });
    });
}

/**
 * 터치 이벤트 설정 (모바일)
 */
function setupTouchEvents() {
    let touchStartY = 0;
    let touchStartX = 0;

    // 스와이프 제스처 감지
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
    });

    document.addEventListener('touchend', (e) => {
        if (!e.changedTouches[0]) return;

        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const deltaY = touchStartY - touchEndY;
        const deltaX = touchStartX - touchEndX;

        // 수직 스와이프 (새로고침)
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
            if (deltaY < 0 && window.scrollY === 0) {
                // 아래로 스와이프 (새로고침)
                refreshUI();
                showToast('새로고침되었습니다.', 'info');
            }
        }

        // 수평 스와이프 (탭 전환)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
            if (deltaX > 0) {
                // 왼쪽으로 스와이프 (다음 탭)
                switchToNextTab();
            } else {
                // 오른쪽으로 스와이프 (이전 탭)
                switchToPreviousTab();
            }
        }
    });

    // 길게 누르기 제스처
    setupLongPressEvents();
}

/**
 * 부드러운 스크롤 설정
 */
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * 모달 드래그 기능 설정
 */
function setupModalDragging() {
    const modals = document.querySelectorAll('.modal .modal-content');
    modals.forEach(modal => {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        const header = modal.querySelector('.modal-header') || modal;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - modal.offsetLeft;
            initialY = e.clientY - modal.offsetTop;

            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
                modal.style.cursor = 'grabbing';
            }
        }

        function dragMove(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                modal.style.left = currentX + 'px';
                modal.style.top = currentY + 'px';
            }
        }

        function dragEnd() {
            isDragging = false;
            modal.style.cursor = 'grab';
        }
    });
}

/**
 * 길게 누르기 이벤트 설정
 */
function setupLongPressEvents() {
    let pressTimer;

    document.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            handleLongPress(e.target);
        }, 800);
    });

    document.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });

    document.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
    });
}

/**
 * 커스텀 이벤트 발생
 * @param {string} eventName - 이벤트 이름
 * @param {any} detail - 이벤트 상세 정보
 * @param {Element} target - 대상 요소 (기본값: document)
 */
function dispatchCustomEvent(eventName, detail = null, target = document) {
    const event = new CustomEvent(eventName, {
        detail: detail,
        bubbles: true,
        cancelable: true
    });
    
    target.dispatchEvent(event);
}

/**
 * 이벤트 리스너 안전하게 추가
 * @param {string} elementId - 요소 ID
 * @param {string} eventType - 이벤트 타입
 * @param {Function} handler - 이벤트 핸들러
 * @returns {number} 이벤트 리스너 ID
 */
function addEventListenerSafe(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`요소를 찾을 수 없습니다: ${elementId}`);
        return null;
    }

    element.addEventListener(eventType, handler);
    
    const listenerId = ++eventIdCounter;
    eventListeners.set(listenerId, {
        element,
        eventType,
        handler
    });

    return listenerId;
}

/**
 * 이벤트 리스너 제거
 * @param {number} listenerId - 이벤트 리스너 ID
 */
function removeEventListener(listenerId) {
    const listener = eventListeners.get(listenerId);
    if (listener) {
        listener.element.removeEventListener(listener.eventType, listener.handler);
        eventListeners.delete(listenerId);
    }
}

/**
 * 모든 이벤트 리스너 정리
 */
function cleanupEventListeners() {
    eventListeners.forEach((listener, id) => {
        removeEventListener(id);
    });
    console.log('모든 이벤트 리스너가 정리되었습니다.');
}

// === Event Handler Functions ===

function handleScreenResize() {
    // 차트 크기 조정
    if (window.MapleCharts) {
        window.MapleCharts.updateCharts();
    }
    
    // 반응형 레이아웃 조정
    adjustResponsiveLayout();
}

function handleOrientationChange() {
    // 방향 전환 후 레이아웃 재조정
    handleScreenResize();
    
    // 모바일에서 높이 재계산
    setTimeout(() => {
        document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
    }, 100);
}

function handleLongPress(target) {
    // 길게 누르기 시 컨텍스트 메뉴 표시
    if (target.classList.contains('record-row')) {
        showRecordContextMenu(target);
    } else if (target.classList.contains('goal-item')) {
        showGoalContextMenu(target);
    }
}

function focusAmountInput() {
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.focus();
        amountInput.select();
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function validateAmountInput(input) {
    const value = input.value;
    const isValid = /^[\d.,조억만]*$/.test(value);
    
    if (!isValid) {
        input.classList.add('invalid');
        showInputError(input, '올바른 금액 형식이 아닙니다.');
    } else {
        input.classList.remove('invalid');
        clearInputError(input);
    }
}

function validateNameInput(input) {
    const value = input.value.trim();
    const isValid = value.length > 0 && value.length <= 50;
    
    if (!isValid) {
        input.classList.add('invalid');
        if (value.length === 0) {
            showInputError(input, '이름을 입력해주세요.');
        } else {
            showInputError(input, '이름은 50자 이내로 입력해주세요.');
        }
    } else {
        input.classList.remove('invalid');
        clearInputError(input);
    }
}

function showInputError(input, message) {
    let errorElement = input.parentElement.querySelector('.input-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'input-error';
        input.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

function clearInputError(input) {
    const errorElement = input.parentElement.querySelector('.input-error');
    if (errorElement) {
        errorElement.remove();
    }
}

function positionTooltip(tooltipText, event) {
    const rect = event.target.getBoundingClientRect();
    tooltipText.style.left = rect.left + 'px';
    tooltipText.style.top = (rect.bottom + 5) + 'px';
}

function extractViewFromElement(element) {
    const onclick = element.getAttribute('onclick');
    if (onclick && onclick.includes('switchView')) {
        const match = onclick.match(/switchView\(['"](.+)['"]\)/);
        return match ? match[1] : null;
    }
    return null;
}

function extractChartTypeFromElement(element) {
    const onclick = element.getAttribute('onclick');
    if (onclick && onclick.includes('switchChart')) {
        const match = onclick.match(/switchChart\(['"](.+)['"]\)/);
        return match ? match[1] : null;
    }
    return null;
}

// === Helper Functions ===

function debounce(func, wait) {
    return window.MapleHelpers && window.MapleHelpers.debounce ? 
        window.MapleHelpers.debounce(func, wait) : 
        func;
}

function parseMeso(value) {
    return window.MapleFormatters && window.MapleFormatters.parseMeso ? 
        window.MapleFormatters.parseMeso(value) : 
        parseInt(value) || 0;
}

// 전역 함수로 노출 (HTML에서 호출)
window.dispatchCustomEvent = dispatchCustomEvent;

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeEvents,
        addEventListenerSafe,
        removeEventListener,
        cleanupEventListeners,
        dispatchCustomEvent
    };
}

/**
 * 모달 드래그 설정
 */
function setupModalDragging() {
    const modals = document.querySelectorAll('.modal-content');
    
    modals.forEach(modal => {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        modal.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.classList.contains('modal-content') || e.target.tagName === 'H2') {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isDragging = true;
                modal.style.cursor = 'grabbing';
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                modal.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            modal.style.cursor = 'default';
        }
    });
}

/**
 * 모달 크기 조정 설정
 */
function setupModalResizing() {
    const modals = document.querySelectorAll('.modal-content');
    
    modals.forEach(modal => {
        // 크기 조정 핸들 추가
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'modal-resize-handle';
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            background: #ccc;
            cursor: se-resize;
            border-radius: 0 0 10px 0;
            opacity: 0.7;
        `;
        modal.appendChild(resizeHandle);

        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        resizeHandle.addEventListener('mousedown', initResize);

        function initResize(e) {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(window.getComputedStyle(modal).width, 10);
            startHeight = parseInt(window.getComputedStyle(modal).height, 10);
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
            e.preventDefault();
        }

        function doResize(e) {
            if (!isResizing) return;
            
            const newWidth = startWidth + (e.clientX - startX);
            const newHeight = startHeight + (e.clientY - startY);
            
            modal.style.width = Math.max(300, newWidth) + 'px';
            modal.style.height = Math.max(200, newHeight) + 'px';
        }

        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
        }
    });
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleEvents = {
        initializeEvents,
        addEventListenerSafe,
        removeEventListener,
        cleanupEventListeners,
        dispatchCustomEvent
    };
}