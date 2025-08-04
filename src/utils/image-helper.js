/**
 * 이미지 헬퍼 유틸리티
 * WebP 지원 체크 및 폴백 처리
 */

// WebP 지원 여부 체크
function checkWebPSupport() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 0;
}

// 이미지 소스 설정 (WebP 폴백 포함)
function setImageSource(imgElement, webpSrc, fallbackSrc) {
    if (checkWebPSupport()) {
        imgElement.src = webpSrc;
    } else {
        imgElement.src = fallbackSrc || webpSrc.replace('.webp', '.png');
    }
}

// 아이콘 생성 함수
function createIcon(name, size = 'medium', altText = '') {
    const img = document.createElement('img');
    img.className = `icon-${size} auto-icon`;
    img.alt = altText || name;
    
    // WebP 우선, PNG 폴백
    const webpPath = `images/icons/${name}.webp`;
    const pngPath = `images/icons/${name}.png`;
    
    setImageSource(img, webpPath, pngPath);
    
    return img;
}

// 전역으로 내보내기
if (typeof window !== 'undefined') {
    window.ImageHelper = {
        checkWebPSupport,
        setImageSource,
        createIcon
    };
}