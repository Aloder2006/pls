// DOM Elements
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewContainer = document.getElementById('previewContainer');
const uploadArea = document.getElementById('uploadArea');
const chooseFileButton = document.getElementById('chooseFileButton');
const processButton = document.getElementById('processButton');
const resetButton = document.getElementById('resetButton');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const uploadSection = document.getElementById('uploadSection');
const result = document.getElementById('result');
const downloadButton = document.getElementById('downloadButton');
const newImageButton = document.getElementById('newImageButton');
const shareButton = document.getElementById('shareButton');

// Palestinian flag configuration
const flagConfig = {
    stripes: [
        { color: 'black', position: 0 },
        { color: 'white', position: 1/3 },
        { color: 'green', position: 2/3 }
    ],
    triangle: {
        color: 'red',
        width: 1/3
    }
};

// Canvas for live preview
let liveCanvas = null;
let liveCtx = null;
let userImage = null;


// File input change handler
fileInput.addEventListener('change', handleFileSelect);

// Process button click handler
processButton.addEventListener('click', () => {
    showLoading(true);
    // Use setTimeout to allow the UI to update before processing
    setTimeout(() => {
        processImage();
    }, 100);
});

// Reset button click handler
resetButton.addEventListener('click', resetImageSelection);

// New image button click handler
newImageButton.addEventListener('click', resetAll);

// Download button click handler
downloadButton.addEventListener('click', downloadImage);

// Share button click handler
shareButton.addEventListener('click', shareImage);

// Live editing controls
if (document.getElementById('imagePositionSlider')) {
    document.getElementById('imagePositionSlider').addEventListener('input', updateLivePreview);
}

if (document.getElementById('opacitySlider')) {
    document.getElementById('opacitySlider').addEventListener('input', updateLivePreview);
}

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

/**
 * Handle file selection from input
 */
