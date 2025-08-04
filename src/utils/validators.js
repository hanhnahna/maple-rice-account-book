/**
 * 입력값 검증 함수들
 * 메이플 쌀먹 가계부 검증 모듈
 */

/**
 * 메소 값 검증
 * @param {string|number} value - 검증할 값
 * @returns {Object} 검증 결과 객체
 */
function validateMesoAmount(value) {
    if (!value) {
        return {
            isValid: false,
            error: '금액을 입력해주세요!'
        };
    }

    const parsedValue = window.MapleFormatters ? 
        window.MapleFormatters.parseMeso(value) : 
        parseMeso(value);

    if (parsedValue === 0) {
        return {
            isValid: false,
            error: '올바른 금액을 입력해주세요!'
        };
    }

    if (parsedValue < 0) {
        return {
            isValid: false,
            error: '음수 값은 입력할 수 없습니다!'
        };
    }

    if (parsedValue > 999999999999999) { // 999조 이상
        return {
            isValid: false,
            error: '너무 큰 금액입니다!'
        };
    }

    return {
        isValid: true,
        value: parsedValue
    };
}

/**
 * 목표 이름 검증
 * @param {string} name - 목표 이름
 * @returns {Object} 검증 결과 객체
 */
function validateGoalName(name) {
    if (!name || name.trim() === '') {
        return {
            isValid: false,
            error: '목표 이름을 입력해주세요!'
        };
    }

    if (name.length > 50) {
        return {
            isValid: false,
            error: '목표 이름은 50자 이내로 입력해주세요!'
        };
    }

    return {
        isValid: true,
        value: name.trim()
    };
}

/**
 * 카테고리 검증
 * @param {string} category - 카테고리
 * @param {Array} validCategories - 유효한 카테고리 목록
 * @returns {Object} 검증 결과 객체
 */
function validateCategory(category, validCategories) {
    if (!category) {
        return {
            isValid: false,
            error: '카테고리를 선택해주세요!'
        };
    }

    if (!validCategories.includes(category)) {
        return {
            isValid: false,
            error: '유효하지 않은 카테고리입니다!'
        };
    }

    return {
        isValid: true,
        value: category
    };
}

/**
 * 메모 검증
 * @param {string} memo - 메모 내용
 * @returns {Object} 검증 결과 객체
 */
function validateMemo(memo) {
    if (memo && memo.length > 200) {
        return {
            isValid: false,
            error: '메모는 200자 이내로 입력해주세요!'
        };
    }

    return {
        isValid: true,
        value: memo || ''
    };
}

/**
 * 메소 시세 검증
 * @param {string|number} rate - 메소 시세
 * @returns {Object} 검증 결과 객체
 */
function validateMesoRate(rate) {
    const numericRate = parseFloat(rate);

    if (isNaN(numericRate)) {
        return {
            isValid: false,
            error: '올바른 숫자를 입력해주세요!'
        };
    }

    if (numericRate <= 0) {
        return {
            isValid: false,
            error: '메소 시세는 0보다 커야 합니다!'
        };
    }

    if (numericRate > 100000) {
        return {
            isValid: false,
            error: '메소 시세가 너무 높습니다!'
        };
    }

    return {
        isValid: true,
        value: numericRate
    };
}

/**
 * 이메일 검증
 * @param {string} email - 이메일 주소
 * @returns {Object} 검증 결과 객체
 */
function validateEmail(email) {
    if (!email) {
        return {
            isValid: false,
            error: '이메일을 입력해주세요!'
        };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            error: '올바른 이메일 형식이 아닙니다!'
        };
    }

    return {
        isValid: true,
        value: email.trim().toLowerCase()
    };
}

/**
 * 날짜 검증
 * @param {string|Date} date - 날짜
 * @returns {Object} 검증 결과 객체
 */
function validateDate(date) {
    let dateObj;
    
    if (typeof date === 'string') {
        dateObj = new Date(date);
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        return {
            isValid: false,
            error: '올바른 날짜를 입력해주세요!'
        };
    }

    if (isNaN(dateObj.getTime())) {
        return {
            isValid: false,
            error: '유효하지 않은 날짜입니다!'
        };
    }

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    if (dateObj < oneYearAgo || dateObj > oneYearLater) {
        return {
            isValid: false,
            error: '날짜는 1년 전부터 1년 후까지만 가능합니다!'
        };
    }

    return {
        isValid: true,
        value: dateObj
    };
}

