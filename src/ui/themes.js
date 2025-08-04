/**
 * 다크모드 및 테마 관리 모듈
 * 메이플 쌀먹 가계부 테마 시스템
 */

// 테마 설정
const THEMES = {
    light: {
        name: 'light',
        displayName: '라이트 모드',
        icon: '☀️'
    },
    dark: {
        name: 'dark',
        displayName: '다크 모드',
        icon: '🌙'
    },
    auto: {
        name: 'auto',
        displayName: '자동',
        icon: '🌗'
    }
};

// 현재 테마 상태
let currentTheme = 'light';
let systemPrefersDark = false;

/**
 * 테마 시스템 초기화
 */
function initializeThemes() {
    // 시스템 다크모드 감지
    detectSystemTheme();
    
    // 저장된 테마 설정 로드
    loadThemeSettings();
    
    // 시스템 테마 변경 감지
    watchSystemThemeChanges();
    
    // 초기 테마 적용
    applyCurrentTheme();
    
    console.log('테마 시스템 초기화 완료:', currentTheme);
}

/**
 * 다크모드 토글
 */
function toggleDarkMode() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

/**
 * 테마 설정
 * @param {string} theme - 테마 이름 ('light', 'dark', 'auto')
 */
function setTheme(theme) {
    if (!THEMES[theme]) {
        console.warn('유효하지 않은 테마:', theme);
        return;
    }

    currentTheme = theme;
    applyCurrentTheme();
    saveThemeSettings();
    
    // 차트 테마 업데이트
    updateChartTheme();
    
    // 테마 변경 이벤트 발생
    dispatchThemeChangeEvent(theme);
}

/**
 * 현재 테마 적용
 */
function applyCurrentTheme() {
    const shouldUseDark = getShouldUseDarkTheme();
    
    if (shouldUseDark) {
        enableDarkMode();
    } else {
        enableLightMode();
    }
    
    updateThemeUI();
}

/**
 * 다크모드 활성화
 */
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    updateMetaThemeColor('#1a1a1a');
    console.log('다크모드 활성화');
}

/**
 * 라이트모드 활성화
 */
function enableLightMode() {
    document.body.classList.remove('dark-mode');
    updateMetaThemeColor('#228B22');
    console.log('라이트모드 활성화');
}

/**
 * 다크모드 사용 여부 결정
 * @returns {boolean} 다크모드 사용 여부
 */
function getShouldUseDarkTheme() {
    switch (currentTheme) {
        case 'dark':
            return true;
        case 'light':
            return false;
        case 'auto':
            return systemPrefersDark;
        default:
            return false;
    }
}

/**
 * 시스템 테마 감지
 */
function detectSystemTheme() {
    if (window.matchMedia) {
        systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('시스템 다크모드 감지:', systemPrefersDark);
    }
}

/**
 * 시스템 테마 변경 감지
 */
function watchSystemThemeChanges() {
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // 최신 브라우저
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleSystemThemeChange);
        } 
        // 구 브라우저 호환성
        else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleSystemThemeChange);
        }
    }
}

/**
 * 시스템 테마 변경 핸들러
 * @param {MediaQueryListEvent} e - 미디어 쿼리 이벤트
 */
function handleSystemThemeChange(e) {
    systemPrefersDark = e.matches;
    console.log('시스템 테마 변경 감지:', systemPrefersDark);
    
    // 자동 모드인 경우 테마 재적용
    if (currentTheme === 'auto') {
        applyCurrentTheme();
    }
}

/**
 * 테마 설정 저장
 */
function saveThemeSettings() {
    try {
        const settings = getSettings();
        settings.theme = currentTheme;
        settings.darkMode = getShouldUseDarkTheme(); // 하위 호환성
        
        if (window.MapleState) {
            window.MapleState.updateSettings(settings);
        } else {
            // Fallback
            localStorage.setItem('mapleThemeSettings', JSON.stringify({
                theme: currentTheme,
                darkMode: getShouldUseDarkTheme()
            }));
        }
        
        console.log('테마 설정 저장:', currentTheme);
    } catch (error) {
        console.error('테마 설정 저장 실패:', error);
    }
}

/**
 * 테마 설정 로드
 */
function loadThemeSettings() {
    try {
        const settings = getSettings();
        
        // 새로운 테마 설정 확인
        if (settings.theme && THEMES[settings.theme]) {
            currentTheme = settings.theme;
        } 
        // 기존 다크모드 설정 호환성
        else if (settings.darkMode === true) {
            currentTheme = 'dark';
        } else if (settings.darkMode === false) {
            currentTheme = 'light';
        }
        
        console.log('테마 설정 로드:', currentTheme);
    } catch (error) {
        console.error('테마 설정 로드 실패:', error);
        currentTheme = 'light'; // 기본값
    }
}

/**
 * 테마 UI 업데이트
 */
function updateThemeUI() {
    // 테마 토글 버튼 업데이트
    updateThemeToggleButton();
    
    // 테마 선택기 업데이트 (있는 경우)
    updateThemeSelector();
    
    // 커스텀 테마 속성 업데이트
    updateCustomThemeProperties();
}

/**
 * 테마 토글 버튼 업데이트
 */
function updateThemeToggleButton() {
    const toggleButton = document.querySelector('.dark-mode-toggle');
    if (!toggleButton) return;
    
    const isDark = getShouldUseDarkTheme();
    const theme = THEMES[currentTheme];
    
    toggleButton.textContent = theme.icon;
    toggleButton.title = theme.displayName;
    toggleButton.setAttribute('aria-label', theme.displayName);
}

/**
 * 테마 선택기 업데이트
 */