function handleFileSelect() {
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
        showError('يرجى اختيار ملف صورة فقط');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('حجم الصورة كبير جدًا. الحد الأقصى هو 5 ميجابايت');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        // Store the image for live preview
        userImage = new Image();
        userImage.onload = () => {
            setupLivePreview();
            showPreview(true);
        };
        userImage.src = e.target.result;
        preview.src = e.target.result;
    };
    
    reader.onerror = () => {
        showError('حدث خطأ أثناء قراءة الملف');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Setup the live preview canvas
 */
function setupLivePreview() {
    // Create canvas if it doesn't exist
    if (!liveCanvas) {
        liveCanvas = document.createElement('canvas');
        liveCanvas.className = 'live-preview-canvas';
        // Insert canvas before the preview image
        previewContainer.insertBefore(liveCanvas, preview);
        liveCtx = liveCanvas.getContext('2d');
    }
    
    // Set canvas dimensions to match the preview container
    const previewWidth = previewContainer.clientWidth;
    const previewHeight = previewContainer.clientHeight;
    
    // Set canvas size to maintain aspect ratio but fit within container
    const aspectRatio = userImage.width / userImage.height;
    let canvasWidth, canvasHeight;
    
    if (aspectRatio > 1) {
        // Landscape image
        canvasWidth = Math.min(previewWidth, 500);
        canvasHeight = canvasWidth / aspectRatio;
    } else {
        // Portrait or square image
        canvasHeight = Math.min(previewHeight, 350);
        canvasWidth = canvasHeight * aspectRatio;
    }
    
    liveCanvas.width = canvasWidth;
    liveCanvas.height = canvasHeight;
    
    // Hide the original preview image
    preview.style.display = 'none';
    
    // Draw the initial live preview
    updateLivePreview();
}

/**
 * Update the live preview with current settings
 */
function updateLivePreview() {
    if (!liveCanvas || !liveCtx || !userImage) return;
    
    // Clear the canvas
    liveCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    
    // Draw the flag background first
    drawFlagOnCanvas(liveCanvas, liveCtx);
    
    // Get image position and opacity values
    const imagePositionSlider = document.getElementById('imagePositionSlider');
    const opacitySlider = document.getElementById('opacitySlider');
    
    const imageZoom = imagePositionSlider ? parseFloat(imagePositionSlider.value) / 100 : 0.85;
    const flagOpacity = opacitySlider ? parseFloat(opacitySlider.value) / 100 : 0.7;
    
    // Calculate dimensions for the profile picture
    const size = Math.min(liveCanvas.width, liveCanvas.height) * imageZoom;
    const x = (liveCanvas.width - size) / 2;
    const y = (liveCanvas.height - size) / 2;
    
    // Create circular clipping path for the image
    liveCtx.save();
    liveCtx.beginPath();
    liveCtx.arc(liveCanvas.width / 2, liveCanvas.height / 2, size / 2, 0, Math.PI * 2, true);
    liveCtx.closePath();
    liveCtx.clip();
    
    // Draw the profile picture
    liveCtx.drawImage(userImage, x, y, size, size);
    liveCtx.restore();
    
    // Draw a circle border
    liveCtx.beginPath();
    liveCtx.arc(liveCanvas.width / 2, liveCanvas.height / 2, size / 2, 0, Math.PI * 2);
    liveCtx.lineWidth = 2;
    liveCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    liveCtx.stroke();
    
    // Update display values if elements exist
    const zoomValueDisplay = document.getElementById('zoomValue');
    const opacityValueDisplay = document.getElementById('opacityValue');
    
    if (zoomValueDisplay) {
        zoomValueDisplay.textContent = `${Math.round(imageZoom * 100)}%`;
    }
    
    if (opacityValueDisplay) {
        opacityValueDisplay.textContent = `${Math.round(flagOpacity * 100)}%`;
    }
}

/**
 * Draw the Palestinian flag on the specified canvas
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function drawFlagOnCanvas(canvas, ctx) {
    const width = canvas.width;
    const height = canvas.height;
    
    // Get flag opacity
    const opacitySlider = document.getElementById('opacitySlider');
    const flagOpacity = opacitySlider ? parseFloat(opacitySlider.value) / 100 : 0.7;
    
    // Apply opacity
    ctx.globalAlpha = flagOpacity;
    
    // Draw stripes
    flagConfig.stripes.forEach(stripe => {
        ctx.fillStyle = stripe.color;
        ctx.fillRect(0, stripe.position * height, width, height / 3);
    });
    
    // Draw triangle
    ctx.fillStyle = flagConfig.triangle.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.lineTo(width * flagConfig.triangle.width, height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Reset opacity
    ctx.globalAlpha = 1.0;
}

/**
 * Show/hide preview container
 */
function showPreview(show) {
    uploadArea.style.display = show ? 'none' : 'block';
    previewContainer.style.display = show ? 'block' : 'none';
    
    if (show) {
        previewContainer.classList.add('fade-in');
    }
}

/**
 * Show/hide loading indicator
 */
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    processButton.disabled = show;
    resetButton.disabled = show;
    
    if (show) {
        loading.classList.add('fade-in');
    }
}

/**
 * Show/hide result section
 */
