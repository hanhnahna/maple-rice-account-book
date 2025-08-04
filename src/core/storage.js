/**
 * LocalStorage 관리 모듈
 * 메이플 쌀먹 가계부 데이터 저장/로딩 관리
 */

// 저장소 키 상수
const STORAGE_KEY = 'mapleSsalMeokData';
const SETTINGS_KEY = 'mapleSsalMeokSettings';
const BACKUP_PREFIX = 'mapleSsalMeokBackup';

/**
 * 전체 데이터 저장
 * @param {Object} data - 저장할 데이터 객체
 * @returns {boolean} 저장 성공 여부
 */
function saveData(data) {
    try {
        const dataToSave = {
            records: data.records || [],
            goals: data.goals || [],
            equipment: data.equipment || {},
            settings: data.settings || {},
            lastModified: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('데이터 저장 완료:', new Date().toLocaleString());
        return true;
    } catch (error) {
        console.error('데이터 저장 실패:', error);
        alert('데이터 저장에 실패했습니다. 브라우저 저장소 용량을 확인해주세요.');
        return false;
    }
}

/**
 * 전체 데이터 로딩
 * @returns {Object} 로딩된 데이터 객체
 */
function loadData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        
        if (!savedData) {
            console.log('저장된 데이터가 없습니다. 기본값을 사용합니다.');
            return getDefaultData();
        }

        const data = JSON.parse(savedData);
        
        // 데이터 무결성 검증
        const validatedData = validateData(data);
        
        console.log('데이터 로딩 완료:', new Date().toLocaleString());
        return validatedData;
        
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        alert('데이터 로딩에 실패했습니다. 백업 데이터를 확인하거나 초기화를 진행하세요.');
        return getDefaultData();
    }
}

/**
 * 설정만 별도 저장
 * @param {Object} settings - 설정 객체
 * @returns {boolean} 저장 성공 여부
 */
function saveSettings(settings) {
    try {
        const settingsToSave = {
            ...settings,
            lastModified: new Date().toISOString()
        };
        
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
        return true;
    } catch (error) {
        console.error('설정 저장 실패:', error);
        return false;
    }
}

/**
 * 설정만 별도 로딩
 * @returns {Object} 설정 객체
 */
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        
        if (!savedSettings) {
            return getDefaultSettings();
        }

        const settings = JSON.parse(savedSettings);
        return { ...getDefaultSettings(), ...settings };
        
    } catch (error) {
        console.error('설정 로딩 실패:', error);
        return getDefaultSettings();
    }
}

/**
 * 데이터 백업 생성
 * @param {string} backupName - 백업 이름
 * @returns {boolean} 백업 성공 여부
 */
function createBackup(backupName = null) {
    try {
        const currentData = loadData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const name = backupName || `backup_${timestamp}`;
        const backupKey = `${BACKUP_PREFIX}_${name}`;
        
        const backupData = {
            ...currentData,
            backupCreated: new Date().toISOString(),
            backupName: name
        };
        
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        console.log(`백업 생성 완료: ${name}`);
        return true;
        
    } catch (error) {
        console.error('백업 생성 실패:', error);
        return false;
    }
}

/**
 * 백업 목록 조회
 * @returns {Array} 백업 목록
 */
function getBackupList() {
    const backups = [];
    
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(BACKUP_PREFIX)) {
                const data = JSON.parse(localStorage.getItem(key));
                backups.push({
                    key: key,
                    name: data.backupName || key.replace(BACKUP_PREFIX + '_', ''),
                    created: data.backupCreated || '알 수 없음',
                    recordsCount: data.records ? data.records.length : 0,
                    goalsCount: data.goals ? data.goals.length : 0
                });
            }
        }
        
        // 생성일 기준 내림차순 정렬
        backups.sort((a, b) => new Date(b.created) - new Date(a.created));
        
    } catch (error) {
        console.error('백업 목록 조회 실패:', error);
    }
    
    return backups;
}

/**
 * 백업 복원
 * @param {string} backupKey - 백업 키
 * @returns {boolean} 복원 성공 여부
 */
