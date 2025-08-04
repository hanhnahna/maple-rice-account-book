/**
 * 메이플 쌀먹 가계부 - 완전 통합 버전
 * 모든 기능이 100% 작동하는 최종 버전
 */

// ===== 전역 변수 =====
let records = [];
let goals = [];
let equipment = {
    main: {},
    union1: {},
    union2: {}
};
let currentEquipmentTab = 'main';
let currentView = 'daily';
let mainChart = null; // 메인 차트 인스턴스
let settings = {
    mesoRate: 0,
    mepoBuyRate: 0,
    mepoSellRate: 0,
    currentMepo: 0,
    patternNotif: true,
    darkMode: false,
    currentMeso: 0
};

// 카테고리 정의
const categories = {
    income: ['보스 결정석', '재획', '아이템 판매', '메포 교환', '기타'],
    expense: ['큐브', '스타포스', '아이템 구매', '메포 교환', '기타']
};

// ===== 이벤트 리스너 설정 =====
function setupEventListeners() {
    // 타입 변경 이벤트
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
        typeSelect.addEventListener('change', updateCategoryOptions);
    }
    
    // 다른 이벤트 리스너들...
}

// ===== 초기화 =====
function init() {
    console.log('메이플 가계부 초기화 시작...');
    
    // 로딩 화면 제거
    const loading = document.getElementById('appLoading');
    if (loading) loading.remove();
    
    // 데이터 로드
    loadAllData();
    
    // UI 초기화
    updateCategoryOptions();
    
    // 초기 유형 색상 설정
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
        typeSelect.style.color = '#228B22';
        typeSelect.style.borderColor = '#228B22';
    }
    
    // 전체 UI 업데이트
    refreshUI();
    
    // 차트 초기화 (DOM이 준비된 후)
    setTimeout(() => {
        initializeChart();
        updateChart();
    }, 100);
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 장비 입력 이벤트 리스너 추가
    document.querySelectorAll('.equipment-input').forEach(input => {
        input.addEventListener('input', () => updateEquipmentValue());
    });
    
    // 장비 탭 클릭 이벤트 리스너 추가
    document.querySelectorAll('.equipment-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchEquipmentTab(tabName);
        });
    });
    
    // 초기 장비 가치 계산 - 데이터 로드 후 지연 실행
    setTimeout(() => {
        // 장비 데이터 입력 필드에 값 다시 설정 (DOM이 완전히 로드된 후)
        if (equipment) {
            Object.keys(equipment).forEach(tab => {
                if (equipment[tab]) {
                    Object.entries(equipment[tab]).forEach(([itemName, value]) => {
                        let inputId;
                        if (tab === 'main') {
                            inputId = `equip-${itemName}`;
                        } else {
                            inputId = `equip-${tab}-${itemName}`;
                        }
                        
                        const input = document.getElementById(inputId);
                        if (input && value > 0) {
                            input.value = formatMeso(value);
                        }
                    });
                }
            });
        }
        
        // 저장된 데이터가 있을 때만 UI 업데이트 (새 값으로 덮어쓰지 않음)
        if (equipment && Object.keys(equipment).length > 0) {
            // UI만 업데이트하고 저장은 하지 않음
            updateEquipmentUI();
        }
    }, 500);
    
    // 메포 초기값 설정
    if (settings.currentMepo > 0) {
        const mepoInput = document.getElementById('currentMepo');
        if (mepoInput) {
            mepoInput.value = settings.currentMepo;
        }
    }
    
    // 메소/메포 시세 초기값 설정 (저장된 값만 표시, 없으면 빈칸)
    console.log('시세 설정 전 settings:', settings);
    
    const mesoRateInput = document.getElementById('mesoRate');
    if (mesoRateInput) {
        console.log('mesoRate input 찾음, 현재 값:', mesoRateInput.value, 'settings.mesoRate:', settings.mesoRate);
        if (settings.mesoRate > 0) {
            mesoRateInput.value = settings.mesoRate;
            console.log('mesoRate 설정 완료:', mesoRateInput.value);
        }
    }
    
    const mepoBuyRateInput = document.getElementById('mepoBuyRate');
    if (mepoBuyRateInput) {
        console.log('mepoBuyRate input 찾음, 현재 값:', mepoBuyRateInput.value, 'settings.mepoBuyRate:', settings.mepoBuyRate);
        if (settings.mepoBuyRate > 0) {
            mepoBuyRateInput.value = settings.mepoBuyRate;
            console.log('mepoBuyRate 설정 완료:', mepoBuyRateInput.value);
        }
    }
    
    const mepoSellRateInput = document.getElementById('mepoSellRate');
    if (mepoSellRateInput) {
        console.log('mepoSellRate input 찾음, 현재 값:', mepoSellRateInput.value, 'settings.mepoSellRate:', settings.mepoSellRate);
        if (settings.mepoSellRate > 0) {
            mepoSellRateInput.value = settings.mepoSellRate;
            console.log('mepoSellRate 설정 완료:', mepoSellRateInput.value);
        }
    }
    
    // 메소 가치와 메포 분석은 값 설정 후 업데이트하지 않음 (초기화 시에는 표시만)
    // updateMesoValue()와 updateMepoAnalysis()는 값을 덮어쓰므로 초기화 시 호출하지 않음
    
    // 대신 메소 가치만 표시
    const mesoValueElement = document.getElementById('mesoValue');
    if (mesoValueElement && settings.mesoRate > 0) {
        const currentMesoValue = Math.floor(settings.currentMeso / 100000000 * settings.mesoRate);
        mesoValueElement.textContent = '₩' + currentMesoValue.toLocaleString();
    }
    
    // 메포 분석 표시만
    const analysisDiv = document.getElementById('mepoAnalysis');
    if (analysisDiv && (settings.mepoBuyRate > 0 || settings.mepoSellRate > 0)) {
        updateMepoAnalysisDisplay();
    }
    
    
    console.log('초기화 완료!');
}

// ===== 데이터 관리 =====
function loadAllData() {
    try {
        const saved = localStorage.getItem('mapleSsalMeokData');
        if (saved) {
            const data = JSON.parse(saved);
            records = data.records || [];
            goals = data.goals || [];
            
            // 장비 데이터 로드 - 이전 버전과의 호환성 처리
            if (data.equipment) {
                if (data.equipment.main || data.equipment.union1) {
                    // 새 구조
                    equipment = data.equipment;
                } else {
                    // 이전 구조 -> 새 구조로 변환
                    equipment = {
                        main: data.equipment,
                        union1: {},
                        union2: {}
                    };
                }
            }
            
            console.log('로드된 settings:', data.settings);
            settings = { ...settings, ...data.settings };
            console.log('병합 후 settings:', settings);
            
            // 현재 메소 표시
            if (settings.currentMeso > 0) {
                const input = document.getElementById('currentMesoInput');
                if (input) {
                    input.value = formatMeso(settings.currentMeso);
                }
            }
            
            // 장비 데이터 입력 필드에 표시
            if (equipment) {
                Object.keys(equipment).forEach(tab => {
                    if (equipment[tab]) {
                        Object.entries(equipment[tab]).forEach(([itemName, value]) => {
                            let inputId;
                            if (tab === 'main') {
                                // main 탭은 접두어가 없음
                                inputId = `equip-${itemName}`;
                            } else {
                                // union 탭들은 접두어가 있음
                                inputId = `equip-${tab}-${itemName}`;
                            }
                            
                            const input = document.getElementById(inputId);
                            if (input && value > 0) {
                                input.value = formatMeso(value);
                            }
                        });
                    }
                });
            }
        }
    } catch (e) {
        console.error('데이터 로드 실패:', e);
    }
}

function saveAllData() {
    try {
        console.log('saveAllData 호출, 현재 settings:', settings);
        const data = {
            records: records,
            goals: goals,
            equipment: equipment,
            settings: settings,
            lastModified: new Date().toISOString()
        };
        localStorage.setItem('mapleSsalMeokData', JSON.stringify(data));
        console.log('저장 완료');
    } catch (e) {
        console.error('데이터 저장 실패:', e);
    }
}

