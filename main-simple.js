// 간단한 메인 파일 - 초기화 문제 해결용

// 초기화 함수
function init() {
    console.log('간단 초기화 시작...');
    
    // 로딩 화면 제거
    const loading = document.getElementById('appLoading');
    if (loading) {
        loading.remove();
    }
    
    // 카테고리 설정
    updateCategoryOptions();
    
    // UI 업데이트
    refreshUI();
    
    console.log('간단 초기화 완료');
}

// 카테고리 업데이트
function updateCategoryOptions() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    
    if (!typeSelect || !categorySelect) return;
    
    const categories = {
        income: ['보스 결정석', '재획', '아이템 판매', '에르다 조각 판매', '기타'],
        expense: ['큐브', '스타포스', '아이템 구매', '기타']
    };
    
    const type = typeSelect.value;
    categorySelect.innerHTML = '';
    
    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// 레코드 추가
function addRecord() {
    console.log('addRecord 호출');
    
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const amountText = document.getElementById('amount').value;
    const memo = document.getElementById('memo').value;
    
    if (!amountText) {
        alert('금액을 입력하세요.');
        return;
    }
    
    // 금액 파싱
    let amount = 0;
    if (amountText.includes('억')) {
        amount = parseFloat(amountText.replace(/[^0-9.]/g, '')) * 100000000;
    } else if (amountText.includes('만')) {
        amount = parseFloat(amountText.replace(/[^0-9.]/g, '')) * 10000;
    } else {
        amount = parseInt(amountText.replace(/[^0-9]/g, '')) || 0;
    }
    
    if (amount <= 0) {
        alert('올바른 금액을 입력하세요.');
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
    
    // 저장
    const data = loadData();
    data.records.push(record);
    saveData(data);
    
    // 입력 필드 초기화
    document.getElementById('amount').value = '';
    document.getElementById('memo').value = '';
    
    alert('기록이 추가되었습니다.');
    refreshUI();
}

// 목표 추가
function addGoal() {
    console.log('addGoal 호출');
    
    const name = document.getElementById('goalName').value;
    const amountText = document.getElementById('goalAmount').value;
    const memo = document.getElementById('goalMemo').value;
    
    if (!name || !amountText) {
        alert('목표 이름과 금액을 입력하세요.');
        return;
    }
    
    // 금액 파싱
    let amount = 0;
    if (amountText.includes('억')) {
        amount = parseFloat(amountText.replace(/[^0-9.]/g, '')) * 100000000;
    } else if (amountText.includes('만')) {
        amount = parseFloat(amountText.replace(/[^0-9.]/g, '')) * 10000;
    } else {
        amount = parseInt(amountText.replace(/[^0-9]/g, '')) || 0;
    }
    
    if (amount <= 0) {
        alert('올바른 목표 금액을 입력하세요.');
        return;
    }
    
    // 목표 생성
    const goal = {
        id: Date.now(),
        name: name,
        amount: amount,
        memo: memo,
        startDate: new Date().toISOString()
    };
    
    // 저장
    const data = loadData();
    if (!data.goals) data.goals = [];
    data.goals.push(goal);
    saveData(data);
    
    // 입력 필드 초기화
    document.getElementById('goalName').value = '';
    document.getElementById('goalAmount').value = '';
    document.getElementById('goalMemo').value = '';
    
    alert('목표가 추가되었습니다.');
    refreshUI();
}

// 레코드 삭제
function deleteRecord(id) {
    if (confirm('삭제하시겠습니까?')) {
        const data = loadData();
        data.records = data.records.filter(r => r.id != id);
        saveData(data);
        refreshUI();
    }
}

// 목표 삭제
function deleteGoal(id) {
    if (confirm('목표를 삭제하시겠습니까?')) {
        const data = loadData();
        if (data.goals) {
            data.goals = data.goals.filter(g => g.id != id);
            saveData(data);
            refreshUI();
        }
    }
}

// UI 새로고침
function refreshUI() {
    console.log('refreshUI 호출');
    
    const data = loadData();
    
    // 레코드 테이블 업데이트
    updateRecordsTable(data.records || []);
    
    // 목표 목록 업데이트
    updateGoalsList(data.goals || []);
    
    // 통계 업데이트
    updateStats(data.records || []);
}

// 레코드 테이블 업데이트
function updateRecordsTable(records) {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">등록된 기록이 없습니다.</td></tr>';
        return;
    }
    
    const sorted = records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sorted.map(record => {
        const date = new Date(record.date);
        const dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        const typeText = record.type === 'income' ? '수익' : '지출';
        const color = record.type === 'income' ? '#228B22' : '#DC143C';
        const prefix = record.type === 'income' ? '+' : '-';
        const amount = formatAmount(record.amount);
        
        return `
            <tr>
                <td>${dateStr}</td>
                <td style="color: ${color}">${typeText}</td>
                <td>${record.category}</td>
                <td style="color: ${color}; font-weight: bold;">${prefix}${amount}</td>
                <td>${record.memo || ''}</td>
                <td><button onclick="deleteRecord(${record.id})">❌</button></td>
            </tr>
        `;
    }).join('');
}

