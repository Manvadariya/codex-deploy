// Initialize CodeMirror for code display
let editor;
let fileExtension;

document.addEventListener('DOMContentLoaded', function() {
    // Mobile navbar toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navbarLinks.classList.toggle('active');
            
            // Animate hamburger to X
            const spans = this.querySelectorAll('span');
            if (navbarLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
    
    // Get code content from data attribute
    const codeEditorElement = document.getElementById('code-editor');
    const encodedContent = codeEditorElement.getAttribute('data-code-content') || '';
    
    // Decode Unicode escape sequences
    const codeContent = decodeUnicode(encodedContent);
    
    // Function to decode Unicode escape sequences
    function decodeUnicode(str) {
        return str.replace(/\\u[\dA-F]{4}/gi, function(match) {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
    }
    
    // Initialize editor with the language mode based on snippet.language
    const language = snippetLanguage || 'javascript';
    let mode;
    
    switch(language) {
        case 'javascript':
            mode = 'javascript';
            fileExtension = 'js';
            break;
        case 'python':
            mode = 'python';
            fileExtension = 'py';
            break;
        case 'html':
            mode = 'htmlmixed';
            fileExtension = 'html';
            break;
        case 'css':
            mode = 'css';
            fileExtension = 'css';
            break;
        case 'cpp':
            mode = 'text/x-c++src';
            fileExtension = 'cpp';
            break;
        case 'c':
            mode = 'text/x-csrc';
            fileExtension = 'c';
            break;
        case 'java':
            mode = 'text/x-java';
            fileExtension = 'java';
            break;
        case 'php':
            mode = 'php';
            fileExtension = 'php';
            break;
        case 'ruby':
            mode = 'ruby';
            fileExtension = 'rb';
            break;
        case 'perl':
            mode = 'perl';
            fileExtension = 'pl';
            break;
        case 'csharp':
            mode = 'text/x-csharp';
            fileExtension = 'cs';
            break;
        case 'ocaml':
            mode = 'mllike';
            fileExtension = 'ml';
            break;
        case 'vbnet':
            mode = 'vb';
            fileExtension = 'vb';
            break;
        case 'swift':
            mode = 'swift';
            fileExtension = 'swift';
            break;
        case 'fortran':
            mode = 'fortran';
            fileExtension = 'f90';
            break;
        case 'haskell':
            mode = 'haskell';
            fileExtension = 'hs';
            break;
        case 'assembly':
            mode = 'gas';
            fileExtension = 'asm';
            break;
        case 'prolog':
            mode = 'prolog';
            fileExtension = 'pl';
            break;
        default:
            mode = 'javascript';
            fileExtension = 'txt';
    }
    
    // Initialize CodeMirror
    editor = CodeMirror(document.getElementById('code-editor'), {
        value: codeContent,
        mode: mode,
        theme: 'dracula',
        lineNumbers: true,
        readOnly: true,
        lineWrapping: true,
        scrollbarStyle: null,
        viewportMargin: Infinity
    });
    
    // Ensure proper editor size after initialization
    setTimeout(() => {
        editor.refresh();
    }, 100);
});

// Copy code button
document.getElementById('copy-code').addEventListener('click', function() {
    const codeText = editor.getValue();
    
    navigator.clipboard.writeText(codeText).then(() => {
        // Show success indicator
        const icon = this.querySelector('i');
        icon.classList.remove('bi-clipboard');
        icon.classList.add('bi-clipboard-check', 'copy-success');
        
        setTimeout(() => {
            icon.classList.remove('bi-clipboard-check', 'copy-success');
            icon.classList.add('bi-clipboard');
        }, 2000);
    });
});

// Download code button
document.getElementById('download-code').addEventListener('click', function() {
    const codeText = editor.getValue();
    const snippetTitle = document.querySelector('.code-title').textContent.trim();
    const sanitizedTitle = snippetTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fileName = `${sanitizedTitle}.${fileExtension}`;
    
    // Create blob and download link
    const blob = new Blob([codeText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    
    // Show success indicator
    const icon = this.querySelector('i');
    icon.classList.remove('bi-download');
    icon.classList.add('bi-check-circle', 'copy-success');
    
    setTimeout(() => {
        icon.classList.remove('bi-check-circle', 'copy-success');
        icon.classList.add('bi-download');
    }, 2000);
});

// Share button
document.getElementById('share-button').addEventListener('click', function() {
    // Show modal instead of directly copying link
    const shareModal = document.getElementById('shareModal');
    const modalInstance = new bootstrap.Modal(shareModal);
    
    // Set up a listener to fix aria-hidden when modal is shown
    shareModal.addEventListener('shown.bs.modal', function() {
        // Fix accessibility issue by setting aria-hidden to false
        shareModal.setAttribute('aria-hidden', 'false');
    }, {once: true});
    
    modalInstance.show();
    
    // Generate QR code when modal opens
    setTimeout(() => {
        generateQRCode();
    }, 300);
});

// Function to generate QR code
function generateQRCode() {
    const qrCodeElement = document.getElementById('qrcode');
    const shareUrl = document.getElementById('share-url-input').value;
    
    // Only generate if not already generated
    if (!qrCodeElement.hasChildNodes()) {
        qrCodeElement.innerHTML = '';
        
        new QRCode(qrCodeElement, {
            text: shareUrl,
            width: 180,
            height: 180,
            colorDark: '#000',
            colorLight: '#fff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Add subtle animation to QR code
        const qrImg = qrCodeElement.querySelector('img');
        if (qrImg) {
            qrImg.style.opacity = '0';
            qrImg.style.transform = 'scale(0.8)';
            qrImg.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                qrImg.style.opacity = '1';
                qrImg.style.transform = 'scale(1)';
            }, 100);
        }
    }
}

// Copy link button with enhanced animation
document.getElementById('copy-link-btn').addEventListener('click', function() {
    const shareUrl = document.getElementById('share-url-input').value;
    navigator.clipboard.writeText(shareUrl).then(() => {
        const originalButtonContent = this.innerHTML;
        
        // Change to success state
        this.innerHTML = `<i class="bi bi-check-lg" style="font-size: 0.9rem;"></i> <span style="font-size: 0.9rem;">Copied!</span>`;
        this.style.background = 'linear-gradient(135deg, #28c840, #1ea82f)';
        this.style.transform = 'translateY(-3px)';
        
        // Create ripple effect
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.top = '50%';
        ripple.style.left = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.width = '0';
        ripple.style.height = '0';
        ripple.style.background = 'rgba(255,255,255,0.3)';
        ripple.style.borderRadius = '50%';
        ripple.style.transition = 'all 0.5s ease-out';
        this.appendChild(ripple);
        
        // Animate ripple
        setTimeout(() => {
            ripple.style.width = '200%';
            ripple.style.height = '200%';
            ripple.style.opacity = '0';
        }, 10);
        
        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 500);
        
        // Reset after delay
        setTimeout(() => {
            this.innerHTML = originalButtonContent;
            this.style.background = 'linear-gradient(135deg, var(--accent-color), #6c5ce7)';
            this.style.transform = 'translateY(0)';
        }, 2000);
    });
});

// Tab switching with enhanced animations
document.querySelectorAll('#share-tabs .nav-link').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('#share-tabs .nav-link').forEach(t => {
            t.style.background = 'transparent';
            t.style.color = 'var(--text-color)';
        });
        
        this.style.background = 'linear-gradient(135deg, var(--accent-color), #6c5ce7)';
        this.style.color = 'white';
    });
    
    tab.addEventListener('shown.bs.tab', function() {
        if (this.id === 'snapshot-tab') {
            generateCodeSnapshot();
        }
    });
});

