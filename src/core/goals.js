/**
 * 목표 관리 모듈
 * 메이플 쌀먹 가계부 목표 설정 및 진행 관리
 */

// 목표 상태 상수
const GOAL_STATUS = {
    PENDING: 'pending',      // 진행 중
    ACHIEVED: 'achieved',    // 달성 (완료 대기)
    COMPLETED: 'completed'   // 완료됨
};

/**
 * 목표 추가
 * @param {Object} goalData - 목표 데이터
 * @returns {Object} 결과 객체
 */
function addGoal(goalData) {
    try {
        // 입력 검증
        const validation = validateGoalInput(goalData);
        if (!validation.isValid) {
            return { success: false, error: validation.error };
        }

        // 활성 목표 개수 확인
        const activeGoals = getActiveGoals();
        if (activeGoals.length >= 5) {
            return { success: false, error: '활성 목표는 최대 5개까지 설정할 수 있습니다.' };
        }

        const { name, amount, memo } = validation.data;
        
        // 목표 생성
        const goal = {
            id: Date.now(),
            name: name,
            amount: amount,
            memo: memo,
            startDate: new Date().toISOString(),
            achieved: false,
            completed: false,
            usedAmount: 0,
            status: GOAL_STATUS.PENDING,
            progress: 0,
            createdAt: new Date().toISOString()
        };

        // 상태 업데이트
        if (window.MapleState) {
            window.MapleState.addGoal(goal);
        } else {
            // Fallback: 직접 추가
            const goals = getGoals();
            goals.push(goal);
            saveGoals(goals);
        }

        return { success: true, goal };

    } catch (error) {
        console.error('목표 추가 실패:', error);
        return { success: false, error: '목표 추가에 실패했습니다.' };
    }
}

/**
 * 목표 삭제
 * @param {number} goalId - 삭제할 목표 ID
 * @returns {Object} 결과 객체
 */
function deleteGoal(goalId) {
    try {
        if (window.MapleState) {
            window.MapleState.deleteGoal(goalId);
        } else {
            // Fallback: 직접 삭제
            const goals = getGoals();
            const filteredGoals = goals.filter(g => g.id !== goalId);
            saveGoals(filteredGoals);
        }

        return { success: true };

    } catch (error) {
        console.error('목표 삭제 실패:', error);
        return { success: false, error: '목표 삭제에 실패했습니다.' };
    }
}

/**
 * 목표 완료
 * @param {number} goalId - 완료할 목표 ID
 * @param {Object} expenseData - 지출 기록 데이터 (선택사항)
 * @returns {Object} 결과 객체
 */