// 목표 목록 업데이트
function updateGoalsList(goals) {
    const container = document.getElementById('goalsList');
    if (!container) return;
    
    if (goals.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px;">설정된 목표가 없습니다.</div>';
        return;
    }
    
    container.innerHTML = goals.map(goal => {
        return `
            <div class="goal-item">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${goal.name}</strong>
                    <button onclick="deleteGoal(${goal.id})">❌</button>
                </div>
                <div>목표: ${formatAmount(goal.amount)}</div>
                ${goal.memo ? `<div style="color: #666; font-size: 0.9em;">${goal.memo}</div>` : ''}
            </div>
        `;
    }).join('');
}

// 통계 업데이트
function updateStats(records) {
    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpense;
    
    updateElement('totalIncome', formatAmount(totalIncome));
    updateElement('totalExpense', formatAmount(totalExpense));
    updateElement('netProfit', formatAmount(netProfit));
}

// 요소 텍스트 업데이트
function updateElement(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// 금액 포맷
function formatAmount(amount) {
    if (amount >= 100000000) {
        return `${(amount / 100000000).toFixed(1)}억`;
    } else if (amount >= 10000) {
        return `${Math.floor(amount / 10000)}만`;
    }
    return amount.toLocaleString();
}

// 데이터 로드
function loadData() {
    try {
        const saved = localStorage.getItem('mapleSsalMeokData');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('데이터 로드 실패:', e);
    }
    return { records: [], goals: [], equipment: {}, settings: {} };
}

// 데이터 저장
function saveData(data) {
    try {
        data.lastModified = new Date().toISOString();
        localStorage.setItem('mapleSsalMeokData', JSON.stringify(data));
    } catch (e) {
        console.error('데이터 저장 실패:', e);
    }
}

// 기타 필요한 함수들
function switchView(view) {
    console.log('View 전환:', view);
}

function switchChart(type) {
    console.log('Chart 전환:', type);
}

function updateCurrentMeso() {
    console.log('현재 메소 업데이트');
}

function updateMesoValue() {
    console.log('메소 가치 업데이트');
}

function updateEquipmentValue() {
    console.log('장비 가치 업데이트');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function exportData() {
    const data = loadData();
    const exportData = {
        ...data,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maple_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (confirm('기존 데이터를 덮어씌우시겠습니까?')) {
                saveData(imported);
                refreshUI();
                alert('데이터를 불러왔습니다.');
            }
        } catch (err) {
            alert('파일을 읽을 수 없습니다.');
        }
    };
    reader.readAsText(file);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function addMemoToRecord(id) {
    console.log('메모 추가:', id);
}

function completeGoal(id) {
    console.log('목표 완료:', id);
}

function confirmGoalComplete() {
    console.log('목표 완료 확인');
}

function saveSettings() {
    console.log('설정 저장');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', init);