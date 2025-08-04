/**
 * 장비 가격 관리 모듈
 * 메이플 쌀먹 가계부 장비 가치 평가 및 관리
 */

// 장비 카테고리 정의
const EQUIPMENT_CATEGORIES = {
    weapon: ['weapon', 'secondary', 'emblem'],
    armor: ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'overall', 'shield'],
    accessory: ['face', 'eye', 'earring', 'ring1', 'ring2', 'ring3', 'ring4', 'pendant1', 'pendant2', 'belt', 'shoulder', 'medal'],
    other: ['mechanic', 'dragon']
};

// 장비 아이템 이름 매핑
const EQUIPMENT_NAMES = {
    weapon: '무기',
    secondary: '보조무기',
    emblem: '엠블렘',
    hat: '모자',
    top: '상의',
    bottom: '하의',
    shoes: '신발',
    gloves: '장갑',
    cape: '망토',
    overall: '한벌옷',
    shield: '방패',
    face: '얼굴장식',
    eye: '눈장식',
    earring: '귀고리',
    ring1: '반지1',
    ring2: '반지2',
    ring3: '반지3',
    ring4: '반지4',
    pendant1: '펜던트1',
    pendant2: '펜던트2',
    belt: '벨트',
    shoulder: '어깨장식',
    medal: '훈장',
    mechanic: '기계심장',
    dragon: '용 장비'
};

/**
 * 장비 가치 업데이트
 * @param {string} itemId - 장비 아이템 ID (선택사항)
 * @param {number} value - 가치 (선택사항)
 */
function updateEquipmentValue(itemId = null, value = null) {
    try {
        // 특정 아이템 업데이트
        if (itemId && value !== null) {
            updateSingleEquipment(itemId, value);
        }

        // 전체 계산 수행
        const totals = calculateEquipmentTotals();
        displayEquipmentTotals(totals);
        
        // 상태 저장
        saveEquipmentData();

        return { success: true, totals };

    } catch (error) {
        console.error('장비 가치 업데이트 실패:', error);
        return { success: false, error: '장비 가치 업데이트에 실패했습니다.' };
    }
}

/**
 * 단일 장비 아이템 업데이트
 * @param {string} itemId - 장비 아이템 ID
 * @param {number} value - 가치
 */
function updateSingleEquipment(itemId, value) {
    const equipment = getEquipmentData();
    const parsedValue = parseMeso(value);
    
    equipment[itemId] = parsedValue;
    
    // 상태 업데이트
    if (window.MapleState) {
        window.MapleState.updateEquipmentValue(itemId, parsedValue);
    }
}

/**
 * 장비 전체 가치 계산
 * @returns {Object} 카테고리별 및 전체 가치
 */
function calculateEquipmentTotals() {
    const equipment = getEquipmentData();
    const totals = {
        weapon: 0,
        armor: 0,
        accessory: 0,
        other: 0,
        total: 0
    };

    // 카테고리별 계산
    Object.entries(EQUIPMENT_CATEGORIES).forEach(([category, items]) => {
        totals[category] = items.reduce((sum, item) => {
            const value = equipment[item] || 0;
            return sum + value;
        }, 0);
    });

    // 전체 합계
    totals.total = totals.weapon + totals.armor + totals.accessory + totals.other;

    // 현재 보유 메소와 합한 예상 총액
    const currentMeso = getCurrentMeso();
    const expectedTotal = currentMeso + totals.total;
    
    // 메소 시세로 환산한 현금 가치
    const mesoRate = getMesoRate();
    const expectedCash = Math.floor(expectedTotal / 100000000 * mesoRate);

    return {
        ...totals,
        currentMeso: currentMeso,
        expectedTotal: expectedTotal,
        expectedCash: expectedCash,
        recovery: totals.total
    };
}

/**
 * 장비 가치 분석
 * @returns {Object} 분석 결과
 */