function completeGoal(goalId, expenseData = null) {
    try {
        const goal = getGoalById(goalId);
        if (!goal) {
            return { success: false, error: '목표를 찾을 수 없습니다.' };
        }

        if (!goal.achieved) {
            return { success: false, error: '아직 달성하지 않은 목표입니다.' };
        }

        // 지출 기록 생성 (선택사항)
        if (expenseData) {
            const expenseRecord = {
                type: 'expense',
                category: expenseData.category || '기타',
                amount: goal.amount - goal.usedAmount,
                memo: expenseData.memo || goal.name,
                date: new Date().toISOString()
            };

            // 레코드 추가
            if (window.MapleRecords) {
                window.MapleRecords.addRecord(expenseRecord);
            }
        }

        // 목표 완료 처리
        if (window.MapleState) {
            window.MapleState.completeGoal(goalId, expenseData);
        } else {
            // Fallback: 직접 업데이트
            const goals = getGoals();
            const goalIndex = goals.findIndex(g => g.id === goalId);
            if (goalIndex !== -1) {
                goals[goalIndex] = {
                    ...goals[goalIndex],
                    completed: true,
                    status: GOAL_STATUS.COMPLETED,
                    completedDate: new Date().toISOString(),
                    usedAmount: goals[goalIndex].amount
                };
                saveGoals(goals);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('목표 완료 실패:', error);
        return { success: false, error: '목표 완료에 실패했습니다.' };
    }
}

/**
 * 목표 업데이트
 * @param {number} goalId - 업데이트할 목표 ID
 * @param {Object} updates - 업데이트할 데이터
 * @returns {Object} 결과 객체
 */
function updateGoal(goalId, updates) {
    try {
        const goals = getGoals();
        const goalIndex = goals.findIndex(g => g.id === goalId);
        
        if (goalIndex === -1) {
            return { success: false, error: '목표를 찾을 수 없습니다.' };
        }

        // 업데이트 검증
        if (updates.amount && updates.amount <= 0) {
            return { success: false, error: '목표 금액은 0보다 커야 합니다.' };
        }

        // 목표 업데이트
        goals[goalIndex] = {
            ...goals[goalIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        saveGoals(goals);
        return { success: true, goal: goals[goalIndex] };

    } catch (error) {
        console.error('목표 업데이트 실패:', error);
        return { success: false, error: '목표 업데이트에 실패했습니다.' };
    }
}

/**
 * 모든 목표 조회
 * @returns {Array} 목표 배열
 */
function getGoals() {
    try {
        if (window.MapleState) {
            return window.MapleState.getState('goals') || [];
        } else {
            // Fallback: localStorage에서 직접 로딩
            const data = localStorage.getItem('mapleSsalMeokData');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.goals || [];
            }
            return [];
        }
    } catch (error) {
        console.error('목표 조회 실패:', error);
        return [];
    }
}

/**
 * 활성 목표 조회 (완료되지 않은 목표)
 * @returns {Array} 활성 목표 배열
 */
function getActiveGoals() {
    return getGoals().filter(goal => !goal.completed);
}

/**
 * 완료된 목표 조회
 * @returns {Array} 완료된 목표 배열
 */
function getCompletedGoals() {
    return getGoals().filter(goal => goal.completed);
}

/**
 * 달성된 목표 조회 (완료 대기 중)
 * @returns {Array} 달성된 목표 배열
 */
function getAchievedGoals() {
    return getGoals().filter(goal => goal.achieved && !goal.completed);
}

/**
 * ID로 목표 조회
 * @param {number} goalId - 목표 ID
 * @returns {Object|null} 목표 객체
 */
function getGoalById(goalId) {
    const goals = getGoals();
    return goals.find(goal => goal.id === goalId) || null;
}

/**
 * 목표 진행상황 업데이트
 * @param {Array} records - 수익 기록 (선택사항)
 * @returns {Object} 진행상황 정보
 */
function updateGoalProgress(records = null) {
    const goals = getActiveGoals();
    const incomeRecords = records || getIncomeRecords();
    
    let updatedGoals = [];
    let newlyAchieved = [];

    goals.forEach(goal => {
        // 목표 시작일 이후의 수익 계산
        const relevantIncome = incomeRecords
            .filter(record => new Date(record.date) >= new Date(goal.startDate))
            .reduce((sum, record) => sum + record.amount, 0);

        const adjustedAmount = relevantIncome - goal.usedAmount;
        const progress = goal.amount > 0 ? Math.min((adjustedAmount / goal.amount) * 100, 100) : 0;
        const isAchieved = adjustedAmount >= goal.amount;

        // 목표 상태 업데이트
        const updatedGoal = {
            ...goal,
            progress: progress,
            currentAmount: adjustedAmount
        };

        // 새로 달성된 목표 체크
        if (!goal.achieved && isAchieved) {
            updatedGoal.achieved = true;
            updatedGoal.status = GOAL_STATUS.ACHIEVED;
            updatedGoal.achievedDate = new Date().toISOString();
            newlyAchieved.push(updatedGoal);
        }

        updatedGoals.push(updatedGoal);
    });

    // 목표 상태 저장
    if (updatedGoals.length > 0) {
        const allGoals = getGoals();
        updatedGoals.forEach(updatedGoal => {
            const index = allGoals.findIndex(g => g.id === updatedGoal.id);
            if (index !== -1) {
                allGoals[index] = updatedGoal;
            }
        });
        saveGoals(allGoals);
    }

    return {
        totalGoals: goals.length,
        achievedGoals: newlyAchieved.length,
        newlyAchieved: newlyAchieved,
        overallProgress: calculateOverallProgress(updatedGoals)
    };
}

/**
 * 전체 목표 진행률 계산
 * @param {Array} goals - 목표 배열
 * @returns {Object} 전체 진행률 정보
 */
function calculateOverallProgress(goals = null) {
    const activeGoals = goals || getActiveGoals();
    
    if (activeGoals.length === 0) {
        return {
            totalAmount: 0,
            currentAmount: 0,
            progress: 0,
            achievedCount: 0,
            totalCount: 0
        };
    }

    let totalGoalAmount = 0;
    let totalCurrentAmount = 0;
    let achievedCount = 0;

    activeGoals.forEach(goal => {
        totalGoalAmount += goal.amount;
        
        const currentAmount = goal.currentAmount || 0;
        totalCurrentAmount += Math.min(currentAmount, goal.amount);
        
        if (goal.achieved) {
            achievedCount++;
        }
    });

    const overallProgress = totalGoalAmount > 0 ? 
        Math.min((totalCurrentAmount / totalGoalAmount) * 100, 100) : 0;

    return {
        totalAmount: totalGoalAmount,
        currentAmount: totalCurrentAmount,
        progress: overallProgress,
        achievedCount: achievedCount,
        totalCount: activeGoals.length
    };
}

/**
 * 목표 달성 예상 시간 계산
 * @param {number} goalId - 목표 ID
 * @returns {Object} 예상 시간 정보
 */
function estimateGoalCompletion(goalId) {
    const goal = getGoalById(goalId);
    if (!goal || goal.completed) {
        return { error: '유효하지 않은 목표입니다.' };
    }

    // 최근 30일 평균 수익 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentIncome = getIncomeRecords()
        .filter(record => new Date(record.date) >= thirtyDaysAgo)
        .reduce((sum, record) => sum + record.amount, 0);

    const dailyAverage = recentIncome / 30;
    const remainingAmount = goal.amount - (goal.currentAmount || 0);

    if (dailyAverage <= 0) {
        return {
            estimatedDays: Infinity,
            estimatedDate: null,
            dailyAverage: 0,
            remainingAmount: remainingAmount
        };
    }

    const estimatedDays = Math.ceil(remainingAmount / dailyAverage);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

    return {
        estimatedDays: estimatedDays,
        estimatedDate: estimatedDate.toISOString(),
        dailyAverage: dailyAverage,
        remainingAmount: remainingAmount
    };
}

/**
 * 목표 통계 계산
 * @returns {Object} 목표 통계
 */
function calculateGoalStatistics() {
    const allGoals = getGoals();
    const activeGoals = getActiveGoals();
    const completedGoals = getCompletedGoals();
    const achievedGoals = getAchievedGoals();

    // 완료된 목표의 평균 달성 시간 계산
    let totalCompletionTime = 0;
    let completedWithTime = 0;

    completedGoals.forEach(goal => {
        if (goal.startDate && goal.completedDate) {
            const startTime = new Date(goal.startDate).getTime();
            const endTime = new Date(goal.completedDate).getTime();
            const completionTime = (endTime - startTime) / (1000 * 60 * 60 * 24); // 일 단위
            
            totalCompletionTime += completionTime;
            completedWithTime++;
        }
    });

    const averageCompletionDays = completedWithTime > 0 ? 
        totalCompletionTime / completedWithTime : 0;

    // 카테고리별 목표 분류
    const categoryStats = {};
    allGoals.forEach(goal => {
        const category = goal.category || '기타';
        if (!categoryStats[category]) {
            categoryStats[category] = {
                total: 0,
                completed: 0,
                totalAmount: 0,
                completedAmount: 0
            };
        }
        
        categoryStats[category].total++;
        categoryStats[category].totalAmount += goal.amount;
        
        if (goal.completed) {
            categoryStats[category].completed++;
            categoryStats[category].completedAmount += goal.amount;
        }
    });

    return {
        total: allGoals.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        achieved: achievedGoals.length,
        completionRate: allGoals.length > 0 ? (completedGoals.length / allGoals.length) * 100 : 0,
        averageCompletionDays: averageCompletionDays,
        totalGoalAmount: allGoals.reduce((sum, goal) => sum + goal.amount, 0),
        completedGoalAmount: completedGoals.reduce((sum, goal) => sum + goal.amount, 0),
        categoryStats: categoryStats
    };
}

/**
 * 목표 추천 생성
 * @returns {Array} 추천 목표 배열
 */
function generateGoalRecommendations() {
    const records = getIncomeRecords();
    const stats = window.MapleRecords ? 
        window.MapleRecords.calculateRecordStatistics() : 
        calculateBasicStats(records);

    const recommendations = [];

    // 수익률 기반 추천
    if (stats.dailyAverage > 0) {
        const weeklyGoal = Math.floor(stats.dailyAverage * 7);
        const monthlyGoal = Math.floor(stats.dailyAverage * 30);

        recommendations.push({
            name: '주간 수익 목표',
            amount: weeklyGoal,
            memo: '일평균 수익 기반 주간 목표',
            category: '수익',
            estimatedDays: 7
        });

        recommendations.push({
            name: '월간 수익 목표',
            amount: monthlyGoal,
            memo: '일평균 수익 기반 월간 목표',
            category: '수익',
            estimatedDays: 30
        });
    }

    // 카테고리별 추천
    const topCategories = stats.categoryBreakdown ? 
        Object.entries(stats.categoryBreakdown.income)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2) : [];

    topCategories.forEach(([category, amount]) => {
        const avgAmount = amount / 30; // 월평균으로 가정
        const recommendedAmount = Math.floor(avgAmount * 10); // 10일 목표

        recommendations.push({
            name: `${category} 집중 목표`,
            amount: recommendedAmount,
            memo: `${category} 활동에 집중한 목표`,
            category: category,
            estimatedDays: 10
        });
    });

    return recommendations;
}

// === Helper Functions ===

function validateGoalInput(data) {
    if (!data.name || data.name.trim() === '') {
        return { isValid: false, error: '목표 이름을 입력해주세요!' };
    }

    if (data.name.length > 50) {
        return { isValid: false, error: '목표 이름은 50자 이내로 입력해주세요!' };
    }

    if (!data.amount || data.amount <= 0) {
        return { isValid: false, error: '올바른 목표 금액을 입력해주세요!' };
    }

    if (data.memo && data.memo.length > 200) {
        return { isValid: false, error: '메모는 200자 이내로 입력해주세요!' };
    }

    return {
        isValid: true,
        data: {
            name: data.name.trim(),
            amount: data.amount,
            memo: data.memo ? data.memo.trim() : ''
        }
    };
}

function getIncomeRecords() {
    try {
        if (window.MapleRecords) {
            return window.MapleRecords.getRecords().filter(r => r.type === 'income');
        } else {
            // Fallback
            const data = localStorage.getItem('mapleSsalMeokData');
            if (data) {
                const parsed = JSON.parse(data);
                return (parsed.records || []).filter(r => r.type === 'income');
            }
            return [];
        }
    } catch (error) {
        console.error('수익 기록 조회 실패:', error);
        return [];
    }
}

function saveGoals(goals) {
    try {
        const existingData = JSON.parse(localStorage.getItem('mapleSsalMeokData') || '{}');
        existingData.goals = goals;
        localStorage.setItem('mapleSsalMeokData', JSON.stringify(existingData));
    } catch (error) {
        console.error('목표 저장 실패:', error);
        throw error;
    }
}

function calculateBasicStats(records) {
    const totalIncome = records.reduce((sum, r) => sum + r.amount, 0);
    const dailyAverage = totalIncome / 30; // 대략적인 일평균

    return {
        totalIncome,
        dailyAverage,
        categoryBreakdown: { income: {} }
    };
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addGoal,
        deleteGoal,
        completeGoal,
        updateGoal,
        getGoals,
        getActiveGoals,
        getCompletedGoals,
        getAchievedGoals,
        getGoalById,
        updateGoalProgress,
        calculateOverallProgress,
        estimateGoalCompletion,
        calculateGoalStatistics,
        generateGoalRecommendations,
        GOAL_STATUS
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleGoals = {
        addGoal,
        deleteGoal,
        completeGoal,
        updateGoal,
        getGoals,
        getActiveGoals,
        getCompletedGoals,
        getAchievedGoals,
        getGoalById,
        updateGoalProgress,
        calculateOverallProgress,
        estimateGoalCompletion,
        calculateGoalStatistics,
        generateGoalRecommendations,
        GOAL_STATUS
    };
}