// Download QR code with enhanced animation
document.getElementById('download-qr-btn').addEventListener('click', function() {
    const qrCodeElement = document.getElementById('qrcode').querySelector('img');
    if (qrCodeElement) {
        const snippetTitle = document.querySelector('.code-title').textContent.trim();
        const sanitizedTitle = snippetTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const link = document.createElement('a');
        link.download = `${sanitizedTitle}_qrcode.jpg`;
        link.href = qrCodeElement.src;
        
        // Animated feedback
        this.classList.add('pulse-animation');
        this.querySelector('.glow-effect').style.opacity = '1';
        
        setTimeout(() => {
            link.click();
        }, 100);
        
        setTimeout(() => {
            this.classList.remove('pulse-animation');
            this.querySelector('.glow-effect').style.opacity = '0';
        }, 500);
    }
});

// Download snapshot with enhanced animation
document.getElementById('download-snapshot-btn').addEventListener('click', function() {
    const img = document.getElementById('snapshot-image');
    if (img.classList.contains('d-none')) return;
    
    try {
        // Instead of using canvas (which has CORS issues),
        // directly create a download from the image URL
        const snippetTitle = document.querySelector('.code-title').textContent.trim();
        const sanitizedTitle = snippetTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `${sanitizedTitle}_${document.getElementById('theme-select').value}_code.png`;
        document.body.appendChild(link);
        
        // Animated feedback
        this.classList.add('pulse-animation');
        this.querySelector('.glow-effect').style.opacity = '1';
        
        // Trigger download
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        
        setTimeout(() => {
            this.classList.remove('pulse-animation');
            this.querySelector('.glow-effect').style.opacity = '0';
        }, 500);
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again or use a screenshot tool.');
    }
});