/**
 * 파일 검증 (백업 파일)
 * @param {File} file - 파일 객체
 * @returns {Object} 검증 결과 객체
 */
function validateBackupFile(file) {
    if (!file) {
        return {
            isValid: false,
            error: '파일을 선택해주세요!'
        };
    }

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        return {
            isValid: false,
            error: 'JSON 파일만 업로드 가능합니다!'
        };
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        return {
            isValid: false,
            error: '파일 크기는 10MB 이하여야 합니다!'
        };
    }

    return {
        isValid: true,
        value: file
    };
}

/**
 * 장비 아이템 이름 검증
 * @param {string} itemName - 장비 아이템 이름
 * @returns {Object} 검증 결과 객체
 */
function validateEquipmentName(itemName) {
    const validItems = [
        'weapon', 'secondary', 'emblem', 'hat', 'top', 'bottom', 
        'shoes', 'gloves', 'cape', 'overall', 'shield', 'face', 
        'eye', 'earring', 'ring1', 'ring2', 'ring3', 'ring4', 
        'pendant1', 'pendant2', 'belt', 'shoulder', 'medal', 
        'mechanic', 'dragon'
    ];

    if (!validItems.includes(itemName)) {
        return {
            isValid: false,
            error: '유효하지 않은 장비 아이템입니다!'
        };
    }

    return {
        isValid: true,
        value: itemName
    };
}

/**
 * 목표 개수 검증
 * @param {Array} currentGoals - 현재 목표 목록
 * @param {number} maxGoals - 최대 목표 개수
 * @returns {Object} 검증 결과 객체
 */
function validateGoalCount(currentGoals, maxGoals = 5) {
    const activeGoals = currentGoals.filter(goal => !goal.completed);
    
    if (activeGoals.length >= maxGoals) {
        return {
            isValid: false,
            error: `활성 목표는 최대 ${maxGoals}개까지 설정할 수 있습니다!`
        };
    }

    return {
        isValid: true,
        value: activeGoals.length
    };
}

/**
 * 복합 검증 - 레코드 추가 시 사용
 * @param {Object} recordData - 레코드 데이터
 * @param {Array} validCategories - 유효한 카테고리 목록
 * @returns {Object} 검증 결과 객체
 */
function validateRecord(recordData, validCategories) {
    const { type, category, amount, memo } = recordData;

    // 타입 검증
    if (!['income', 'expense'].includes(type)) {
        return {
            isValid: false,
            error: '유효하지 않은 거래 유형입니다!'
        };
    }

    // 카테고리 검증
    const categoryValidation = validateCategory(category, validCategories);
    if (!categoryValidation.isValid) {
        return categoryValidation;
    }

    // 금액 검증
    const amountValidation = validateMesoAmount(amount);
    if (!amountValidation.isValid) {
        return amountValidation;
    }

    // 메모 검증
    const memoValidation = validateMemo(memo);
    if (!memoValidation.isValid) {
        return memoValidation;
    }

    return {
        isValid: true,
        value: {
            type,
            category: categoryValidation.value,
            amount: amountValidation.value,
            memo: memoValidation.value
        }
    };
}

// parseMeso 함수가 없을 경우를 위한 fallback
function parseMeso(input) {
    if (!input) return 0;
    input = String(input).trim().replace(/,/g, '');
    
    if (input.includes('억')) {
        const num = parseFloat(input.replace('억', ''));
        return Math.floor(num * 100000000);
    }
    
    const num = parseInt(input);
    return isNaN(num) ? 0 : num;
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateMesoAmount,
        validateGoalName,
        validateCategory,
        validateMemo,
        validateMesoRate,
        validateEmail,
        validateDate,
        validateBackupFile,
        validateEquipmentName,
        validateGoalCount,
        validateRecord
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleValidators = {
        validateMesoAmount,
        validateGoalName,
        validateCategory,
        validateMemo,
        validateMesoRate,
        validateEmail,
        validateDate,
        validateBackupFile,
        validateEquipmentName,
        validateGoalCount,
        validateRecord
    };
}