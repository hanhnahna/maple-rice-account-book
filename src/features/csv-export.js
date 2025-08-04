/**
 * CSV 내보내기 모듈
 * 가계부 데이터를 CSV 형식으로 내보내기
 */

// CSV 내보내기 다이얼로그 표시
function showCsvExportDialog() {
    const box = document.createElement('div');
    box.className = 'csv-export-box';
    box.innerHTML = `
        <div class="floating-box-content">
            <h3>📊 데이터 내보내기</h3>
            <p>내보낼 데이터 범위를 선택하세요</p>
            
            <div class="export-options">
                <div class="form-group">
                    <label>데이터 범위</label>
                    <select id="csvDateRange" class="form-control">
                        <option value="all">전체 기간</option>
                        <option value="month">이번 달</option>
                        <option value="lastMonth">지난 달</option>
                        <option value="week">이번 주</option>
                        <option value="custom">사용자 지정</option>
                    </select>
                </div>
                
                <div id="customDateRange" style="display: none;">
                    <div class="form-group">
                        <label>시작일</label>
                        <input type="date" id="csvStartDate" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>종료일</label>
                        <input type="date" id="csvEndDate" class="form-control">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>포함할 데이터</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="includeRecords" checked> 수익/지출 기록
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="includeGoals" checked> 목표 설정
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="includeEquipment" checked> 장비 가격
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="includeSummary" checked> 요약 정보
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>파일 형식</label>
                    <select id="csvFormat" class="form-control">
                        <option value="csv">CSV (쉼표 구분)</option>
                        <option value="excel">Excel 호환 (세미콜론 구분)</option>
                        <option value="tsv">TSV (탭 구분)</option>
                    </select>
                </div>
            </div>
            
            <div class="export-progress" style="display: none;">
                <div class="export-progress-bar" style="width: 0%"></div>
            </div>
            
            <div class="export-status" style="display: none;">
                <span class="loading"></span>
                <span class="status-text">데이터 준비 중...</span>
            </div>
            
            <div class="button-group">
                <button class="btn-primary" onclick="exportToCsv()">
                    <span class="button-icon">💾</span> 내보내기
                </button>
                <button class="btn-cancel" onclick="this.closest('.csv-export-box').remove()">취소</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(box);
    
    // 날짜 범위 선택 이벤트
    const dateRangeSelect = box.querySelector('#csvDateRange');
    const customDateRange = box.querySelector('#customDateRange');
    
    dateRangeSelect.addEventListener('change', function() {
        customDateRange.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    
    // 기본 날짜 설정
    const today = new Date();
    box.querySelector('#csvEndDate').value = today.toISOString().split('T')[0];
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    box.querySelector('#csvStartDate').value = monthAgo.toISOString().split('T')[0];
}

// CSV 내보내기 실행
function exportToCsv() {
    const box = document.querySelector('.csv-export-box');
    const progressBar = box.querySelector('.export-progress');
    const progressBarFill = box.querySelector('.export-progress-bar');
    const exportStatus = box.querySelector('.export-status');
    const statusText = box.querySelector('.status-text');
    const exportButton = box.querySelector('.btn-primary');
    
    // UI 상태 변경
    exportButton.disabled = true;
    progressBar.style.display = 'block';
    exportStatus.style.display = 'flex';
    
    // 옵션 가져오기
    const options = {
        dateRange: box.querySelector('#csvDateRange').value,
        startDate: box.querySelector('#csvStartDate').value,
        endDate: box.querySelector('#csvEndDate').value,
        includeRecords: box.querySelector('#includeRecords').checked,
        includeGoals: box.querySelector('#includeGoals').checked,
        includeEquipment: box.querySelector('#includeEquipment').checked,
        includeSummary: box.querySelector('#includeSummary').checked,
        format: box.querySelector('#csvFormat').value
    };
    
    // 진행률 업데이트 함수
    let progress = 0;
    function updateProgress(value, text) {
        progress = value;
        animateProgressBar(progressBarFill, progress);
        statusText.textContent = text;
    }
    
    // 비동기 내보내기 프로세스
    setTimeout(() => {
        try {
            updateProgress(20, '데이터 필터링 중...');
            const filteredData = filterDataByDateRange(options);
            
            setTimeout(() => {
                updateProgress(40, 'CSV 생성 중...');
                const csvContent = generateCsvContent(filteredData, options);
                
                setTimeout(() => {
                    updateProgress(80, '파일 준비 중...');
                    
                    setTimeout(() => {
                        updateProgress(100, '완료!');
                        
                        // 파일 다운로드
                        downloadCsv(csvContent, options.format);
                        
                        // 성공 메시지 표시
                        showExportSuccessMessage(box, filteredData);
                        
                    }, 500);
                }, 500);
            }, 500);
        } catch (error) {
            showExportErrorMessage(box, error.message);
        }
    }, 500);
}

// 날짜 범위로 데이터 필터링
function filterDataByDateRange(options) {
    const records = window.records || [];
    const goals = window.goals || [];
    const equipment = window.equipment || {};
    
    let startDate, endDate;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    switch (options.dateRange) {
        case 'all':
            startDate = new Date(0);
            endDate = today;
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
        case 'lastMonth':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            endDate = today;
            break;
        case 'custom':
            startDate = new Date(options.startDate);
            endDate = new Date(options.endDate);
            endDate.setHours(23, 59, 59, 999);
            break;
    }
    
    const filteredRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
    });
    
    return {
        records: options.includeRecords ? filteredRecords : [],
        goals: options.includeGoals ? goals : [],
        equipment: options.includeEquipment ? equipment : {},
        summary: options.includeSummary ? generateSummary(filteredRecords) : null,
        dateRange: {
            start: startDate,
            end: endDate
        }
    };
}

// 요약 정보 생성
function generateSummary(records) {
    const totalIncome = records
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpense = records
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const categoryStats = {};
    records.forEach(record => {
        const key = `${record.type}_${record.category}`;
        if (!categoryStats[key]) {
            categoryStats[key] = {
                type: record.type,
                category: record.category,
                count: 0,
                total: 0
            };
        }
        categoryStats[key].count++;
        categoryStats[key].total += record.amount;
    });
    
    return {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        recordCount: records.length,
        categoryStats: Object.values(categoryStats),
        currentMeso: parseInt(localStorage.getItem('currentMeso') || '0')
    };
}

// CSV 내용 생성
function generateCsvContent(data, options) {
    const separator = options.format === 'tsv' ? '\t' : 
                     options.format === 'excel' ? ';' : ',';
    const lines = [];
    
    // BOM 추가 (Excel 한글 깨짐 방지)
    const BOM = '\uFEFF';
    
    // 헤더 정보
    lines.push(`메이플 쌀먹 가계부 데이터 내보내기`);
    lines.push(`내보낸 날짜: ${new Date().toLocaleString('ko-KR')}`);
    lines.push(`데이터 기간: ${data.dateRange.start.toLocaleDateString('ko-KR')} ~ ${data.dateRange.end.toLocaleDateString('ko-KR')}`);
    lines.push('');
    
    // 요약 정보
    if (data.summary) {
        lines.push('=== 요약 정보 ===');
        lines.push(`현재 보유 메소${separator}${data.summary.currentMeso}`);
        lines.push(`총 수익${separator}${data.summary.totalIncome}`);
        lines.push(`총 지출${separator}${data.summary.totalExpense}`);
        lines.push(`순이익${separator}${data.summary.netProfit}`);
        lines.push(`총 기록 수${separator}${data.summary.recordCount}`);
        lines.push('');
        
        // 카테고리별 통계
        lines.push('=== 카테고리별 통계 ===');
        lines.push(['유형', '카테고리', '횟수', '총액'].join(separator));
        data.summary.categoryStats.forEach(stat => {
            lines.push([
                stat.type === 'income' ? '수익' : '지출',
                stat.category,
                stat.count,
                stat.total
            ].join(separator));
        });
        lines.push('');
    }
    
    // 수익/지출 기록
    if (data.records.length > 0) {
        lines.push('=== 수익/지출 기록 ===');
        lines.push(['날짜', '시간', '유형', '카테고리', '금액', '메모', '태그'].join(separator));
        
        data.records.forEach(record => {
            const date = new Date(record.date);
            const tags = (record.memo || '').match(/#\S+/g) || [];
            const memo = (record.memo || '').replace(/#\S+/g, '').trim();
            
            lines.push([
                date.toLocaleDateString('ko-KR'),
                date.toLocaleTimeString('ko-KR'),
                record.type === 'income' ? '수익' : '지출',
                record.category,
                record.amount,
                `"${memo.replace(/"/g, '""')}"`,  // CSV 이스케이프
                tags.join(' ')
            ].join(separator));
        });
        lines.push('');
    }
    
    // 목표 설정
    if (data.goals.length > 0) {
        lines.push('=== 목표 설정 ===');
        lines.push(['목표명', '목표 금액', '현재 금액', '진행률', '메모', '상태'].join(separator));
        
        data.goals.forEach(goal => {
            const progress = Math.min((goal.current / goal.amount) * 100, 100);
            const status = goal.completed ? '완료' : progress >= 100 ? '달성' : '진행중';
            
            lines.push([
                goal.name,
                goal.amount,
                goal.current,
                `${progress.toFixed(1)}%`,
                `"${(goal.memo || '').replace(/"/g, '""')}"`,
                status
            ].join(separator));
        });
        lines.push('');
    }
    
    // 장비 가격
    if (Object.keys(data.equipment).length > 0) {
        lines.push('=== 장비 가격 ===');
        lines.push(['장비 종류', '예상 가격'].join(separator));
        
        Object.entries(data.equipment).forEach(([key, value]) => {
            if (value && value > 0) {
                const equipName = getEquipmentName(key);
                lines.push([equipName, value].join(separator));
            }
        });
    }
    
    return BOM + lines.join('\n');
}