// QR code container hover effects
const qrContainer = document.querySelector('.qr-card');
qrContainer.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-8px) scale(1.01)';
    this.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
    
    const qrBox = this.querySelector('.mx-auto');
    qrBox.style.transform = 'rotate(1deg) scale(1.03)';
});

qrContainer.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
    this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
    
    const qrBox = this.querySelector('.mx-auto');
    qrBox.style.transform = 'rotate(0deg) scale(1)';
});

// Snapshot card hover effects
const snippetCard = document.querySelector('.snippet-card');
snippetCard.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-5px)';
    this.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
});

snippetCard.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
});

// Function to generate code snapshot using SourceCodeShots API
function generateCodeSnapshot() {
    const codeText = editor.getValue();
    const theme = document.getElementById('theme-select').value;
    const language = snippetLanguage || 'javascript';
    const snippetTitle = document.querySelector('.code-title').textContent.trim();
    const sanitizedTitle = snippetTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fileName = `${sanitizedTitle}_code.png`;
    
    // Show loading state
    document.getElementById('snapshot-image').classList.add('d-none');
    document.getElementById('snapshot-loading').classList.remove('d-none');
    document.getElementById('download-snapshot-btn').disabled = true;
    
    // Map Django language to API language
    let apiLanguage;
    switch(language) {
        case 'javascript':
            apiLanguage = 'js';
            break;
        case 'python':
            apiLanguage = 'python';
            break;
        case 'cpp':
            apiLanguage = 'cpp';
            break;
        case 'c':
            apiLanguage = 'c';
            break;
        case 'java':
            apiLanguage = 'java';
            break;
        case 'php':
            apiLanguage = 'php';
            break;
        case 'ruby':
            apiLanguage = 'ruby';
            break;
        case 'perl':
            apiLanguage = 'perl';
            break;
        case 'csharp':
            apiLanguage = 'csharp';
            break;
        case 'ocaml':
            apiLanguage = 'ocaml';
            break;
        case 'vbnet':
            apiLanguage = 'vb';
            break;
        case 'swift':
            apiLanguage = 'swift';
            break;
        case 'fortran':
            apiLanguage = 'fortran';
            break;
        case 'haskell':
            apiLanguage = 'haskell';
            break;
        case 'assembly':
            apiLanguage = 'asm';
            break;
        case 'prolog':
            apiLanguage = 'prolog';
            break;
        default:
            apiLanguage = 'text';
    }
    
    // Construct API URL for image generation
    const baseUrl = "https://sourcecodeshots.com/api/image";
    const params = new URLSearchParams({
        code: codeText,
        language: apiLanguage,
        theme: theme,
        tabWidth: 2
    });
    
    // We'll use the API to generate an image URL and then fetch it
    const imageUrl = baseUrl + '?' + params.toString();
    
    // Create a new image element
    const img = new Image();
    img.crossOrigin = "anonymous";  // To allow downloading the image
    
    img.onload = function() {
        // Hide loading, show image
        document.getElementById('snapshot-image').src = img.src;
        document.getElementById('snapshot-image').classList.remove('d-none');
        document.getElementById('snapshot-loading').classList.add('d-none');
        document.getElementById('download-snapshot-btn').disabled = false;
    };
    
    img.onerror = function() {
        // Handle error
        document.getElementById('snapshot-loading').innerHTML = 
            '<div class="alert alert-danger">Failed to generate snapshot. Please try again.</div>';
    };
    
    // Set the image source to the API URL
    img.src = imageUrl;
}