function analyzeEquipmentValue() {
    const equipment = getEquipmentData();
    const totals = calculateEquipmentTotals();
    
    // 가장 비싼 장비 찾기
    const sortedEquipment = Object.entries(equipment)
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1]);

    const mostExpensive = sortedEquipment.length > 0 ? {
        item: sortedEquipment[0][0],
        name: EQUIPMENT_NAMES[sortedEquipment[0][0]],
        value: sortedEquipment[0][1],
        percentage: totals.total > 0 ? (sortedEquipment[0][1] / totals.total * 100) : 0
    } : null;

    // 카테고리별 비중
    const categoryPercentages = {};
    Object.keys(EQUIPMENT_CATEGORIES).forEach(category => {
        categoryPercentages[category] = totals.total > 0 ? 
            (totals[category] / totals.total * 100) : 0;
    });

    // 투자 효율성 분석
    const totalRecords = getRecords();
    const equipmentInvestment = totalRecords
        .filter(r => r.type === 'expense' && 
            ['큐브', '스타포스', '아이템 구매'].includes(r.category))
        .reduce((sum, r) => sum + r.amount, 0);

    const roi = equipmentInvestment > 0 ? 
        ((totals.total - equipmentInvestment) / equipmentInvestment * 100) : 0;

    return {
        totals,
        mostExpensive,
        categoryPercentages,
        equipmentCount: Object.values(equipment).filter(v => v > 0).length,
        averageValue: totals.total > 0 ? totals.total / Object.values(equipment).filter(v => v > 0).length : 0,
        investmentROI: roi,
        totalInvestment: equipmentInvestment
    };
}

/**
 * 장비 보험 가치 계산
 * @param {number} coveragePercentage - 보장 비율 (기본 70%)
 * @returns {Object} 보험 가치 정보
 */
function calculateInsuranceValue(coveragePercentage = 70) {
    const totals = calculateEquipmentTotals();
    const insuranceValue = totals.total * (coveragePercentage / 100);
    const mesoRate = getMesoRate();
    const insuranceCash = Math.floor(insuranceValue / 100000000 * mesoRate);

    return {
        totalValue: totals.total,
        coveragePercentage: coveragePercentage,
        insuranceValue: insuranceValue,
        insuranceCash: insuranceCash,
        uncoveredValue: totals.total - insuranceValue
    };
}

/**
 * 장비 가치 변동 추적
 * @param {string} itemId - 아이템 ID
 * @param {number} newValue - 새로운 가치
 */
function trackEquipmentValueChange(itemId, newValue) {
    const equipment = getEquipmentData();
    const oldValue = equipment[itemId] || 0;
    const change = newValue - oldValue;
    const changePercentage = oldValue > 0 ? (change / oldValue * 100) : 0;

    // 변동 기록 저장
    const changeRecord = {
        itemId: itemId,
        itemName: EQUIPMENT_NAMES[itemId],
        oldValue: oldValue,
        newValue: newValue,
        change: change,
        changePercentage: changePercentage,
        date: new Date().toISOString()
    };

    saveEquipmentChangeHistory(changeRecord);
    
    return changeRecord;
}

/**
 * 장비 가치 히스토리 조회
 * @param {string} itemId - 아이템 ID (선택사항)
 * @param {number} days - 조회할 일수 (기본 30일)
 * @returns {Array} 변동 히스토리
 */
function getEquipmentValueHistory(itemId = null, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = getEquipmentChangeHistory();
    
    return history.filter(record => {
        const recordDate = new Date(record.date);
        const itemMatch = !itemId || record.itemId === itemId;
        const dateMatch = recordDate >= cutoffDate;
        return itemMatch && dateMatch;
    });
}

/**
 * 장비 가치 예측
 * @returns {Object} 예측 결과
 */