function showResult(show) {
    resultSection.style.display = show ? 'block' : 'none';
    uploadSection.style.display = show ? 'none' : 'block';
    
    if (show) {
        resultSection.classList.add('fade-in');
        
        // Add scroll to result if not visible
        if (!isElementInViewport(resultSection)) {
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

/**
 * Check if element is in viewport
 */
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Reset image selection
 */
function resetImageSelection() {
    fileInput.value = '';
    userImage = null;
    if (liveCanvas) {
        previewContainer.removeChild(liveCanvas);
        liveCanvas = null;
        liveCtx = null;
    }
    preview.style.display = 'block';
    showPreview(false);
}

/**
 * Reset everything and go back to start
 */
function resetAll() {
    resetImageSelection();
    showResult(false);
    showLoading(false);
}

/**
 * Process the image with the flag overlay
 */
function processImage() {
    try {
        // If we already have the live canvas, use that for the final result
        if (liveCanvas && userImage) {
            // Create a new canvas at higher resolution for the final image
            const finalCanvas = document.createElement('canvas');
            const finalCtx = finalCanvas.getContext('2d');
            
            // Set canvas dimensions (higher quality)
            finalCanvas.width = 1000;
            finalCanvas.height = 1000;
            
            // Draw the flag background
            drawFlagOnCanvas(finalCanvas, finalCtx);
            
            // Get image position
            const positionSlider = document.getElementById('imagePositionSlider');
            const imageZoom = positionSlider ? parseFloat(positionSlider.value) / 100 : 0.85;
            
            // Calculate dimensions for the profile picture
            const size = Math.min(finalCanvas.width, finalCanvas.height) * imageZoom;
            const x = (finalCanvas.width - size) / 2;
            const y = (finalCanvas.height - size) / 2;
            
            // Create circular clipping path
            finalCtx.save();
            finalCtx.beginPath();
            finalCtx.arc(finalCanvas.width / 2, finalCanvas.height / 2, size / 2, 0, Math.PI * 2, true);
            finalCtx.closePath();
            finalCtx.clip();
            
            // Draw the profile picture
            finalCtx.drawImage(userImage, x, y, size, size);
            
            // Add a subtle shadow around the circle
            finalCtx.restore();
            finalCtx.beginPath();
            finalCtx.arc(finalCanvas.width / 2, finalCanvas.height / 2, size / 2, 0, Math.PI * 2, true);
            finalCtx.closePath();
            finalCtx.lineWidth = 2;
            finalCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            finalCtx.stroke();
            
            // Display the result
            result.src = finalCanvas.toDataURL('image/png');
            result.onload = () => {
                showLoading(false);
                showResult(true);
            };
        } else {
            // Fallback to the old method if no live canvas
            const img = new Image();
            
            img.onload = () => {
                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas dimensions
                canvas.width = 1000;
                canvas.height = 1000;
                
                // Draw flag background
                drawFlagOnCanvas(canvas, ctx);
                
                // Get image position
                const positionSlider = document.getElementById('imagePositionSlider');
                const imageZoom = positionSlider ? parseFloat(positionSlider.value) / 100 : 0.85;
                
                // Calculate dimensions for the profile picture
                const size = Math.min(canvas.width, canvas.height) * imageZoom;
                const x = (canvas.width - size) / 2;
                const y = (canvas.height - size) / 2;
                
                // Create circular clipping path
                ctx.save();
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, size / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                
                // Draw the profile picture
                ctx.drawImage(img, x, y, size, size);
                
                // Add a subtle shadow around the circle
                ctx.restore();
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, size / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.stroke();
                
                // Display the result
                result.src = canvas.toDataURL('image/png');
                result.onload = () => {
                    showLoading(false);
                    showResult(true);
                };
            };
            
            img.onerror = () => {
                showError('حدث خطأ أثناء تحميل الصورة');
                showLoading(false);
            };
            
            img.src = preview.src;
        }
    } catch (error) {
        console.error('Error in processImage:', error);
        showError('حدث خطأ أثناء معالجة الصورة');
        showLoading(false);
    }
}

/**
 * Download the processed image
 */
function downloadImage() {
    try {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `profile_with_flag_${timestamp}.png`;
        link.href = result.src;
        link.click();
    } catch (error) {
        showError('حدث خطأ أثناء تحميل الصورة');
    }
}

/**
 * Share the image if Web Share API is available
 */
function shareImage() {
    if (navigator.canShare) {
        // First we need to convert the data URL to a blob
        fetch(result.src)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], 'profile_with_flag.png', { type: 'image/png' });
                
                // Check if we can share this specific content
                if (navigator.canShare({ files: [file] })) {
                    navigator.share({
                        title: 'صورتي مع العلم',
                        text: 'شاهد صورتي مع العلم',
                        files: [file]
                    }).catch(error => {
                        console.error('Error sharing:', error);
                    });
                } else {
                    // Fallback for devices that can share but not files
                    navigator.share({
                        title: 'صورتي مع العلم',
                        text: 'شاهد صورتي مع العلم'
                    }).catch(error => {
                        console.error('Error sharing:', error);
                    });
                }
            }).catch(error => {
                console.error('Error converting to blob:', error);
                showError('حدث خطأ أثناء مشاركة الصورة');
            });
    } else {
        // Create a fallback for browsers without Web Share API
        const shareUrl = document.createElement('input');
        document.body.appendChild(shareUrl);
        shareUrl.value = window.location.href;
        shareUrl.select();
        document.execCommand('copy');
        document.body.removeChild(shareUrl);
        alert('تم نسخ رابط الموقع. يمكنك مشاركته مع أصدقائك');
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    // Check if we have a toast container
    const toastContainer = document.getElementById('toastContainer');
    
    if (toastContainer) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-header">
                <strong class="me-auto">تنبيه</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Initialize the Bootstrap toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toastContainer.removeChild(toast);
        });
    } else {
        // Fallback to alert
        alert(message);
    }
}

// Initialize tooltips and other components
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