function updateThemeSelector() {
    const selector = document.getElementById('themeSelector');
    if (!selector) return;
    
    selector.value = currentTheme;
}

/**
 * 커스텀 테마 속성 업데이트
 */
function updateCustomThemeProperties() {
    const root = document.documentElement;
    const isDark = getShouldUseDarkTheme();
    
    // CSS 커스텀 속성 업데이트
    if (isDark) {
        root.style.setProperty('--theme-primary', '#4CAF50');
        root.style.setProperty('--theme-secondary', '#2196F3');
        root.style.setProperty('--theme-accent', '#FF9800');
    } else {
        root.style.setProperty('--theme-primary', '#228B22');
        root.style.setProperty('--theme-secondary', '#1976D2');
        root.style.setProperty('--theme-accent', '#F57C00');
    }
}

/**
 * 메타 테마 컬러 업데이트 (모바일 브라우저용)
 * @param {string} color - 테마 컬러
 */
function updateMetaThemeColor(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = color;
}

/**
 * 차트 테마 업데이트
 */
function updateChartTheme() {
    if (window.MapleCharts && window.MapleCharts.updateChartTheme) {
        window.MapleCharts.updateChartTheme();
    }
}

/**
 * 테마 변경 이벤트 발생
 * @param {string} theme - 새로운 테마
 */
function dispatchThemeChangeEvent(theme) {
    const event = new CustomEvent('themeChanged', {
        detail: {
            theme: theme,
            isDark: getShouldUseDarkTheme()
        }
    });
    
    document.dispatchEvent(event);
}

/**
 * 현재 테마 정보 조회
 * @returns {Object} 테마 정보
 */
function getCurrentThemeInfo() {
    return {
        theme: currentTheme,
        isDark: getShouldUseDarkTheme(),
        systemPrefersDark: systemPrefersDark,
        availableThemes: Object.values(THEMES)
    };
}

/**
 * 테마 프리셋 생성
 * @param {string} name - 프리셋 이름
 * @returns {Object} 테마 프리셋
 */
function createThemePreset(name) {
    const presets = {
        maple: {
            name: 'maple',
            displayName: '메이플 클래식',
            colors: {
                primary: '#228B22',
                secondary: '#32CD32',
                accent: '#FFD700',
                background: '#F5F5DC'
            }
        },
        ocean: {
            name: 'ocean',
            displayName: '오션 블루',
            colors: {
                primary: '#006994',
                secondary: '#0099CC',
                accent: '#00CCFF',
                background: '#E6F7FF'
            }
        },
        sunset: {
            name: 'sunset',
            displayName: '선셋 오렌지',
            colors: {
                primary: '#FF6B35',
                secondary: '#F7931E',
                accent: '#FFD23F',
                background: '#FFF8E1'
            }
        }
    };
    
    return presets[name] || null;
}

/**
 * 커스텀 테마 적용
 * @param {Object} themeConfig - 테마 설정
 */
function applyCustomTheme(themeConfig) {
    const root = document.documentElement;
    
    Object.entries(themeConfig.colors).forEach(([property, value]) => {
        root.style.setProperty(`--theme-${property}`, value);
    });
    
    console.log('커스텀 테마 적용:', themeConfig.name);
}

/**
 * 테마 애니메이션 효과
 * @param {boolean} enabled - 애니메이션 활성화 여부
 */
function setThemeTransitions(enabled) {
    const root = document.documentElement;
    
    if (enabled) {
        root.style.setProperty('--theme-transition', 'all 0.3s ease');
    } else {
        root.style.setProperty('--theme-transition', 'none');
    }
}

/**
 * 고대비 모드 토글
 */
function toggleHighContrast() {
    const body = document.body;
    const isHighContrast = body.classList.contains('high-contrast');
    
    if (isHighContrast) {
        body.classList.remove('high-contrast');
    } else {
        body.classList.add('high-contrast');
    }
    
    // 설정 저장
    const settings = getSettings();
    settings.highContrast = !isHighContrast;
    saveSettings(settings);
}

/**
 * 폰트 크기 조정
 * @param {string} size - 크기 ('small', 'medium', 'large')
 */
function setFontSize(size) {
    const root = document.documentElement;
    const sizes = {
        small: '14px',
        medium: '16px',
        large: '18px'
    };
    
    if (sizes[size]) {
        root.style.setProperty('--base-font-size', sizes[size]);
        
        // 설정 저장
        const settings = getSettings();
        settings.fontSize = size;
        saveSettings(settings);
    }
}

// === Helper Functions ===

function getSettings() {
    if (window.MapleState) {
        return window.MapleState.getState('settings') || {};
    } else {
        // Fallback
        try {
            const saved = localStorage.getItem('mapleThemeSettings');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }
}

function saveSettings(settings) {
    if (window.MapleState) {
        window.MapleState.updateSettings(settings);
    } else {
        // Fallback
        try {
            localStorage.setItem('mapleThemeSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('설정 저장 실패:', error);
        }
    }
}

// 전역 함수로 노출 (HTML에서 호출)
window.toggleDarkMode = toggleDarkMode;

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeThemes,
        toggleDarkMode,
        setTheme,
        getCurrentThemeInfo,
        createThemePreset,
        applyCustomTheme,
        setThemeTransitions,
        toggleHighContrast,
        setFontSize,
        THEMES
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleThemes = {
        initializeThemes,
        toggleDarkMode,
        setTheme,
        getCurrentThemeInfo,
        createThemePreset,
        applyCustomTheme,
        setThemeTransitions,
        toggleHighContrast,
        setFontSize,
        THEMES
    };
}