function predictEquipmentValue() {
    const history = getEquipmentValueHistory(null, 90); // 90일 히스토리
    const currentTotals = calculateEquipmentTotals();
    
    if (history.length < 5) {
        return {
            prediction: currentTotals.total,
            confidence: 0,
            trend: 'insufficient_data'
        };
    }

    // 최근 트렌드 분석
    const recentChanges = history
        .slice(-10)
        .map(h => h.changePercentage)
        .filter(change => !isNaN(change));

    const avgChange = recentChanges.length > 0 ?
        recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length : 0;

    // 30일 후 예측
    const predicted30Days = currentTotals.total * (1 + avgChange / 100);
    
    // 신뢰도 계산 (변동성 기반)
    const variance = recentChanges.reduce((sum, change) => 
        sum + Math.pow(change - avgChange, 2), 0) / recentChanges.length;
    const confidence = Math.max(0, Math.min(100, 100 - Math.sqrt(variance)));

    return {
        currentValue: currentTotals.total,
        predicted30Days: predicted30Days,
        predictedChange: predicted30Days - currentTotals.total,
        predictedChangePercentage: avgChange,
        confidence: confidence,
        trend: avgChange > 5 ? 'increasing' : avgChange < -5 ? 'decreasing' : 'stable'
    };
}

/**
 * 장비 추천 시스템
 * @returns {Array} 추천 목록
 */
function generateEquipmentRecommendations() {
    const analysis = analyzeEquipmentValue();
    const recommendations = [];

    // 가장 비싼 장비가 전체의 50% 이상을 차지하는 경우
    if (analysis.mostExpensive && analysis.mostExpensive.percentage > 50) {
        recommendations.push({
            type: 'diversification',
            priority: 'high',
            message: `${analysis.mostExpensive.name}이(가) 전체 자산의 ${analysis.mostExpensive.percentage.toFixed(1)}%를 차지합니다. 위험 분산을 고려해보세요.`,
            suggestion: '다른 장비에도 투자하여 포트폴리오를 다양화하세요.'
        });
    }

    // 특정 카테고리 비중이 너무 높은 경우
    Object.entries(analysis.categoryPercentages).forEach(([category, percentage]) => {
        if (percentage > 70) {
            recommendations.push({
                type: 'category_balance',
                priority: 'medium',
                message: `${getCategoryName(category)} 장비가 ${percentage.toFixed(1)}%를 차지합니다.`,
                suggestion: '다른 카테고리 장비도 고려해보세요.'
            });
        }
    });

    // ROI가 낮은 경우
    if (analysis.investmentROI < -20) {
        recommendations.push({
            type: 'investment_efficiency',
            priority: 'high',
            message: `장비 투자 수익률이 ${analysis.investmentROI.toFixed(1)}%로 낮습니다.`,
            suggestion: '투자 전략을 재검토하거나 장비 판매를 고려해보세요.'
        });
    }

    // 장비 가치가 너무 낮은 경우
    if (analysis.totals.total < getCurrentMeso() * 0.1) {
        recommendations.push({
            type: 'underinvestment',
            priority: 'medium',
            message: '장비 투자가 보유 메소 대비 부족합니다.',
            suggestion: '장비 강화나 구매를 통해 자산 포트폴리오를 개선하세요.'
        });
    }

    return recommendations;
}

/**
 * 장비 가치 백업
 * @returns {Object} 백업 데이터
 */
function backupEquipmentData() {
    const equipment = getEquipmentData();
    const totals = calculateEquipmentTotals();
    const analysis = analyzeEquipmentValue();

    const backup = {
        equipment: equipment,
        totals: totals,
        analysis: analysis,
        backupDate: new Date().toISOString(),
        version: '1.0'
    };

    // localStorage에 백업 저장
    try {
        localStorage.setItem('mapleEquipmentBackup', JSON.stringify(backup));
        return { success: true, backup };
    } catch (error) {
        console.error('장비 데이터 백업 실패:', error);
        return { success: false, error: '백업에 실패했습니다.' };
    }
}

