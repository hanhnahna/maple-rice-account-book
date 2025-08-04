/**
 * 알림 시스템 모듈
 * 플로팅 박스 형태의 알림 표시
 */

// 알림 큐
let notificationQueue = [];
let isShowingNotification = false;

// 알림 표시
function showNotification(message, type = 'info', duration = 3000) {
    const notification = {
        message,
        type,
        duration,
        id: Date.now()
    };
    
    notificationQueue.push(notification);
    processNotificationQueue();
}

// 알림 큐 처리
function processNotificationQueue() {
    if (isShowingNotification || notificationQueue.length === 0) {
        return;
    }
    
    isShowingNotification = true;
    const notification = notificationQueue.shift();
    
    const box = createNotificationBox(notification);
    document.body.appendChild(box);
    
    // 애니메이션 시작
    requestAnimationFrame(() => {
        box.classList.add('show');
    });
    
    // 자동 제거
    setTimeout(() => {
        box.classList.remove('show');
        setTimeout(() => {
            box.remove();
            isShowingNotification = false;
            processNotificationQueue();
        }, 300);
    }, notification.duration);
}

// 알림 박스 생성
function createNotificationBox(notification) {
    const box = document.createElement('div');
    box.className = `notification-box notification-${notification.type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    box.innerHTML = `
        <div class="notification-icon">${icons[notification.type] || icons.info}</div>
        <div class="notification-content">
            <div class="notification-message">${notification.message}</div>
        </div>
        <button class="notification-close" onclick="closeNotification(${notification.id})">×</button>
    `;
    
    return box;
}

// 알림 닫기
function closeNotification(id) {
    const box = document.querySelector(`.notification-box`);
    if (box) {
        box.classList.remove('show');
        setTimeout(() => {
            box.remove();
            isShowingNotification = false;
            processNotificationQueue();
        }, 300);
    }
}

// 성공 알림
function showSuccess(message, duration = 3000) {
    showNotification(message, 'success', duration);
}

// 에러 알림
function showError(message, duration = 4000) {
    showNotification(message, 'error', duration);
}

// 경고 알림
function showWarning(message, duration = 3500) {
    showNotification(message, 'warning', duration);
}

// 정보 알림
function showInfo(message, duration = 3000) {
    showNotification(message, 'info', duration);
}

// 확인 다이얼로그 (플로팅 박스)
function showConfirm(message, onConfirm, onCancel) {
    const box = document.createElement('div');
    box.className = 'confirm-dialog-box';
    box.innerHTML = `
        <div class="floating-box-content">
            <h3>확인</h3>
            <p>${message}</p>
            <div class="button-group">
                <button class="btn-primary" id="confirmYes">예</button>
                <button class="btn-secondary" id="confirmNo">아니오</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(box);
    
    const yesBtn = box.querySelector('#confirmYes');
    const noBtn = box.querySelector('#confirmNo');
    
    yesBtn.onclick = () => {
        box.remove();
        if (onConfirm) onConfirm();
    };
    
    noBtn.onclick = () => {
        box.remove();
        if (onCancel) onCancel();
    };
}

// 프롬프트 다이얼로그 (플로팅 박스)
function showPrompt(message, defaultValue = '', onSubmit, onCancel) {
    const box = document.createElement('div');
    box.className = 'prompt-dialog-box';
    box.innerHTML = `
        <div class="floating-box-content">
            <h3>입력</h3>
            <p>${message}</p>
            <div class="form-group">
                <input type="text" id="promptInput" class="form-control" value="${defaultValue}">
            </div>
            <div class="button-group">
                <button class="btn-primary" id="promptSubmit">확인</button>
                <button class="btn-secondary" id="promptCancel">취소</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(box);
    
    const input = box.querySelector('#promptInput');
    const submitBtn = box.querySelector('#promptSubmit');
    const cancelBtn = box.querySelector('#promptCancel');
    
    // 입력 필드에 포커스
    input.focus();
    input.select();
    
    // 엔터키 처리
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });
    
    submitBtn.onclick = () => {
        const value = input.value;
        box.remove();
        if (onSubmit) onSubmit(value);
    };
    
    cancelBtn.onclick = () => {
        box.remove();
        if (onCancel) onCancel();
    };
}

// 로딩 표시
function showLoading(message = '처리 중...') {
    const box = document.createElement('div');
    box.className = 'loading-box';
    box.innerHTML = `
        <div class="loading-content">
            <div class="loading"></div>
            <div class="loading-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(box);
    
    return {
        update: (newMessage) => {
            const messageEl = box.querySelector('.loading-message');
            if (messageEl) messageEl.textContent = newMessage;
        },
        close: () => {
            box.remove();
        }
    };
}

// 알림 스타일 추가
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
/* 알림 박스 */
.notification-box {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--container-bg);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    padding: 16px 20px;
    min-width: 300px;
    max-width: 400px;
    display: flex;
    align-items: center;
    gap: 12px;
    transform: translateX(120%);
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 3000;
}

.notification-box.show {
    transform: translateX(0);
}

.notification-icon {
    font-size: 24px;
    flex-shrink: 0;
}

.notification-content {
    flex: 1;
}

.notification-message {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-color);
}

.notification-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
}

.notification-close:hover {
    background: var(--card-hover);
    color: var(--text-color);
}

/* 알림 타입별 스타일 */
.notification-success {
    border-left: 4px solid #4CAF50;
}

.notification-error {
    border-left: 4px solid #DC143C;
}

.notification-warning {
    border-left: 4px solid #FF8C00;
}

.notification-info {
    border-left: 4px solid #4169E1;
}

/* 확인 다이얼로그 */
.confirm-dialog-box,
.prompt-dialog-box {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--container-bg);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 2000;
    animation: fadeInScale 0.3s ease;
}

/* 로딩 박스 */
.loading-box {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    border-radius: 12px;
    padding: 30px;
    z-index: 3000;
    animation: fadeIn 0.3s ease;
}

.loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.loading-message {
    color: white;
    font-size: 16px;
}

/* 다크 모드 지원 */
body.dark-mode .notification-box {
    background: #2a2a2a;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

body.dark-mode .confirm-dialog-box,
body.dark-mode .prompt-dialog-box {
    background: #2a2a2a;
}
`;
document.head.appendChild(notificationStyle);

// 전역 함수 등록
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;
window.showLoading = showLoading;
window.closeNotification = closeNotification;