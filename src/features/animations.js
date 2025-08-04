/**
 * 애니메이션 유틸리티 모듈
 * 동적 애니메이션 효과 제어
 */

// 숫자 카운트업 애니메이션
function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const range = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easeOutQuart 이징 함수
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentValue = start + (range * easeProgress);
        
        if (element.hasAttribute('data-full')) {
            element.setAttribute('data-full', Math.floor(currentValue));
        }
        element.textContent = formatMeso(Math.floor(currentValue));
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// 새 레코드 추가 시 애니메이션
function animateNewRecord(row) {
    row.classList.add('record-item-new');
    setTimeout(() => {
        row.style.background = '';
        row.classList.remove('record-item-new');
    }, 2000);
}

// 요소 삭제 애니메이션
function animateRemove(element, callback) {
    element.classList.add('removing');
    element.addEventListener('animationend', () => {
        element.remove();
        if (callback) callback();
    }, { once: true });
}

// 성공 애니메이션
function showSuccessAnimation(element) {
    element.classList.add('success-flash');
    setTimeout(() => {
        element.classList.remove('success-flash');
    }, 500);
}

// 에러 애니메이션
function showErrorAnimation(element) {
    element.classList.add('error-shake');
    setTimeout(() => {
        element.classList.remove('error-shake');
    }, 500);
}

// 목표 달성 축하 애니메이션
function celebrateGoalAchievement(goalElement) {
    goalElement.classList.add('achieved');
    
    // 폭죽 효과 생성
    createConfetti(goalElement);
    
    // 체크마크 SVG 추가
    const checkmark = document.createElement('div');
    checkmark.className = 'goal-checkmark';
    checkmark.innerHTML = `
        <svg width="50" height="50" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#4CAF50" stroke-width="3"/>
            <path d="M15 25 L22 32 L35 18" fill="none" stroke="#4CAF50" stroke-width="3" 
                  class="success-checkmark"/>
        </svg>
    `;
    checkmark.style.position = 'absolute';
    checkmark.style.right = '20px';
    checkmark.style.top = '50%';
    checkmark.style.transform = 'translateY(-50%)';
    goalElement.appendChild(checkmark);
}

// 폭죽 효과
function createConfetti(targetElement) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const confettiCount = 30;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: 50%;
            top: 50%;
            opacity: 0;
            animation: confetti-fall 1s ease-out forwards;
            animation-delay: ${Math.random() * 0.3}s;
        `;
        targetElement.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 1500);
    }
}

// 스크롤 나타나기 효과
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });
}

// 리플 효과
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: ripple 0.6s ease-out;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// 프로그레스 바 애니메이션
function animateProgressBar(element, progress, duration = 500) {
    const currentWidth = parseFloat(element.style.width) || 0;
    const startTime = performance.now();
    
    function updateProgress(currentTime) {
        const elapsed = currentTime - startTime;
        const animProgress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - animProgress, 3);
        
        const newWidth = currentWidth + (progress - currentWidth) * easeProgress;
        element.style.width = newWidth + '%';
        element.textContent = Math.round(newWidth) + '%';
        
        if (animProgress < 1) {
            requestAnimationFrame(updateProgress);
        }
    }
    
    requestAnimationFrame(updateProgress);
}

// 탭 전환 애니메이션
function animateTabSwitch(newTab, oldTab) {
    if (oldTab) {
        oldTab.style.transform = 'scale(0.95)';
        oldTab.style.opacity = '0.5';
    }
    
    setTimeout(() => {
        if (oldTab) {
            oldTab.classList.remove('active');
            oldTab.style.transform = '';
            oldTab.style.opacity = '';
        }
        
        newTab.classList.add('active');
        newTab.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            newTab.style.transform = '';
        }, 200);
    }, 100);
}

// 차트 전환 애니메이션
function animateChartTransition(chartContainer) {
    chartContainer.style.opacity = '0';
    chartContainer.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        chartContainer.style.transition = 'all 0.5s ease';
        chartContainer.style.opacity = '1';
        chartContainer.style.transform = 'translateY(0)';
    }, 100);
}

// 플로팅 액션 버튼 초기화
function initFloatingActionButton() {
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.innerHTML = '📊';
    fab.title = 'CSV 내보내기';
    fab.onclick = () => showCsvExportDialog();
    
    document.body.appendChild(fab);
}

// 애니메이션 CSS 추가
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confetti-fall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100px) rotate(720deg);
                opacity: 0;
            }
        }
        
        @keyframes ripple {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            100% {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 초기화 함수
function initAnimations() {
    // 애니메이션 스타일 추가
    addAnimationStyles();
    
    // 스크롤 나타나기 효과 초기화
    initScrollReveal();
    
    // 플로팅 액션 버튼 초기화
    initFloatingActionButton();
    
    // 버튼 리플 효과 추가
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', createRipple);
    });
    
    // 초기 숫자 애니메이션
    document.querySelectorAll('.summary-value').forEach(el => {
        const value = parseInt(el.getAttribute('data-full') || '0');
        if (value > 0) {
            animateNumber(el, 0, value, 1500);
        }
    });
}

// 전역 함수로 등록
window.animateNumber = animateNumber;
window.animateNewRecord = animateNewRecord;
window.animateRemove = animateRemove;
window.showSuccessAnimation = showSuccessAnimation;
window.showErrorAnimation = showErrorAnimation;
window.celebrateGoalAchievement = celebrateGoalAchievement;
window.animateProgressBar = animateProgressBar;
window.animateTabSwitch = animateTabSwitch;
window.animateChartTransition = animateChartTransition;
window.initAnimations = initAnimations;