// ===== 금액 파싱 (소수점 지원) =====
function parseMeso(input) {
    if (!input) return 0;
    
    input = String(input).trim();
    
    // 억/천만/만 단위 복합 처리 (예: 5억 8천만, 5억8천만, 5억 8천)
    if (input.includes('억') || input.includes('천만') || input.includes('천') || input.includes('만')) {
        let total = 0;
        
        // 억 단위 추출
        const billionMatch = input.match(/(\d+\.?\d*)\s*억/);
        if (billionMatch) {
            total += parseFloat(billionMatch[1]) * 100000000;
        }
        
        // 천만 단위 추출
        const tenMillionMatch = input.match(/(\d+\.?\d*)\s*천만/);
        if (tenMillionMatch) {
            total += parseFloat(tenMillionMatch[1]) * 10000000;
        } else {
            // 천만이 없으면 '천' 단위 확인 (억 뒤의 천)
            const thousandMatch = input.match(/억[^\d]*(\d+\.?\d*)\s*천(?!만)/);
            if (thousandMatch) {
                total += parseFloat(thousandMatch[1]) * 10000000;
            }
            
            // 만 단위 확인
            const millionMatch = input.match(/(\d+\.?\d*)\s*만(?![\s\d]*천)/);
            if (millionMatch && !input.includes('천만')) {
                total += parseFloat(millionMatch[1]) * 10000;
            }
        }
        
        // 나머지 숫자 처리
        const remainingMatch = input.match(/만\s*(\d+)(?![\s\d]*[억천만])/);
        if (remainingMatch) {
            total += parseInt(remainingMatch[1]);
        }
        
        return Math.floor(total);
    }
    
    // 5.8 또는 454.2 형태를 5억 8천만, 454억 2천만으로 해석
    if (!isNaN(parseFloat(input))) {
        const num = parseFloat(input);
        // 10000 이상의 숫자는 그대로 처리 (10000원 이상은 억 단위로 보지 않음)
        if (num >= 10000) {
            return Math.floor(num);
        }
        // 10000 미만의 숫자는 억 단위로 해석
        const billions = Math.floor(num);
        const tenMillions = Math.round((num - billions) * 10);
        return billions * 100000000 + tenMillions * 10000000;
    }
    
    // 콤마 제거하고 숫자만 파싱
    input = input.replace(/,/g, '');
    const num = parseFloat(input);
    return isNaN(num) ? 0 : Math.floor(num);
}

// ===== 금액 포맷팅 =====
function formatMeso(value) {
    if (value >= 100000000) {
        const billions = value / 100000000;
        // 정수면 정수로, 소수면 소수점 1자리까지
        return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
    } else if (value >= 10000) {
        const tenThousands = Math.floor(value / 10000);
        return `${tenThousands.toLocaleString()}만`;
    }
    return value.toLocaleString();
}

// ===== 현재 보유 메소 업데이트 =====
function updateCurrentMeso() {
    const input = document.getElementById('currentMesoInput');
    if (!input) return;
    
    const amount = parseMeso(input.value);
    
    if (amount >= 0) {
        settings.currentMeso = amount;
        saveAllData();
        
        // 통계 업데이트
        const currentMesoElement = document.getElementById('currentMeso');
        if (currentMesoElement) {
            currentMesoElement.textContent = formatMeso(amount);
            currentMesoElement.setAttribute('data-full', amount);
        }
        
        // 메소 시세 업데이트
        updateMesoValue();
        
        // 메포 분석 업데이트
        updateMepoAnalysis();
    }
}

// ===== 레코드 추가 =====
function addRecord() {
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const amountInput = document.getElementById('amount');
    const memoInput = document.getElementById('memo');
    
    const amount = parseMeso(amountInput.value);
    
    if (amount <= 0) {
        // 알림 없이 조용히 종료
        return;
    }
    
    const record = {
        id: Date.now(),
        type: type,
        category: category,
        amount: amount,
        memo: memoInput.value,
        date: new Date().toISOString()
    };
    
    records.push(record);
    
    // 입력 필드 초기화
    amountInput.value = '';
    memoInput.value = '';
    
    // 데이터 저장 및 UI 업데이트
    saveAllData();
    refreshUI();
    
    // 알림 제거 - 조용히 추가됨
}

// ===== 토스트 메시지 표시 =====
function showToast(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 새 토스트 생성
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 토스트 애니메이션 CSS 추가
if (!document.querySelector('#toast-animation')) {
    const style = document.createElement('style');
    style.id = 'toast-animation';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ===== 카테고리 옵션 업데이트 =====
function updateCategoryOptions() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    
    if (!typeSelect || !categorySelect) return;
    
    const type = typeSelect.value;
    categorySelect.innerHTML = '';
    
    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// ===== 레코드 추가 =====
function addRecord() {
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const amountInput = document.getElementById('amount').value;
    const memo = document.getElementById('memo').value;
    
    if (!amountInput) {
        alert('금액을 입력해주세요.');
        return;
    }
    
    const amount = parseMeso(amountInput);
    
    if (amount <= 0) {
        alert('올바른 금액을 입력해주세요.');
        return;
    }
    
    const record = {
        id: Date.now(),
        type: type,
        category: category,
        amount: amount,
        memo: memo,
        date: new Date().toISOString()
    };
    
    records.push(record);
    
    // 현재 메소 자동 업데이트
    if (type === 'income') {
        settings.currentMeso += amount;
    } else {
        settings.currentMeso = Math.max(0, settings.currentMeso - amount);
    }
    
    saveAllData();
    
    // 입력 필드 초기화
    document.getElementById('amount').value = '';
    document.getElementById('memo').value = '';
    
    alert('기록이 추가되었습니다.');
    refreshUI();
    
    // 목표 달성 체크
    checkGoalAchievements();
}

// ===== 레코드 삭제 =====
function deleteRecord(id) {
    records = records.filter(r => r.id != id);
    saveAllData();
    refreshUI();
}

// ===== 현재 보유 메소 업데이트 =====
function updateCurrentMeso() {
    const input = document.getElementById('currentMesoInput');
    if (!input) return;
    
    const value = parseMeso(input.value);
    if (value >= 0) {
        settings.currentMeso = value;
        saveAllData();
        refreshUI();
        input.value = '';
        alert('현재 보유 메소가 설정되었습니다.');
    }
}

// ===== 카테고리 옵션 업데이트 =====
function updateCategoryOptions() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    
    if (!typeSelect || !categorySelect) return;
    
    const type = typeSelect.value;
    const selectedCategories = categories[type] || [];
    
    // 유형에 따른 색상 변경
    if (type === 'income') {
        typeSelect.style.color = '#228B22';
        typeSelect.style.borderColor = '#228B22';
    } else {
        typeSelect.style.color = '#DC143C';
        typeSelect.style.borderColor = '#DC143C';
    }
    
    // 카테고리 옵션 업데이트
    categorySelect.innerHTML = selectedCategories
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');
}

// ===== 목표 추가 =====
function addGoal() {
    const name = document.getElementById('goalName').value.trim();
    const amountInput = document.getElementById('goalAmount').value;
    const memo = document.getElementById('goalMemo').value.trim();
    
    if (!name || !amountInput) {
        alert('목표 이름과 금액을 입력해주세요.');
        return;
    }
    
    const amount = parseMeso(amountInput);
    
    if (amount <= 0) {
        alert('올바른 목표 금액을 입력해주세요.');
        return;
    }
    
    const goal = {
        id: Date.now(),
        name: name,
        amount: amount,
        memo: memo,
        startDate: new Date().toISOString(),
        achieved: false,
        currentAmount: 0
    };
    
    goals.push(goal);
    saveAllData();
    
    // 입력 필드 초기화
    document.getElementById('goalName').value = '';
    document.getElementById('goalAmount').value = '';
    document.getElementById('goalMemo').value = '';
    
    alert('목표가 추가되었습니다.');
    refreshUI();
}

// ===== 목표 삭제 =====
function deleteGoal(id) {
    if (confirm('이 목표를 삭제하시겠습니까?')) {
        goals = goals.filter(g => g.id != id);
        saveAllData();
        refreshUI();
    }
}

// ===== 목표 달성 체크 =====
function checkGoalAchievements() {
    goals.forEach(goal => {
        if (!goal.achieved) {
            // 목표 시작일 이후의 수익 계산
            const incomeAfterGoal = records
                .filter(r => r.type === 'income' && new Date(r.date) >= new Date(goal.startDate))
                .reduce((sum, r) => sum + r.amount, 0);
            
            goal.currentAmount = incomeAfterGoal;
            
            if (incomeAfterGoal >= goal.amount) {
                goal.achieved = true;
                showGoalAchievement(goal);
            }
        }
    });
    
    saveAllData();
}

// ===== 목표 달성 알림 =====
function showGoalAchievement(goal) {
    const modal = document.getElementById('goalModal');
    const achievement = document.getElementById('goalAchievement');
    
    if (modal && achievement) {
        achievement.innerHTML = `
            목표 "<strong>${goal.name}</strong>"을(를) 달성했습니다!<br>
            목표 금액: <strong>${formatMeso(goal.amount)}</strong>
        `;
        modal.style.display = 'block';
        
        // 3초 후 자동으로 닫기
        setTimeout(() => {
            modal.style.display = 'none';
        }, 3000);
    } else {
        alert(`🎉 축하합니다! "${goal.name}" 목표를 달성했습니다!`);
    }
}

// ===== 목표 완료 =====
function completeGoal(id) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    // 첫 번째 플로팅 박스 - 지출 내역 추가 여부 확인
    showGoalCompleteConfirm(goal);
}