// 장비 이름 매핑
function getEquipmentName(key) {
    const equipmentNames = {
        'weapon': '무기',
        'secondary': '보조무기',
        'emblem': '엠블렘',
        'hat': '모자',
        'top': '상의',
        'bottom': '하의',
        'shoes': '신발',
        'gloves': '장갑',
        'cape': '망토',
        'overall': '한벌옷',
        'shield': '방패',
        'face': '얼굴장식',
        'eye': '눈장식',
        'earring': '귀고리',
        'ring1': '반지1',
        'ring2': '반지2',
        'ring3': '반지3',
        'ring4': '반지4',
        'pendant1': '펜던트1',
        'pendant2': '펜던트2',
        'belt': '벨트',
        'shoulder': '어깨장식',
        'medal': '훈장',
        'mechanic': '메카닉 장비',
        'dragon': '드래곤 장비'
    };
    
    return equipmentNames[key] || key;
}

// CSV 다운로드
function downloadCsv(content, format) {
    const mimeType = format === 'tsv' ? 'text/tab-separated-values' : 'text/csv';
    const extension = format === 'tsv' ? 'tsv' : 'csv';
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `메이플쌀먹가계부_${new Date().toISOString().split('T')[0]}.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// 내보내기 성공 메시지
function showExportSuccessMessage(box, data) {
    const content = box.querySelector('.floating-box-content');
    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
            <h3 style="color: #4CAF50;">내보내기 완료!</h3>
            <div style="margin: 20px 0; line-height: 1.6;">
                <p><strong>${data.records.length}</strong>개의 기록을 내보냈습니다</p>
                <p style="font-size: 0.9em; color: #666;">
                    ${data.dateRange.start.toLocaleDateString('ko-KR')} ~ 
                    ${data.dateRange.end.toLocaleDateString('ko-KR')}
                </p>
            </div>
            <button class="btn-primary" onclick="this.closest('.csv-export-box').remove()">
                확인
            </button>
        </div>
    `;
    
    // 성공 애니메이션
    box.classList.add('success-flash');
}

