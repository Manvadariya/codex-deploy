// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Function to delete snippet - moved to global scope
function deleteSnippet(snippetId) {
    // Create form with CSRF token for Django
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/core/delete-code/' + snippetId + '/';
    
    // Add CSRF token
    const csrfToken = getCookie('csrftoken');
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrfmiddlewaretoken';
    csrfInput.value = csrfToken;
    
    form.appendChild(csrfInput);
    document.body.appendChild(form);
    form.submit();
}

// Function to confirm delete - moved to global scope
function confirmDelete(snippetId) {
    if (confirm("Are you sure you want to delete this code? This action cannot be undone.")) {
        deleteSnippet(snippetId);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.new-project-btn, .view-code-btn, .action-btn, .logout-btn');
    buttons.forEach(button => {
        button.classList.add('ripple');
    });
    
    // Add subtle mouse movement effect to cards
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const moveX = (x - centerX) / 20;
            const moveY = (y - centerY) / 20;
            
            card.style.transform = `translateY(-8px) rotateX(${-moveY}deg) rotateY(${moveX}deg)`;
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = '';
        });
    });
});