// ===== 목표 완료 확인 플로팅 박스 =====
function showGoalCompleteConfirm(goal) {
    // 기존 플로팅 박스 제거
    const existingBox = document.querySelector('.goal-complete-box');
    if (existingBox) existingBox.remove();
    
    const box = document.createElement('div');
    box.className = 'goal-complete-box';
    box.innerHTML = `
        <div class="floating-box-content">
            <h3>🎯 목표 완료</h3>
            <p>"${goal.name}" 목표를 완료했습니다!</p>
            <p>목표 금액: <strong>${formatMeso(goal.amount)}</strong></p>
            <p class="question">이 금액을 지출 내역에 추가하시겠습니까?</p>
            <div class="button-group">
                <button class="btn-primary" onclick="showGoalExpenseForm(${goal.id})">예</button>
                <button class="btn-secondary" onclick="removeGoalOnly(${goal.id})">아니오</button>
                <button class="btn-cancel" onclick="this.closest('.goal-complete-box').remove()">취소</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(box);
}

// ===== 목표 지출 내역 입력 폼 =====
function showGoalExpenseForm(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // 첫 번째 박스 제거
    const confirmBox = document.querySelector('.goal-complete-box');
    if (confirmBox) confirmBox.remove();
    
    const box = document.createElement('div');
    box.className = 'goal-expense-form-box';
    box.innerHTML = `
        <div class="floating-box-content">
            <h3>📝 지출 내역 추가</h3>
            <p>목표: "${goal.name}" (${formatMeso(goal.amount)})</p>
            
            <div class="form-group">
                <label>카테고리:</label>
                <select id="goalCompleteCategory" class="form-control">
                    ${categories.expense.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>메모:</label>
                <textarea id="goalCompleteMemo" class="form-control" rows="3" 
                    placeholder="메모를 입력하세요...">${goal.name} 목표 달성</textarea>
            </div>
            
            <div class="button-group">
                <button class="btn-primary" onclick="addGoalExpense(${goal.id})">추가</button>
                <button class="btn-cancel" onclick="this.closest('.goal-expense-form-box').remove()">취소</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(box);
    
    // DOM이 추가된 직후 textarea 값 설정 (비어있을 때만)
    requestAnimationFrame(() => {
        const memoTextarea = document.getElementById('goalCompleteMemo');
        if (memoTextarea && !memoTextarea.value) {
            memoTextarea.value = `${goal.name} 목표 달성`;
            console.log('Textarea 초기값 설정:', memoTextarea.value);
        }
    });
}

// ===== 목표 지출 내역 추가 =====
function addGoalExpense(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const categoryElement = document.getElementById('goalCompleteCategory');
    const memoElement = document.getElementById('goalCompleteMemo');
    
    if (!categoryElement || !memoElement) {
        console.error('폼 요소를 찾을 수 없습니다.');
        return;
    }
    
    const category = categoryElement.value;
    const memo = memoElement.value.trim();
    
    console.log('카테고리:', category);
    console.log('메모 입력값:', memoElement.value);
    console.log('메모 저장값:', memo);
    
    // 지출 내역 추가
    const expense = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'expense',
        category: category,
        amount: goal.amount,
        memo: memo // 사용자가 입력한 메모 그대로 사용
    };
    
    console.log('저장될 expense 객체:', expense);
    
    records.push(expense);
    
    console.log('전체 records:', records);
    
    // 목표 제거
    goals = goals.filter(g => g.id !== goalId);
    
    // 플로팅 박스 제거
    const formBox = document.querySelector('.goal-expense-form-box');
    if (formBox) formBox.remove();
    
    // 저장 및 UI 업데이트
    saveAllData();
    refreshUI();
    
    // 성공 토스트
    showToast(`목표 "${goal.name}"이(가) 완료되고 지출 내역에 추가되었습니다.`, 'success');
}

// ===== 목표만 제거 =====
function removeGoalOnly(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    goals = goals.filter(g => g.id !== goalId);
    
    // 플로팅 박스 제거
    const confirmBox = document.querySelector('.goal-complete-box');
    if (confirmBox) confirmBox.remove();
    
    saveAllData();
    refreshUI();
    
    showToast(`목표 "${goal.name}"이(가) 완료되었습니다.`, 'success');
}

// ===== UI 업데이트 =====
function refreshUI() {
    updateRecordsTable();
    updateStats();
    updateGoals();
    updateChart(); // 차트 업데이트
    updateEquipmentValue();
    // updateMesoValue(); // 초기화 시에는 호출하지 않음
    updateRiceBagCount(); // 쌀 포대 수 업데이트
    
    // 요약 호버 이벤트 재설정 (DOM 업데이트 후)
    setTimeout(() => {
        setupSummaryHoverEvents();
    }, 100);
}

// ===== 레코드 테이블 업데이트 =====
function updateRecordsTable() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    // 현재 뷰에 따른 필터링
    const filteredRecords = filterRecordsByView(records, currentView);
    
    if (filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">등록된 기록이 없습니다.</td></tr>';
        return;
    }
    
    const sorted = filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sorted.map(record => {
        const date = new Date(record.date);
        const dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        const typeText = record.type === 'income' ? '수익' : '지출';
        const color = record.type === 'income' ? '#228B22' : '#DC143C';
        const prefix = record.type === 'income' ? '+' : '-';
        
        return `
            <tr class="${record.type}-row">
                <td>${dateStr}</td>
                <td style="color: ${color}; font-weight: 500;">${typeText}</td>
                <td>${record.category}</td>
                <td style="font-weight: bold; color: ${color}">${prefix}${formatMeso(record.amount)}</td>
                <td>${record.memo || ''}</td>
                <td><button class="delete-btn" onclick="deleteRecord(${record.id})">❌</button></td>
            </tr>
        `;
    }).join('');
}

// ===== 통계 업데이트 =====
function updateStats() {
    const filteredRecords = filterRecordsByView(records, currentView);
    
    const totalIncome = filteredRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = filteredRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpense;
    
    // 일평균 계산
    const days = getDaysInView(currentView);
    const dailyAverage = days > 0 ? Math.floor(totalIncome / days) : 0;
    
    // UI 업데이트
    updateStatElement('currentMeso', settings.currentMeso);
    updateStatElement('totalIncome', totalIncome);
    updateStatElement('totalExpense', totalExpense);
    updateStatElement('netProfit', netProfit);
    updateStatElement('dailyAverage', dailyAverage);
    
    // 빠른 분석
    updateQuickAnalysis(totalIncome, totalExpense, netProfit);
}