// Regenerate snapshot with new theme
document.getElementById('regenerate-snapshot-btn').addEventListener('click', function() {
    generateCodeSnapshot();
});

// Dynamic background elements movement
document.addEventListener('mousemove', function(e) {
    const moveX = (e.clientX - window.innerWidth / 2) / 50;
    const moveY = (e.clientY - window.innerHeight / 2) / 50;
    
    document.querySelectorAll('.bg-element').forEach((elem, index) => {
        const factor = (index + 1) * 0.5;
        elem.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
    });
});

// Add ripple effect to buttons
document.querySelectorAll('.btn-icon').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = this.querySelector('.ripple-effect');
        const rect = this.getBoundingClientRect();
        
        // Set position relative to button
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        // Trigger animation
        this.classList.add('rippling');
        
        // Remove animation class after it completes
        setTimeout(() => {
            this.classList.remove('rippling');
        }, 600);
    });
});

// Floating elements dynamic movement
const codeContainer = document.querySelector('.code-container');
if (codeContainer) {
    codeContainer.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const moveX = (x / rect.width - 0.5) * 20;
        const moveY = (y / rect.height - 0.5) * 20;
        
        document.querySelectorAll('.floating-element').forEach((elem, index) => {
            const factor = index === 0 ? 1 : index === 1 ? 1.5 : 0.75;
            elem.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
        });
    });
    
    codeContainer.addEventListener('mouseleave', function() {
        document.querySelectorAll('.floating-element').forEach(elem => {
            elem.style.transform = 'translate(0, 0)';
            elem.style.transition = 'transform 0.8s ease-out';
        });
    });
}

// Add fullscreen functionality for code container
const expandCodeBtn = document.getElementById('expand-code');
if (expandCodeBtn) {
    expandCodeBtn.addEventListener('click', function() {
        const codeContainer = document.querySelector('.code-container');
        
        if (!document.fullscreenElement) {
            codeContainer.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            this.querySelector('i').classList.remove('bi-arrows-fullscreen');
            this.querySelector('i').classList.add('bi-fullscreen-exit');
            this.querySelector('.tooltip-text').textContent = 'Exit Fullscreen';
        } else {
            document.exitFullscreen();
            this.querySelector('i').classList.remove('bi-fullscreen-exit');
            this.querySelector('i').classList.add('bi-arrows-fullscreen');
            this.querySelector('.tooltip-text').textContent = 'Fullscreen';
        }
    });
    
    document.addEventListener('fullscreenchange', function() {
        const btn = document.getElementById('expand-code');
        if (!document.fullscreenElement && btn) {
            btn.querySelector('i').classList.remove('bi-fullscreen-exit');
            btn.querySelector('i').classList.add('bi-arrows-fullscreen');
            btn.querySelector('.tooltip-text').textContent = 'Fullscreen';
        }
    });
}

// Shrink navbar on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    
    if (window.scrollY > 100) {
        navbar.style.height = '60px';
        navbar.style.background = 'rgba(18, 18, 18, 0.95)';
    } else {
        navbar.style.height = '70px';
        navbar.style.background = 'rgba(18, 18, 18, 0.85)';
    }
});