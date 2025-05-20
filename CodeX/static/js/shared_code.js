// Get code content from the data passed from template
const codeContent = decodeUnicode(snippetData.codeContent);

// Function to decode Unicode escape sequences
function decodeUnicode(str) {
    return str.replace(/\\u[\dA-F]{4}/gi, function(match) {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
}
        
// Initialize CodeMirror with the code content
let mode;
let fileExtension;
switch(snippetData.language) {
    case 'javascript':
        mode = 'javascript';
        fileExtension = 'js';
        break;
    case 'python':
        mode = 'python';
        fileExtension = 'py';
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

const editor = CodeMirror(document.getElementById('code-editor'), {
    value: codeContent,
    mode: mode,
    theme: 'dracula',
    lineNumbers: true,
    readOnly: true,
    lineWrapping: true
});

// Copy code button with ripple effect
document.getElementById('copy-code').addEventListener('click', function(e) {
    const codeText = editor.getValue();
    navigator.clipboard.writeText(codeText).then(() => {
        const icon = this.querySelector('i');
        icon.classList.remove('bi-clipboard');
        icon.classList.add('bi-clipboard-check', 'copy-success');
        
        // Add ripple effect
        const ripple = this.querySelector('.ripple-effect');
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        this.classList.add('rippling');
        
        setTimeout(() => {
            this.classList.remove('rippling');
            icon.classList.remove('bi-clipboard-check', 'copy-success');
            icon.classList.add('bi-clipboard');
        }, 2000);
    });
});

// Download code button with ripple effect
document.getElementById('download-code').addEventListener('click', function(e) {
    const codeText = editor.getValue();
    const fileName = `{{ snippet.title|slugify }}.${fileExtension}`;
    
    // Create blob and download link
    const blob = new Blob([codeText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    
    // Add ripple effect
    const ripple = this.querySelector('.ripple-effect');
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    this.classList.add('rippling');
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    // Show success indicator
    const icon = this.querySelector('i');
    icon.classList.remove('bi-download');
    icon.classList.add('bi-check-circle', 'copy-success');
    
    setTimeout(() => {
        this.classList.remove('rippling');
        icon.classList.remove('bi-check-circle', 'copy-success');
        icon.classList.add('bi-download');
    }, 2000);
});

// Add floating elements dynamic movement
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

// Dynamic background elements movement
document.addEventListener('mousemove', function(e) {
    const moveX = (e.clientX - window.innerWidth / 2) / 50;
    const moveY = (e.clientY - window.innerHeight / 2) / 50;
    
    document.querySelectorAll('.bg-element').forEach((elem, index) => {
        const factor = (index + 1) * 0.5;
        elem.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
    });
});