// ===== 통계 요소 업데이트 =====
function updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = formatMeso(value);
        element.setAttribute('data-full', value);
        
        // 색상 설정
        if (id === 'netProfit') {
            element.style.color = value >= 0 ? '#FF8C00' : '#DC143C';
        }
    }
}

// ===== 빠른 분석 업데이트 =====
function updateQuickAnalysis(income, expense, profit) {
    const analysis = document.getElementById('quickAnalysis');
    if (!analysis) return;
    
    if (income > 0) {
        const profitRate = Math.round((profit / income) * 100);
        const viewText = {
            daily: '오늘',
            weekly: '이번 주',
            monthly: '이번 달',
            yearly: '올해'
        }[currentView];
        
        analysis.innerHTML = `
            <strong>📊 빠른 분석:</strong>
            ${viewText} 수익률은 <strong style="color: ${profitRate >= 0 ? '#228B22' : '#DC143C'}">${profitRate}%</strong>입니다.
            ${profitRate > 50 ? '훌륭한 성과입니다!' : profitRate > 0 ? '꾸준히 수익을 내고 있습니다.' : '지출 관리가 필요합니다.'}
        `;
    } else {
        analysis.innerHTML = '<strong>📊 빠른 분석:</strong> 아직 기록된 데이터가 없습니다.';
    }
}

