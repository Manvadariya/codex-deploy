// Direct fix for settings panel
document.addEventListener('DOMContentLoaded', function() {
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('editor-settings-panel');
    const closeSettingsButton = document.getElementById('close-settings');
    const githubApiKeyInput = document.getElementById('github-api-key');
    const toggleApiKeyVisibilityButton = document.getElementById('toggle-api-key-visibility');
    
    if (settingsButton && settingsPanel) {        // Show/hide settings panel when settings button is clicked
        settingsButton.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Check if the panel is already visible in the DOM
            if (window.getComputedStyle(settingsPanel).display === 'none') {
                // Force the display style property directly using !important
                settingsPanel.setAttribute('style', 'display: block !important; position: fixed; top: 60px; right: 20px; width: 300px; background-color: var(--secondary-color); border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 10000; overflow: hidden;');
                
                // Initialize settings values when panel is shown
                document.getElementById('fontSize').value = editor.getFontSize();
                document.getElementById('fontSizeValue').textContent = editor.getFontSize();
                document.getElementById('showInvisibles').checked = editor.getShowInvisibles();
                document.getElementById('wrapText').checked = editor.getWrapBehavioursEnabled();
                document.getElementById('showGutter').checked = editor.renderer.getShowGutter();
                document.getElementById('highlightActiveLine').checked = editor.getHighlightActiveLine();
                document.getElementById('showPrintMargin').checked = editor.getShowPrintMargin();
                document.getElementById('enableSnippets').checked = editor.getOptions().enableSnippets;
                document.getElementById('enableBasicAutocompletion').checked = editor.getOptions().enableBasicAutocompletion;
                document.getElementById('enableLiveAutocompletion').checked = editor.getOptions().enableLiveAutocompletion;
                document.getElementById('tabSize').value = editor.getSession().getTabSize();
                
                // Load GitHub API key from localStorage if available
                if (localStorage.getItem('githubApiKey')) {
                    githubApiKeyInput.value = localStorage.getItem('githubApiKey');
                }
            } else {
                settingsPanel.setAttribute('style', 'display: none !important; position: fixed; top: 60px; right: 20px; width: 300px; background-color: var(--secondary-color); border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 10000; overflow: hidden;');
            }
        });
          // Close button functionality
        if (closeSettingsButton) {
            closeSettingsButton.addEventListener('click', function() {
                settingsPanel.setAttribute('style', 'display: none !important; position: fixed; top: 60px; right: 20px; width: 300px; background-color: var(--secondary-color); border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 10000; overflow: hidden;');
            });
        }
        
        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!settingsPanel.contains(e.target) && !settingsButton.contains(e.target)) {
                settingsPanel.setAttribute('style', 'display: none !important; position: fixed; top: 60px; right: 20px; width: 300px; background-color: var(--secondary-color); border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 10000; overflow: hidden;');
            }
        });
        
        // Add keyboard shortcut for settings (Ctrl+,)
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                if (window.getComputedStyle(settingsPanel).display === 'none') {
                    settingsPanel.setAttribute('style', 'display: block !important; position: fixed; top: 60px; right: 20px; width: 300px; background-color: var(--secondary-color); border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 10000; overflow: hidden;');
                } else {
                    settingsPanel.setAttribute('style', 'display: none !important; position: fixed; top: 60px; right: 20px; width: 300px; background-color: var(--secondary-color); border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 10000; overflow: hidden;');
                }
            }
        });
        
        // Add event listeners for settings changes
        document.getElementById('fontSize').addEventListener('input', function(e) {
            const fontSize = parseInt(e.target.value);
            editor.setFontSize(fontSize);
            inputEditor.setFontSize(fontSize);
            document.getElementById('fontSizeValue').textContent = fontSize;
        });

        document.getElementById('showInvisibles').addEventListener('change', function(e) {
            editor.setShowInvisibles(e.target.checked);
        });

        document.getElementById('wrapText').addEventListener('change', function(e) {
            editor.setWrapBehavioursEnabled(e.target.checked);
            editor.getSession().setUseWrapMode(e.target.checked);
        });

        document.getElementById('showGutter').addEventListener('change', function(e) {
            editor.renderer.setShowGutter(e.target.checked);
        });

        document.getElementById('highlightActiveLine').addEventListener('change', function(e) {
            editor.setHighlightActiveLine(e.target.checked);
        });

        document.getElementById('showPrintMargin').addEventListener('change', function(e) {
            editor.setShowPrintMargin(e.target.checked);
        });

        document.getElementById('enableSnippets').addEventListener('change', function(e) {
            editor.setOptions({
                enableSnippets: e.target.checked
            });
        });

        document.getElementById('enableBasicAutocompletion').addEventListener('change', function(e) {
            editor.setOptions({
                enableBasicAutocompletion: e.target.checked
            });
        });

        document.getElementById('enableLiveAutocompletion').addEventListener('change', function(e) {
            editor.setOptions({
                enableLiveAutocompletion: e.target.checked
            });
        });

        document.getElementById('keybinding').addEventListener('change', function(e) {
            const keybinding = e.target.value;
            if (keybinding === 'vim') {
                // Load the keybinding_menu and vim mode
                ace.config.loadModule('ace/keyboard/vim', function(module) {
                    editor.setKeyboardHandler(module.handler);
                });
            } else if (keybinding === 'emacs') {
                ace.config.loadModule('ace/keyboard/emacs', function(module) {
                    editor.setKeyboardHandler(module.handler);
                });
            } else if (keybinding === 'vscode') {
                ace.config.loadModule('ace/keyboard/vscode', function(module) {
                    editor.setKeyboardHandler(module.handler);
                });
            } else {
                editor.setKeyboardHandler(null);
            }
        });        document.getElementById('tabSize').addEventListener('change', function(e) {
            const tabSize = parseInt(e.target.value);
            editor.getSession().setTabSize(tabSize);
        });        // GitHub API key handling
        if (githubApiKeyInput && toggleApiKeyVisibilityButton) {
            // Save GitHub API key to localStorage when it changes
            githubApiKeyInput.addEventListener('change', function() {                const apiKey = this.value.trim();
                
                // Validate API key format (support for OpenAI and GitHub tokens)
                if (apiKey) {
                    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('ghp_') && !apiKey.startsWith('github_')) {
                        alert('Warning: This does not appear to be a valid API key. OpenAI API keys start with "sk-" and GitHub tokens start with "ghp_".');
                    } else if (apiKey.length < 30) {
                        alert('Warning: This API key appears too short. Make sure you\'ve copied the entire API key.');
                    }
                }
                
                // Store it anyway - user might want to test it
                localStorage.setItem('githubApiKey', apiKey);
                
                // Provide feedback
                const feedback = document.createElement('div');
                feedback.textContent = 'API key saved!';
                feedback.style.color = 'green';
                feedback.style.fontSize = '0.8rem';
                feedback.style.marginTop = '5px';
                
                // Remove any existing feedback
                const existingFeedback = this.parentNode.querySelector('.api-feedback');
                if (existingFeedback) {
                    existingFeedback.remove();
                }
                
                // Add class for easy removal later
                feedback.classList.add('api-feedback');
                
                // Add to DOM
                this.parentNode.appendChild(feedback);
                
                // Remove after 3 seconds
                setTimeout(() => {
                    feedback.remove();
                }, 3000);
                
                // Update the global API key for this session
                if (window.updateGithubApiKey) {
                    window.updateGithubApiKey();
                }
            });
            
            // Toggle visibility of the GitHub API key
            toggleApiKeyVisibilityButton.addEventListener('click', function() {
                const icon = this.querySelector('i');
                if (githubApiKeyInput.type === 'password') {
                    githubApiKeyInput.type = 'text';
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                } else {
                    githubApiKeyInput.type = 'password';
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                }
            });
        }
    }
});