// 내보내기 에러 메시지
function showExportErrorMessage(box, errorMessage) {
    const content = box.querySelector('.floating-box-content');
    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; margin-bottom: 20px; color: #DC143C;">⚠️</div>
            <h3 style="color: #DC143C;">내보내기 실패</h3>
            <p style="margin: 20px 0;">${errorMessage}</p>
            <button class="btn-primary" onclick="this.closest('.csv-export-box').remove()">
                확인
            </button>
        </div>
    `;
    
    // 에러 애니메이션
    box.classList.add('error-shake');
}

// CSV 내보내기 박스 스타일
const csvExportStyle = document.createElement('style');
csvExportStyle.textContent = `
.csv-export-box {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--container-bg);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 2000;
    min-width: 500px;
    max-width: 600px;
    animation: fadeInScale 0.3s ease;
}

.export-options {
    margin: 20px 0;
    max-height: 400px;
    overflow-y: auto;
}

.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 5px;
    border-radius: 5px;
    transition: background 0.2s;
}

.checkbox-label:hover {
    background: var(--card-hover);
}

.checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
    cursor: pointer;
}

.export-status {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 15px 0;
    justify-content: center;
}

.button-icon {
    display: inline-block;
    margin-right: 5px;
}
`;
document.head.appendChild(csvExportStyle);

// 전역 함수 등록
window.showCsvExportDialog = showCsvExportDialog;
window.exportToCsv = exportToCsv;