/**
 * 장비 가치 복원
 * @returns {Object} 복원 결과
 */
function restoreEquipmentData() {
    try {
        const backupData = localStorage.getItem('mapleEquipmentBackup');
        if (!backupData) {
            return { success: false, error: '백업 데이터를 찾을 수 없습니다.' };
        }

        const backup = JSON.parse(backupData);
        
        // 장비 데이터 복원
        if (window.MapleState) {
            Object.entries(backup.equipment).forEach(([itemId, value]) => {
                window.MapleState.updateEquipmentValue(itemId, value);
            });
        }

        updateEquipmentValue(); // UI 업데이트
        
        return { success: true, restoredDate: backup.backupDate };

    } catch (error) {
        console.error('장비 데이터 복원 실패:', error);
        return { success: false, error: '복원에 실패했습니다.' };
    }
}

// === Helper Functions ===

function getEquipmentData() {
    return window.MapleState ? 
        window.MapleState.getState('equipment') || {} : 
        {};
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

function getRecords() {
    return window.MapleRecords ? 
        window.MapleRecords.getRecords() : 
        [];
}

function parseMeso(value) {
    return window.MapleFormatters ? 
        window.MapleFormatters.parseMeso(value) : 
        parseInt(value) || 0;
}

function formatMeso(value) {
    return window.MapleFormatters ? 
        window.MapleFormatters.formatMeso(value) : 
        value.toLocaleString();
}

function saveEquipmentData() {
    if (window.MapleState) {
        window.MapleState.saveStateToStorage();
    }
}

function displayEquipmentTotals(totals) {
    // UI 요소 업데이트
    const elements = {
        weaponTotal: totals.weapon,
        armorTotal: totals.armor,
        accessoryTotal: totals.accessory,
        otherTotal: totals.other,
        totalRecovery: totals.recovery,
        expectedTotal: totals.expectedTotal,
        expectedCash: `₩${totals.expectedCash.toLocaleString()}`
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (typeof value === 'number') {
                element.textContent = formatMeso(value);
            } else {
                element.textContent = value;
            }
        }
    });
}

function getCategoryName(category) {
    const names = {
        weapon: '무기',
        armor: '방어구',
        accessory: '장신구',
        other: '기타'
    };
    return names[category] || category;
}

function saveEquipmentChangeHistory(changeRecord) {
    try {
        const existing = JSON.parse(localStorage.getItem('mapleEquipmentHistory') || '[]');
        existing.push(changeRecord);
        
        // 최대 100개 기록 유지
        if (existing.length > 100) {
            existing.splice(0, existing.length - 100);
        }
        
        localStorage.setItem('mapleEquipmentHistory', JSON.stringify(existing));
    } catch (error) {
        console.error('장비 변동 히스토리 저장 실패:', error);
    }
}

function getEquipmentChangeHistory() {
    try {
        return JSON.parse(localStorage.getItem('mapleEquipmentHistory') || '[]');
    } catch (error) {
        console.error('장비 변동 히스토리 로딩 실패:', error);
        return [];
    }
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateEquipmentValue,
        calculateEquipmentTotals,
        analyzeEquipmentValue,
        calculateInsuranceValue,
        trackEquipmentValueChange,
        getEquipmentValueHistory,
        predictEquipmentValue,
        generateEquipmentRecommendations,
        backupEquipmentData,
        restoreEquipmentData,
        EQUIPMENT_CATEGORIES,
        EQUIPMENT_NAMES
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleEquipment = {
        updateEquipmentValue,
        calculateEquipmentTotals,
        analyzeEquipmentValue,
        calculateInsuranceValue,
        trackEquipmentValueChange,
        getEquipmentValueHistory,
        predictEquipmentValue,
        generateEquipmentRecommendations,
        backupEquipmentData,
        restoreEquipmentData,
        EQUIPMENT_CATEGORIES,
        EQUIPMENT_NAMES
    };
}