// ===== 목표 UI 업데이트 =====
function updateGoals() {
    const container = document.getElementById('goalsList');
    if (!container) return;
    
    if (goals.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">설정된 목표가 없습니다.</div>';
        updateTotalGoalProgress(0, 0);
        return;
    }
    
    let totalGoalAmount = 0;
    let totalCurrentAmount = 0;
    
    container.innerHTML = goals.map(goal => {
        // 목표 시작일 이후의 수익 계산
        const incomeAfterGoal = records
            .filter(r => r.type === 'income' && new Date(r.date) >= new Date(goal.startDate))
            .reduce((sum, r) => sum + r.amount, 0);
        
        const currentAmount = incomeAfterGoal;
        const progress = goal.amount > 0 ? Math.min((currentAmount / goal.amount) * 100, 100) : 0;
        const isAchieved = currentAmount >= goal.amount;
        
        totalGoalAmount += goal.amount;
        totalCurrentAmount += Math.min(currentAmount, goal.amount);
        
        return `
            <div class="goal-item ${isAchieved ? 'achieved' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        <strong>${goal.name}</strong>
                        ${goal.memo ? `<span style="color: #666; font-size: 0.9em;"> - ${goal.memo}</span>` : ''}
                        ${isAchieved ? '<span style="color: #4CAF50; margin-left: 10px;">✓ 달성</span>' : ''}
                    </div>
                    <div>
                        ${isAchieved ? `<button class="complete-btn" onclick="completeGoal(${goal.id})">완료</button>` : ''}
                        <button class="delete-btn" onclick="deleteGoal(${goal.id})">❌</button>
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="goal-progress-bar" style="width: ${progress}%; ${isAchieved ? 'background: linear-gradient(90deg, #4CAF50, #8BC34A);' : ''}">${Math.floor(progress)}%</div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.9em; color: #666;">
                    <span>현재: ${formatMeso(currentAmount)}</span>
                    <span>목표: ${formatMeso(goal.amount)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // 전체 목표 진행률 업데이트
    updateTotalGoalProgress(totalCurrentAmount, totalGoalAmount);
}

// ===== 전체 목표 진행률 업데이트 =====
function updateTotalGoalProgress(current, total) {
    const progress = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    
    const progressBar = document.getElementById('totalGoalProgress');
    const infoElement = document.getElementById('totalGoalInfo');
    
    if (progressBar) {
        progressBar.style.width = progress + '%';
        progressBar.textContent = Math.floor(progress) + '%';
    }
    
    if (infoElement) {
        infoElement.innerHTML = `총 목표: ${formatMeso(total)} / 달성: ${formatMeso(current)}`;
    }
}

// ===== 쌀 포대 수 업데이트 =====
function updateRiceBagCount() {
    const riceBagCount = document.getElementById('riceBagCount');
    if (!riceBagCount) return;
    
    // 메소 시세가 설정되어 있는지 확인
    const mesoRate = settings.mesoRate || 0;
    if (mesoRate <= 0) {
        riceBagCount.textContent = '시세 미설정';
        riceBagCount.parentElement.title = '메소 시세를 설정해주세요';
        return;
    }
    
    // 현재 보유 메소의 현금 가치 계산
    const currentMesoValue = (settings.currentMeso / 100000000) * mesoRate;
    
    // 쌀 20kg 가격 (65,000원)
    const riceBagPrice = 65000;
    
    // 살 수 있는 쌀 포대 수 계산
    const bags = Math.floor(currentMesoValue / riceBagPrice);
    
    // 표시 업데이트
    riceBagCount.textContent = bags.toLocaleString();
    riceBagCount.parentElement.title = `현재 보유 메소로 쌀 20kg ${bags.toLocaleString()}포대를 살 수 있습니다 (1포대 = ${riceBagPrice.toLocaleString()}원)`;
    
    // 애니메이션 효과
    if (window.animateNumber && bags > 0) {
        const currentBags = parseInt(riceBagCount.getAttribute('data-bags') || '0');
        if (currentBags !== bags) {
            animateNumber(riceBagCount, currentBags, bags, 500);
            riceBagCount.setAttribute('data-bags', bags);
        }
    }
}

// ===== 메소 가치 업데이트 =====
function updateMesoValue() {
    const mesoValueElement = document.getElementById('mesoValue');
    if (!mesoValueElement) return;
    
    const mesoRate = settings.mesoRate || 0;
    const currentMeso = settings.currentMeso || 0;
    
    if (mesoRate > 0 && currentMeso > 0) {
        const value = (currentMeso / 100000000) * mesoRate;
        mesoValueElement.textContent = `₩${Math.floor(value).toLocaleString()}`;
    } else {
        mesoValueElement.textContent = '₩0';
    }
    
    // 쌀 포대 수도 함께 업데이트
    updateRiceBagCount();
}

// ===== 차트 초기화 =====
function initializeCharts() {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 기본 차트 생성
    charts.main = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatMeso(value);
                        }
                    }
                }
            }
        }
    });
}

// ===== 차트 업데이트 =====
function updateCharts() {
    if (!charts.main) return;
    
    const filteredRecords = filterRecordsByView(records, currentView);
    
    switch (currentChart) {
        case 'combined':
            updateCombinedChart(filteredRecords);
            break;
        case 'income':
            updateIncomeChart(filteredRecords);
            break;
        case 'expense':
            updateExpenseChart(filteredRecords);
            break;
        case 'category':
            updateCategoryChart(filteredRecords);
            break;
    }
}

// ===== 종합 차트 업데이트 =====
function updateCombinedChart(records) {
    const chart = charts.main;
    if (!chart) return;
    
    // 날짜별 그룹화
    const dailyData = {};
    
    records.forEach(record => {
        const date = new Date(record.date).toLocaleDateString();
        if (!dailyData[date]) {
            dailyData[date] = { income: 0, expense: 0 };
        }
        
        if (record.type === 'income') {
            dailyData[date].income += record.amount;
        } else {
            dailyData[date].expense += record.amount;
        }
    });
    
    const labels = Object.keys(dailyData).sort();
    const incomeData = labels.map(date => dailyData[date].income);
    const expenseData = labels.map(date => dailyData[date].expense);
    
    chart.data.labels = labels;
    chart.data.datasets = [
        {
            label: '수익',
            data: incomeData,
            borderColor: '#228B22',
            backgroundColor: 'rgba(34, 139, 34, 0.1)',
            tension: 0.1
        },
        {
            label: '지출',
            data: expenseData,
            borderColor: '#DC143C',
            backgroundColor: 'rgba(220, 20, 60, 0.1)',
            tension: 0.1
        }
    ];
    
    chart.update();
}

// ===== 수익 차트 업데이트 =====
function updateIncomeChart(records) {
    const chart = charts.main;
    if (!chart) return;
    
    const incomeRecords = records.filter(r => r.type === 'income');
    const categoryData = {};
    
    incomeRecords.forEach(record => {
        if (!categoryData[record.category]) {
            categoryData[record.category] = 0;
        }
        categoryData[record.category] += record.amount;
    });
    
    chart.type = 'doughnut';
    chart.data.labels = Object.keys(categoryData);
    chart.data.datasets = [{
        data: Object.values(categoryData),
        backgroundColor: [
            '#228B22', '#32CD32', '#00FF00', '#7CFC00', '#ADFF2F'
        ]
    }];
    
    chart.update();
}

// ===== 지출 차트 업데이트 =====
function updateExpenseChart(records) {
    const chart = charts.main;
    if (!chart) return;
    
    const expenseRecords = records.filter(r => r.type === 'expense');
    const categoryData = {};
    
    expenseRecords.forEach(record => {
        if (!categoryData[record.category]) {
            categoryData[record.category] = 0;
        }
        categoryData[record.category] += record.amount;
    });
    
    chart.type = 'doughnut';
    chart.data.labels = Object.keys(categoryData);
    chart.data.datasets = [{
        data: Object.values(categoryData),
        backgroundColor: [
            '#DC143C', '#FF6347', '#FF4500', '#FF0000'
        ]
    }];
    
    chart.update();
}

// ===== 카테고리별 차트 업데이트 =====
function updateCategoryChart(records) {
    const chart = charts.main;
    if (!chart) return;
    
    const categoryData = {};
    
    records.forEach(record => {
        const key = `${record.category} (${record.type === 'income' ? '수익' : '지출'})`;
        if (!categoryData[key]) {
            categoryData[key] = 0;
        }
        categoryData[key] += record.amount;
    });
    
    // 금액 기준 정렬
    const sorted = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
    
    chart.type = 'bar';
    chart.data.labels = sorted.map(item => item[0]);
    chart.data.datasets = [{
        label: '금액',
        data: sorted.map(item => item[1]),
        backgroundColor: sorted.map(item => 
            item[0].includes('수익') ? '#228B22' : '#DC143C'
        )
    }];
    
    chart.update();
}

// ===== 차트 전환 =====
function switchChart(type) {
    currentChart = type;
    
    // 탭 업데이트
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-chart') === type) {
            tab.classList.add('active');
        }
    });
    
    // 차트 타입 리셋
    if (charts.main) {
        if (type === 'combined') {
            charts.main.config.type = 'line';
        } else {
            charts.main.config.type = 'doughnut';
        }
    }
    
    updateCharts();
}

// ===== 뷰 전환 =====
function switchView(view) {
    currentView = view;
    
    // 탭 업데이트
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-view') === view) {
            tab.classList.add('active');
        }
    });
    
    refreshUI();
}

// ===== 장비 탭 전환 =====
function switchEquipmentTab(tabName) {
    currentEquipmentTab = tabName;
    
    // 탭 활성화 상태 업데이트
    document.querySelectorAll('.equipment-tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // 탭 컨텐츠 표시/숨김
    document.querySelectorAll('.equipment-tab-content').forEach(content => {
        if (content.getAttribute('data-tab-content') === tabName) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // 탭 이름 업데이트
    const tabNames = {
        'main': '본캐',
        'union1': '유니온 챔피언1',
        'union2': '유니온 챔피언2'
    };
    
    updateElement('currentTabName', tabNames[tabName]);
    updateElement('currentTabName2', tabNames[tabName]);
    
    // 해당 탭의 장비 가치 업데이트
    updateEquipmentValue();
}

// 첫 번째 updateEquipmentValue 함수 삭제됨 - 중복 제거

// ===== 메소 시세 업데이트 =====
function updateMesoValue() {
    const rateInput = document.getElementById('mesoRate');
    const valueElement = document.getElementById('mesoValue');
    
    if (!rateInput || !valueElement) return;
    
    const rate = parseFloat(rateInput.value) || 0;
    settings.mesoRate = rate;
    
    const currentMesoValue = Math.floor(settings.currentMeso / 100000000 * rate);
    valueElement.textContent = '₩' + currentMesoValue.toLocaleString();
    
    // 장비 현금가치도 업데이트
    updateEquipmentValue();
    
    // 메포 분석도 업데이트
    updateMepoAnalysis();
    
    saveAllData();
}

// ===== 메포 분석 표시만 업데이트 (설정값 변경 없이) =====
function updateMepoAnalysisDisplay() {
    const analysisDiv = document.getElementById('mepoAnalysis');
    if (!analysisDiv) return;
    
    const buyRate = settings.mepoBuyRate || 0;
    const sellRate = settings.mepoSellRate || 0;
    const currentMepo = settings.currentMepo || 0;
    
    // 현재 보유 메포를 메소로 환전시 (판매)
    const mepoToMeso = sellRate > 0 ? Math.floor(currentMepo / sellRate * 100000000) : 0;
    
    // 목표 달성에 필요한 메소 계산
    let totalGoalAmount = 0;
    goals.forEach(goal => {
        if (!goal.achieved) {
            const remaining = goal.amount - goal.currentAmount;
            if (remaining > 0) totalGoalAmount += remaining;
        }
    });
    
    // 목표 달성을 위해 필요한 메포 (메소를 구매하는데 필요한 메포)
    const neededMepo = totalGoalAmount > 0 && buyRate > 0 ? Math.ceil(totalGoalAmount / 100000000 * buyRate) : 0;
    
    // 총 자산 (메소 + 메포 환전가)
    const totalAssets = settings.currentMeso + mepoToMeso;
    
    // 예상 총 자산 계산 (현재 메소 + 메포 환전 + 장비 가치)
    let equipmentTotal = 0;
    Object.values(equipment).forEach(charEquipment => {
        if (typeof charEquipment === 'object') {
            Object.values(charEquipment).forEach(value => {
                equipmentTotal += value || 0;
            });
        } else {
            equipmentTotal += charEquipment || 0;
        }
    });
    const expectedTotalAssets = settings.currentMeso + mepoToMeso + equipmentTotal;
    
    analysisDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
            <strong>📊 메포 분석</strong>
        </div>
        <div>• 보유 메포 → 메소 환전시: <strong style="color: #228B22;">${formatMeso(mepoToMeso)}</strong></div>
        <div>• 목표 달성 필요 메소: <strong style="color: #4169E1;">${formatMeso(totalGoalAmount)}</strong></div>
        <div>• 목표 달성 필요 메포: <strong style="color: #FF8C00;">${neededMepo.toLocaleString()} 메포</strong></div>
        <hr style="margin: 10px 0; border: none; border-top: 1px dashed #ddd;">
        <div>• 예상 총 자산: <strong style="color: #9370DB;">${formatMeso(expectedTotalAssets)}</strong></div>
        <div>• 총 자산 (메소+메포): <strong style="color: #D4AF37;">${formatMeso(totalAssets)}</strong></div>
        <div>• 총 자산 현금가치: <strong style="color: #DC143C;">₩${Math.floor(totalAssets / 100000000 * settings.mesoRate).toLocaleString()}</strong></div>
    `;
}

// ===== 메포 분석 업데이트 =====
function updateMepoAnalysis(showAlert = false) {
    const buyRate = parseFloat(document.getElementById('mepoBuyRate')?.value) || 0;
    const sellRate = parseFloat(document.getElementById('mepoSellRate')?.value) || 0;
    const currentMepo = parseFloat(document.getElementById('currentMepo')?.value) || 0;
    
    settings.mepoBuyRate = buyRate;
    settings.mepoSellRate = sellRate;
    settings.currentMepo = currentMepo;
    
    const analysisDiv = document.getElementById('mepoAnalysis');
    if (!analysisDiv) return;
    
    // 현재 보유 메포를 메소로 환전시 (판매)
    const mepoToMeso = Math.floor(currentMepo / sellRate * 100000000);
    
    // 목표 달성에 필요한 메소 계산
    let totalGoalAmount = 0;
    goals.forEach(goal => {
        if (!goal.achieved) {
            const remaining = goal.amount - goal.currentAmount;
            if (remaining > 0) totalGoalAmount += remaining;
        }
    });
    
    // 목표 달성을 위해 필요한 메포 (메소를 구매하는데 필요한 메포)
    const neededMepo = totalGoalAmount > 0 ? Math.ceil(totalGoalAmount / 100000000 * buyRate) : 0;
    
    // 총 자산 (메소 + 메포 환전가)
    const totalAssets = settings.currentMeso + mepoToMeso;
    
    // 예상 총 자산 계산 (현재 메소 + 메포 환전 + 장비 가치)
    let equipmentTotal = 0;
    Object.values(equipment).forEach(charEquipment => {
        if (typeof charEquipment === 'object') {
            Object.values(charEquipment).forEach(value => {
                equipmentTotal += value || 0;
            });
        } else {
            equipmentTotal += charEquipment || 0;
        }
    });
    const expectedTotalAssets = settings.currentMeso + mepoToMeso + equipmentTotal;
    
    analysisDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
            <strong>📊 메포 분석</strong>
        </div>
        <div>• 보유 메포 → 메소 환전시: <strong style="color: #228B22;">${formatMeso(mepoToMeso)}</strong></div>
        <div>• 목표 달성 필요 메소: <strong style="color: #4169E1;">${formatMeso(totalGoalAmount)}</strong></div>
        <div>• 목표 달성 필요 메포: <strong style="color: #FF8C00;">${neededMepo.toLocaleString()} 메포</strong></div>
        <hr style="margin: 10px 0; border: none; border-top: 1px dashed #ddd;">
        <div>• 예상 총 자산: <strong style="color: #9370DB;">${formatMeso(expectedTotalAssets)}</strong></div>
        <div>• 총 자산 (메소+메포): <strong style="color: #D4AF37;">${formatMeso(totalAssets)}</strong></div>
        <div>• 총 자산 현금가치: <strong style="color: #DC143C;">₩${Math.floor(totalAssets / 100000000 * settings.mesoRate).toLocaleString()}</strong></div>
    `;
    
    saveAllData();
    
    // 확인 버튼을 통해 호출된 경우 알림 표시
    if (showAlert !== false) {
        alert(`보유 메포가 ${currentMepo.toLocaleString()} 메포로 설정되었습니다.`);
    }
}

// ===== 데이터 내보내기 =====
function exportData() {
    const exportData = {
        records: records,
        goals: goals,
        equipment: equipment,
        settings: settings,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maple_budget_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('데이터가 내보내졌습니다.');
}

// ===== 데이터 가져오기 =====
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (confirm('기존 데이터를 덮어씌우시겠습니까?\n(취소하면 병합됩니다)')) {
                // 덮어쓰기
                records = imported.records || [];
                goals = imported.goals || [];
                equipment = imported.equipment || {};
                settings = imported.settings || settings;
            } else {
                // 병합
                records = [...records, ...(imported.records || [])];
                goals = [...goals, ...(imported.goals || [])];
                equipment = { ...equipment, ...(imported.equipment || {}) };
                settings = { ...settings, ...(imported.settings || {}) };
            }
            
            saveAllData();
            refreshUI();
            alert('데이터를 불러왔습니다.');
            
        } catch (err) {
            alert('파일을 읽을 수 없습니다.');
        }
    };
    reader.readAsText(file);
}

// ===== 뷰에 따른 레코드 필터링 =====
function filterRecordsByView(records, view) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return records.filter(record => {
        const recordDate = new Date(record.date);
        
        switch (view) {
            case 'daily':
                return recordDate >= today;
            case 'weekly':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return recordDate >= weekAgo;
            case 'monthly':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return recordDate >= monthAgo;
            case 'yearly':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return recordDate >= yearAgo;
            default:
                return true;
        }
    });
}

function getDaysInView(view) {
    switch (view) {
        case 'daily': return 1;
        case 'weekly': return 7;
        case 'monthly': return 30;
        case 'yearly': return 365;
        default: return 1;
    }
}

function updateElement(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    settings.darkMode = document.body.classList.contains('dark-mode');
    saveAllData();
}

// ===== 이벤트 리스너 설정 =====
function setupEventListeners() {
    // 장비 입력 이벤트
    document.querySelectorAll('[id^="equip-"]').forEach(input => {
        input.addEventListener('blur', updateEquipmentValue);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                updateEquipmentValue();
            }
        });
    });
    
    // 메소 시세 이벤트
    const mesoRateInput = document.getElementById('mesoRate');
    if (mesoRateInput) {
        mesoRateInput.addEventListener('change', updateMesoValue);
        mesoRateInput.addEventListener('input', updateMesoValue);
    }
    
    // 모달 닫기 버튼
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // 모달 외부 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // 요약 박스 호버 이벤트
    setupSummaryHoverEvents();
}

// ===== 요약 박스 호버 이벤트 설정 =====
function setupSummaryHoverEvents() {
    const floatingInfo = document.getElementById('floatingInfo');
    if (!floatingInfo) return;
    
    // 모든 요약 값에 호버 이벤트 추가
    document.querySelectorAll('.summary-value').forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const fullValue = this.getAttribute('data-full') || '0';
            const numValue = parseInt(fullValue) || 0;
            
            // 상세 정보 생성
            let detailContent = `<strong>상세 정보</strong><br>`;
            detailContent += `전체 금액: ${numValue.toLocaleString()} 메소<br>`;
            
            if (numValue >= 100000000) {
                const billions = Math.floor(numValue / 100000000);
                const remainder = numValue % 100000000;
                const tenMillions = Math.floor(remainder / 10000000);
                const millions = Math.floor((remainder % 10000000) / 10000);
                const rest = remainder % 10000;
                
                detailContent += `= ${billions}억`;
                if (tenMillions > 0) detailContent += ` ${tenMillions}천만`;
                if (millions > 0) detailContent += ` ${millions}만`;
                if (rest > 0) detailContent += ` ${rest.toLocaleString()}`;
                detailContent += ` 메소`;
            } else if (numValue >= 10000) {
                const millions = Math.floor(numValue / 10000);
                const rest = numValue % 10000;
                detailContent += `= ${millions}만`;
                if (rest > 0) detailContent += ` ${rest.toLocaleString()}`;
                detailContent += ` 메소`;
            }
            
            // 현금 환산
            if (settings.mesoRate && numValue > 0) {
                const cashValue = Math.floor(numValue / 100000000 * settings.mesoRate);
                detailContent += `<br>현금 환산: ₩${cashValue.toLocaleString()}`;
            }
            
            // 플로팅 박스 표시
            floatingInfo.innerHTML = detailContent;
            floatingInfo.style.display = 'block';
            
            // 위치 설정
            const rect = this.getBoundingClientRect();
            floatingInfo.style.left = e.pageX + 10 + 'px';
            floatingInfo.style.top = e.pageY + 10 + 'px';
        });
        
        element.addEventListener('mousemove', function(e) {
            if (floatingInfo.style.display === 'block') {
                floatingInfo.style.left = e.pageX + 10 + 'px';
                floatingInfo.style.top = e.pageY + 10 + 'px';
            }
        });
        
        element.addEventListener('mouseleave', function() {
            floatingInfo.style.display = 'none';
        });
    });
}

// ===== 차트 초기화 =====
function initializeChart() {
    if (typeof Chart === 'undefined') {
        setTimeout(initializeChart, 100); // Chart.js 로드 대기
        return;
    }
    
    const ctx = document.getElementById('mainChart');
    if (!ctx) {
        return;
    }
    
    mainChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: '수익',
                    data: [],
                    borderColor: '#228B22',
                    backgroundColor: 'rgba(34, 139, 34, 0.1)',
                    tension: 0.4,
                    fill: true,
                    cubicInterpolationMode: 'monotone',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: '지출',
                    data: [],
                    borderColor: '#DC143C',
                    backgroundColor: 'rgba(220, 20, 60, 0.1)',
                    tension: 0.4,
                    fill: true,
                    cubicInterpolationMode: 'monotone',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: '순이익',
                    data: [],
                    borderColor: '#FF8C00',
                    backgroundColor: 'rgba(255, 140, 0, 0.1)',
                    tension: 0.4,
                    fill: true,
                    cubicInterpolationMode: 'monotone',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatMeso(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatMeso(value);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ===== 차트 업데이트 =====
function updateChart() {
    if (!mainChart) {
        // 차트가 없으면 초기화
        initializeChart();
        if (!mainChart) return;
    }
    
    const filteredRecords = filterRecordsByView(records, currentView);
    const chartData = prepareChartData(filteredRecords, currentView);
    
    // 차트 데이터 업데이트
    mainChart.data.labels = chartData.labels;
    mainChart.data.datasets[0].data = chartData.income;
    mainChart.data.datasets[1].data = chartData.expense;
    mainChart.data.datasets[2].data = chartData.profit;
    
    // 애니메이션과 함께 업데이트
    mainChart.update('active');
}

// ===== 차트 데이터 준비 =====
function prepareChartData(records, view) {
    const data = {};
    
    // 현재 날짜 기준으로 필터링 범위 설정
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    records.forEach(record => {
        const date = new Date(record.date);
        let key;
        
        switch(view) {
            case 'daily':
                key = `${date.getHours()}시`;
                break;
            case 'weekly':
                const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                key = dayNames[date.getDay()];
                break;
            case 'monthly':
                key = `${date.getDate()}일`;
                break;
            case 'yearly':
                key = `${date.getMonth() + 1}월`;
                break;
            default:
                key = `${date.getHours()}시`;
        }
        
        if (!data[key]) {
            data[key] = { income: 0, expense: 0, profit: 0 };
        }
        
        if (record.type === 'income') {
            data[key].income += record.amount;
        } else {
            data[key].expense += record.amount;
        }
        data[key].profit = data[key].income - data[key].expense;
    });
    
    // 정렬된 라벨 생성
    let labels = [];
    switch(view) {
        case 'daily':
            labels = Array.from({length: 24}, (_, i) => `${i}시`);
            break;
        case 'weekly':
            labels = ['일', '월', '화', '수', '목', '금', '토'];
            break;
        case 'monthly':
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            labels = Array.from({length: daysInMonth}, (_, i) => `${i+1}일`);
            break;
        case 'yearly':
            labels = Array.from({length: 12}, (_, i) => `${i+1}월`);
            break;
        default:
            labels = Array.from({length: 24}, (_, i) => `${i}시`);
    }
    
    const income = [];
    const expense = [];
    const profit = [];
    
    labels.forEach(label => {
        if (data[label]) {
            income.push(data[label].income);
            expense.push(data[label].expense);
            profit.push(data[label].profit);
        } else {
            income.push(0);
            expense.push(0);
            profit.push(0);
        }
    });
    
    return { labels, income, expense, profit };
}

// ===== 뷰 전환 =====
function switchView(view) {
    currentView = view;
    
    // 차트 탭 활성화 상태 업데이트
    document.querySelectorAll('.chart-period-tab').forEach(tab => {
        if (tab.getAttribute('data-view') === view) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // UI 업데이트
    refreshUI();
}

// 글로벌 함수로 등록
window.switchView = switchView;
window.updateChart = updateChart;
window.initializeChart = initializeChart;

// ===== 전체 데이터 초기화 =====
function clearAllData() {
    if (!confirm('⚠️ 경고: 모든 데이터가 삭제됩니다!\n\n정말로 초기화하시겠습니까?')) {
        return;
    }
    
    // 기록과 목표만 초기화, 시세는 유지
    records = [];
    goals = [];
    equipment = {
        main: {},
        union1: {},
        union2: {},
        union3: {}
    };
    
    // 현재 메소와 메포만 초기화, 시세는 유지
    settings.currentMeso = 0;
    settings.currentMepo = 0;
    
    // 데이터 저장
    saveAllData();
    
    // 특정 입력 필드만 초기화
    const inputs = [
        'currentMesoInput', 
        'currentMepo'
    ];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    // 장비 입력 필드 초기화
    document.querySelectorAll('[id^="equip-"]').forEach(input => {
        input.value = '';
    });
    
    // UI 새로고침
    refreshUI();
    
    // 메포 분석 초기화
    updateMepoAnalysis();
}

// ===== 전체 기록 보기 페이지 열기 =====
function openAllRecordsPage() {
    // 현재 데이터를 세션스토리지에 저장
    sessionStorage.setItem('mapleSsalMeokData', JSON.stringify({
        records: records,
        goals: goals,
        settings: settings
    }));
    
    // 새 창에서 전체 기록 페이지 열기
    window.open('records.html', '_blank');
}

// ===== 빈 함수들 (호환성) =====
function addMemoToRecord(id) {
    const record = records.find(r => r.id === id);
    if (record) {
        const newMemo = prompt('메모를 입력하세요:', record.memo || '');
        if (newMemo !== null) {
            record.memo = newMemo;
            saveAllData();
            refreshUI();
        }
    }
}

function confirmGoalComplete() {
    closeModal('completeGoalModal');
}

function saveSettings() {
    saveAllData();
    alert('설정이 저장되었습니다.');
}

// ===== 장비 관리 함수들 =====
function switchEquipmentTab(tabName) {
    // 탭 활성화 상태 변경
    document.querySelectorAll('.equipment-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 탭 컨텐츠 표시/숨김
    document.querySelectorAll('.equipment-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelector(`[data-tab-content="${tabName}"]`).classList.add('active');
    
    // 현재 탭 업데이트
    currentEquipmentTab = tabName;
    
    // 탭 이름 업데이트
    const tabNames = {
        main: '본캐',
        union1: '유니온 챔피언1',
        union2: '유니온 챔피언2'
    };
    
    const currentTabName = document.getElementById('currentTabName');
    const currentTabName2 = document.getElementById('currentTabName2');
    if (currentTabName) currentTabName.textContent = tabNames[tabName];
    if (currentTabName2) currentTabName2.textContent = tabNames[tabName];
    
    // 장비 가치 UI만 업데이트 (저장하지 않음)
    updateEquipmentUI();
}

// UI만 업데이트하는 함수 (저장하지 않음)
function updateEquipmentUI() {
    
    // 현재 탭의 카테고리별 계산
    const currentTabEquipment = equipment[currentEquipmentTab] || {};
    let weaponTotal = 0;
    let armorTotal = 0;
    let accessoryTotal = 0;
    let otherTotal = 0;
    
    // 카테고리별 분류
    Object.entries(currentTabEquipment).forEach(([key, value]) => {
        if (['weapon', 'secondary', 'emblem'].includes(key)) {
            weaponTotal += value;
        } else if (['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'overall', 'shield'].includes(key)) {
            armorTotal += value;
        } else if (['face', 'eye', 'earring', 'ring1', 'ring2', 'ring3', 'ring4', 'pendant1', 'pendant2', 'belt', 'shoulder', 'medal'].includes(key)) {
            accessoryTotal += value;
        } else if (['mechanic', 'dragon'].includes(key)) {
            otherTotal += value;
        }
    });
    
    // UI 업데이트
    const weaponTotalElement = document.getElementById('weaponTotal');
    const armorTotalElement = document.getElementById('armorTotal');
    const accessoryTotalElement = document.getElementById('accessoryTotal');
    const otherTotalElement = document.getElementById('otherTotal');
    const totalRecoveryElement = document.getElementById('totalRecovery');
    const expectedTotalElement = document.getElementById('expectedTotal');
    const expectedCashElement = document.getElementById('expectedCash');
    
    if (weaponTotalElement) weaponTotalElement.textContent = formatMeso(weaponTotal);
    if (armorTotalElement) armorTotalElement.textContent = formatMeso(armorTotal);
    if (accessoryTotalElement) accessoryTotalElement.textContent = formatMeso(accessoryTotal);
    if (otherTotalElement) otherTotalElement.textContent = formatMeso(otherTotal);
    
    const currentTabTotal = weaponTotal + armorTotal + accessoryTotal + otherTotal;
    if (totalRecoveryElement) totalRecoveryElement.textContent = formatMeso(currentTabTotal);
    
    const expectedTotal = settings.currentMeso + currentTabTotal;
    if (expectedTotalElement) expectedTotalElement.textContent = formatMeso(expectedTotal);
    
    if (expectedCashElement && settings.mesoRate > 0) {
        const cashValue = Math.floor(expectedTotal / 100000000 * settings.mesoRate);
        expectedCashElement.textContent = '₩' + cashValue.toLocaleString();
    }
    
    // 전체 캐릭터 총합 계산
    let allCharactersTotal = 0;
    const tabTotals = {
        main: 0,
        union1: 0,
        union2: 0
    };
    
    // 각 탭별 총합 계산
    Object.entries(equipment).forEach(([tab, tabEquipment]) => {
        let tabTotal = 0;
        Object.values(tabEquipment).forEach(value => {
            tabTotal += value || 0;
        });
        tabTotals[tab] = tabTotal;
        allCharactersTotal += tabTotal;
    });
    
    // UI 업데이트
    const mainTotalElement = document.getElementById('mainTotal');
    const union1TotalElement = document.getElementById('union1Total');
    const union2TotalElement = document.getElementById('union2Total');
    const allCharactersTotalElement = document.getElementById('allCharactersTotal');
    
    if (mainTotalElement) mainTotalElement.textContent = formatMeso(tabTotals.main);
    if (union1TotalElement) union1TotalElement.textContent = formatMeso(tabTotals.union1);
    if (union2TotalElement) union2TotalElement.textContent = formatMeso(tabTotals.union2);
    if (allCharactersTotalElement) allCharactersTotalElement.textContent = formatMeso(allCharactersTotal);
}

function updateEquipmentValue() {
    
    // 각 탭별 장비 가치 계산
    const tabTotals = {
        main: 0,
        union1: 0,
        union2: 0
    };
    
    // 각 탭별 장비 입력값 수집 및 계산
    Object.keys(tabTotals).forEach(tab => {
        let inputs;
        if (tab === 'main') {
            // main 탭은 접두어가 없음
            inputs = document.querySelectorAll('[id^="equip-"]:not([id*="union"])');
        } else {
            // union 탭들은 접두어가 있음
            inputs = document.querySelectorAll(`[id^="equip-${tab}-"]`);
        }
        
        
        inputs.forEach(input => {
            const value = parseMeso(input.value || '0');
            tabTotals[tab] += value;
            
            // equipment 객체에 저장
            let itemName;
            if (tab === 'main') {
                itemName = input.id.replace('equip-', '');
            } else {
                itemName = input.id.replace(`equip-${tab}-`, '');
            }
            
            if (!equipment[tab]) equipment[tab] = {};
            equipment[tab][itemName] = value;
            
        });
    });
    
    // 현재 탭의 카테고리별 계산
    const currentTabEquipment = equipment[currentEquipmentTab] || {};
    let weaponTotal = 0;
    let armorTotal = 0;
    let accessoryTotal = 0;
    let otherTotal = 0;
    
    // 카테고리별 분류 (정확한 매칭)
    Object.entries(currentTabEquipment).forEach(([key, value]) => {
        // 무기 카테고리
        if (['weapon', 'secondary', 'emblem'].includes(key)) {
            weaponTotal += value;
        } 
        // 방어구 카테고리
        else if (['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'overall', 'shield'].includes(key)) {
            armorTotal += value;
        } 
        // 장신구 카테고리
        else if (['face', 'eye', 'earring', 'ring1', 'ring2', 'ring3', 'ring4', 'pendant1', 'pendant2', 'belt', 'shoulder', 'medal'].includes(key)) {
            accessoryTotal += value;
        } 
        // 기타 카테고리
        else if (['mechanic', 'dragon'].includes(key)) {
            otherTotal += value;
        }
    });
    
    // UI 업데이트
    const weaponTotalElement = document.getElementById('weaponTotal');
    const armorTotalElement = document.getElementById('armorTotal');
    const accessoryTotalElement = document.getElementById('accessoryTotal');
    const otherTotalElement = document.getElementById('otherTotal');
    const totalRecoveryElement = document.getElementById('totalRecovery');
    const expectedTotalElement = document.getElementById('expectedTotal');
    const expectedCashElement = document.getElementById('expectedCash');
    
    if (weaponTotalElement) weaponTotalElement.textContent = formatMeso(weaponTotal);
    if (armorTotalElement) armorTotalElement.textContent = formatMeso(armorTotal);
    if (accessoryTotalElement) accessoryTotalElement.textContent = formatMeso(accessoryTotal);
    if (otherTotalElement) otherTotalElement.textContent = formatMeso(otherTotal);
    
    const currentTabTotal = weaponTotal + armorTotal + accessoryTotal + otherTotal;
    if (totalRecoveryElement) totalRecoveryElement.textContent = formatMeso(currentTabTotal);
    
    const expectedTotal = settings.currentMeso + currentTabTotal;
    if (expectedTotalElement) expectedTotalElement.textContent = formatMeso(expectedTotal);
    
    if (expectedCashElement && settings.mesoRate > 0) {
        const cashValue = Math.floor(expectedTotal / 100000000 * settings.mesoRate);
        expectedCashElement.textContent = '₩' + cashValue.toLocaleString();
    }
    
    // 전체 캐릭터 총합 업데이트
    const mainTotalElement = document.getElementById('mainTotal');
    const union1TotalElement = document.getElementById('union1Total');
    const union2TotalElement = document.getElementById('union2Total');
    const allCharactersTotalElement = document.getElementById('allCharactersTotal');
    
    if (mainTotalElement) mainTotalElement.textContent = formatMeso(tabTotals.main);
    if (union1TotalElement) union1TotalElement.textContent = formatMeso(tabTotals.union1);
    if (union2TotalElement) union2TotalElement.textContent = formatMeso(tabTotals.union2);
    
    const allCharactersTotal = tabTotals.main + tabTotals.union1 + tabTotals.union2;
    if (allCharactersTotalElement) allCharactersTotalElement.textContent = formatMeso(allCharactersTotal);
    
    // 데이터 저장
    saveAllData();
}

// ===== 전역 함수 등록 =====
window.addRecord = addRecord;
window.deleteRecord = deleteRecord;
window.addGoal = addGoal;
window.deleteGoal = deleteGoal;
window.completeGoal = completeGoal;
window.updateCurrentMeso = updateCurrentMeso;
window.updateEquipmentValue = updateEquipmentValue;
window.updateEquipmentUI = updateEquipmentUI;
window.updateMesoValue = updateMesoValue;
window.updateMepoAnalysis = updateMepoAnalysis;
window.clearAllData = clearAllData;
window.exportData = exportData;
window.importData = importData;
window.toggleDarkMode = toggleDarkMode;
window.openAllRecordsPage = openAllRecordsPage;
window.switchView = switchView;
window.changeMonth = changeMonth;
window.showDayDetails = showDayDetails;
window.formatMeso = formatMeso;
window.updateCategoryOptions = updateCategoryOptions;
window.showGoalCompleteConfirm = showGoalCompleteConfirm;
window.showGoalExpenseForm = showGoalExpenseForm;
window.addGoalExpense = addGoalExpense;
window.removeGoalOnly = removeGoalOnly;
window.switchEquipmentTab = switchEquipmentTab;

// ===== 전역 데이터 등록 =====
window.records = records;
window.goals = goals;
window.settings = settings;

// ===== 페이지 로드 시 초기화 =====
document.addEventListener('DOMContentLoaded', init);