function restoreBackup(backupKey) {
    try {
        const backupData = localStorage.getItem(backupKey);
        if (!backupData) {
            throw new Error('백업 데이터를 찾을 수 없습니다.');
        }
        
        const data = JSON.parse(backupData);
        const validatedData = validateData(data);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedData));
        console.log(`백업 복원 완료: ${backupKey}`);
        return true;
        
    } catch (error) {
        console.error('백업 복원 실패:', error);
        alert('백업 복원에 실패했습니다.');
        return false;
    }
}

/**
 * 백업 삭제
 * @param {string} backupKey - 백업 키
 * @returns {boolean} 삭제 성공 여부
 */
function deleteBackup(backupKey) {
    try {
        localStorage.removeItem(backupKey);
        console.log(`백업 삭제 완료: ${backupKey}`);
        return true;
    } catch (error) {
        console.error('백업 삭제 실패:', error);
        return false;
    }
}

/**
 * 데이터 내보내기 (JSON 파일 다운로드)
 * @param {string} filename - 파일명
 */
function exportData(filename = null) {
    try {
        const data = loadData();
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `쌀먹가계부_백업_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        alert('데이터가 백업되었습니다!');
        
    } catch (error) {
        console.error('데이터 내보내기 실패:', error);
        alert('데이터 내보내기에 실패했습니다.');
    }
}

/**
 * 데이터 가져오기 (JSON 파일 업로드)
 * @param {File} file - 업로드된 파일
 * @param {boolean} merge - 기존 데이터와 병합 여부
 * @returns {Promise<boolean>} 가져오기 성공 여부
 */
function importData(file, merge = false) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('파일이 선택되지 않았습니다.'));
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                const validatedData = validateData(importedData);
                
                if (merge) {
                    const currentData = loadData();
                    const mergedData = mergeData(currentData, validatedData);
                    saveData(mergedData);
                } else {
                    saveData(validatedData);
                }
                
                console.log('데이터 가져오기 완료');
                resolve(true);
                
            } catch (error) {
                console.error('데이터 가져오기 실패:', error);
                reject(new Error('파일을 읽을 수 없습니다. 올바른 백업 파일인지 확인해주세요.'));
            }
        };

        reader.onerror = function() {
            reject(new Error('파일 읽기에 실패했습니다.'));
        };

        reader.readAsText(file);
    });
}

/**
 * 저장소 용량 확인
 * @returns {Object} 용량 정보
 */
function getStorageInfo() {
    try {
        const used = new Blob(Object.values(localStorage)).size;
        const quota = 5 * 1024 * 1024; // 대략적인 localStorage 할당량 (5MB)
        
        return {
            used: used,
            quota: quota,
            available: quota - used,
            usagePercentage: (used / quota) * 100
        };
    } catch (error) {
        console.error('저장소 정보 조회 실패:', error);
        return null;
    }
}

/**
 * 저장소 정리
 * @param {number} daysOld - 며칠 전 백업까지 유지할지
 */
function cleanupStorage(daysOld = 30) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        let deletedCount = 0;
        const keysToDelete = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(BACKUP_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const created = new Date(data.backupCreated);
                    
                    if (created < cutoffDate) {
                        keysToDelete.push(key);
                    }
                } catch (e) {
                    // 손상된 백업 데이터도 삭제 대상에 포함
                    keysToDelete.push(key);
                }
            }
        }
        
        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
            deletedCount++;
        });
        
        console.log(`저장소 정리 완료: ${deletedCount}개 백업 삭제`);
        return deletedCount;
        
    } catch (error) {
        console.error('저장소 정리 실패:', error);
        return 0;
    }
}

/**
 * 기본 데이터 반환
 * @returns {Object} 기본 데이터
 */
function getDefaultData() {
    return {
        records: [],
        goals: [],
        equipment: {},
        settings: getDefaultSettings(),
        version: '1.0'
    };
}

/**
 * 기본 설정 반환
 * @returns {Object} 기본 설정
 */
function getDefaultSettings() {
    return {
        mesoRate: 1000,
        patternNotif: true,
        darkMode: false,
        currentMeso: 0,
        autoBackup: true,
        backupInterval: 24 // 시간 단위
    };
}

/**
 * 데이터 유효성 검증
 * @param {Object} data - 검증할 데이터
 * @returns {Object} 검증된 데이터
 */
function validateData(data) {
    const validated = getDefaultData();
    
    if (data.records && Array.isArray(data.records)) {
        validated.records = data.records;
    }
    
    if (data.goals && Array.isArray(data.goals)) {
        validated.goals = data.goals;
    }
    
    if (data.equipment && typeof data.equipment === 'object') {
        validated.equipment = data.equipment;
    }
    
    if (data.settings && typeof data.settings === 'object') {
        validated.settings = { ...validated.settings, ...data.settings };
    }
    
    return validated;
}

/**
 * 데이터 병합
 * @param {Object} currentData - 현재 데이터
 * @param {Object} newData - 새로운 데이터
 * @returns {Object} 병합된 데이터
 */
function mergeData(currentData, newData) {
    return {
        records: [...(currentData.records || []), ...(newData.records || [])],
        goals: [...(currentData.goals || []), ...(newData.goals || [])],
        equipment: { ...(currentData.equipment || {}), ...(newData.equipment || {}) },
        settings: { ...(currentData.settings || {}), ...(newData.settings || {}) },
        version: '1.0'
    };
}

/**
 * 데이터 내보내기 (JSON 파일로 다운로드)
 */
function exportData() {
    try {
        const data = loadData();
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            exportedBy: 'MapleStory Rice Budget App v2.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maple_budget_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('데이터 내보내기 완료');
        return { success: true };
        
    } catch (error) {
        console.error('데이터 내보내기 실패:', error);
        return { success: false, error: '데이터 내보내기에 실패했습니다.' };
    }
}

/**
 * 데이터 가져오기 (JSON 파일에서 로딩)
 * @param {File} file - 가져올 파일
 * @param {boolean} merge - 기존 데이터와 병합 여부
 * @returns {Promise} 가져오기 결과
 */
function importData(file, merge = false) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('파일이 선택되지 않았습니다.'));
            return;
        }

        if (!file.name.endsWith('.json')) {
            reject(new Error('JSON 파일만 가져올 수 있습니다.'));
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 데이터 유효성 검증
                const validatedData = validateData(importedData);
                
                let finalData;
                if (merge) {
                    const currentData = loadData();
                    finalData = mergeData(currentData, validatedData);
                } else {
                    finalData = validatedData;
                }
                
                // 데이터 저장
                const saveResult = saveData(finalData);
                
                if (saveResult) {
                    console.log('데이터 가져오기 완료');
                    resolve({ 
                        success: true, 
                        message: `데이터를 성공적으로 가져왔습니다. (${merge ? '병합됨' : '덮어씌움'})`,
                        recordCount: validatedData.records.length,
                        goalCount: validatedData.goals.length
                    });
                } else {
                    reject(new Error('가져온 데이터 저장에 실패했습니다.'));
                }
                
            } catch (error) {
                console.error('데이터 가져오기 실패:', error);
                reject(new Error('파일을 읽는 중 오류가 발생했습니다. 올바른 형식인지 확인해주세요.'));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('파일 읽기에 실패했습니다.'));
        };
        
        reader.readAsText(file);
    });
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveData,
        loadData,
        saveSettings,
        loadSettings,
        createBackup,
        getBackupList,
        restoreBackup,
        deleteBackup,
        exportData,
        importData,
        getStorageInfo,
        cleanupStorage,
        getDefaultData,
        getDefaultSettings
    };
}

// 전역으로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.MapleStorage = {
        saveData,
        loadData,
        saveSettings,
        loadSettings,
        createBackup,
        getBackupList,
        restoreBackup,
        deleteBackup,
        exportData,
        importData,
        getStorageInfo,
        cleanupStorage,
        getDefaultData,
        getDefaultSettings
    };
}