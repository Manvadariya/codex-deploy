from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseRedirect
from django.urls import reverse
import json
import traceback
from .models import CodeSnippet, AIAssistance, CodeExecution
import uuid
from openai import OpenAI
from django.utils import timezone
import re

# Default API credentials
API_KEY = "paste_your_api_key_here"  # Replace with your actual API key
BASE_URL = "https://models.inference.ai.azure.com"

# Global variable to store the most recently used API key
current_api_key = API_KEY

# We'll initialize the OpenAI client only when needed to prevent errors
default_client = None

def get_openai_client(api_key=None):
    """
    Creates and returns an OpenAI client with the provided API key.
    Falls back to the most recently used API key if none is provided.
    
    Args:
        api_key (str, optional): The API key to use for the client. 
                                 If None, uses the most recently stored key.
    
    Returns:
        OpenAI: Configured OpenAI client
    """
    global current_api_key
    
    # If an API key is provided, store it for future use
    if api_key:
        # Store the API key for future calls
        current_api_key = api_key
        
        # Check if it's a GitHub token
        if api_key.startswith('ghp_'):
            pass
        if api_key.startswith('github_'):
            pass
        
        # Create a new client with the provided API key
        return OpenAI(
            api_key=api_key,
            base_url=BASE_URL
        )
    
    # If no API key is provided, use the most recently stored one
    print("Using previously stored API key")
    return OpenAI(
        api_key=current_api_key,
        base_url=BASE_URL
    )

def chat_with_gpt(prompt, chat_history, api_key=None):
    """
    Chats with GPT model using the provided prompt and chat history.
    
    Args:
        prompt (str): The user's prompt
        chat_history (list): List of previous chat messages
        api_key (str, optional): API key to use for this request
    
    Returns:
        str: The model's response
    """
    messages = [
        {
            "role": "system",
            "content": ("You are a specialized code assistant. Your job is to help users troubleshoot and fix code errors, "
                        "generate new code based on requirements, and suggest improvements to increase efficiency. "
                        "Provide clear, step-by-step guidance and sample code where applicable. "
                        "You are also a specialized code assistant for Python, JavaScript, C, C++, Java, PHP, Ruby, Perl, C#, OCaml, VB.NET, Swift, "
                        "Pascal, Fortran, Haskell, Assembly, and Prolog. "
                        "Your primary goal is to assist users in writing and debugging code in shortest and summarized response possible."
                        "Also by default not provide output snippet in response and only provide one code snippet in response, which is the important and final code snippet."
                        "If user ask for output snippet, then only provide output snippet in response.")
        }
    ] + chat_history + [
        {
            "role": "user",
            "content": prompt
        }
    ]
    
    try:
        # Get a client with the appropriate API key
        client = get_openai_client(api_key)
        
        # Determine model based on API key type
        model = "gpt-4.1"  # Default model
        
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=1.0,
            top_p=1.0,
            max_tokens=1000,
            stream=False,
        )
        return completion.choices[0].message.content
    except Exception as e:
        error_message = str(e)
        print(f"API Error: {error_message}")
        
        if "401" in error_message or "unauthorized" in error_message.lower() or "authentication" in error_message.lower():
            return "Error: Authentication failed. Your API key appears to be invalid or expired."
        elif "rate limit" in error_message.lower() or "429" in error_message:
            return "Error: Rate limit exceeded. Please try again later."
        else:
            return f"Error: {error_message}"

# Create your views here.
def login_page(request):
    try:
        if request.method == 'POST':
            username = request.POST.get('username')
            password = request.POST.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('dashboard')
            else:
                messages.error(request, 'Invalid username or password.')
        
        # Simplified - don't try to access social account providers
        return render(request, 'login.html')
    except Exception as e:
        # Log the error with full details
        import traceback
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        # Return a simple response instead of crashing
        messages.error(request, f'An error occurred during login: {str(e)}')
        return render(request, 'login.html', {'error_details': str(e)})

def register(request):
    try:
        if request.method == 'POST':
            form = UserCreationForm(request.POST)
            if form.is_valid():
                # Create the user
                user = form.save()
                username = form.cleaned_data.get('username')
                
                # Log the user in automatically
                user = authenticate(username=username, 
                                   password=form.cleaned_data.get('password1'))
                if user is not None:
                    login(request, user)
                    return redirect('dashboard')
                else:
                    messages.success(request, f'Account created for {username}! You can now log in.')
                    # Use reverse to get the URL
                    from django.urls import reverse
                    return redirect(reverse('login_page'))
            else:
                # If form is invalid, show errors
                for field, errors in form.errors.items():
                    for error in errors:
                        messages.error(request, f"{field}: {error}")
        else:
            form = UserCreationForm()
        
        return render(request, 'register.html', {'form': form})
    except Exception as e:
        # Log the error with full traceback
        import traceback
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        
        # Return a simple response instead of crashing
        messages.error(request, f'An error occurred during registration: {str(e)}')
        form = UserCreationForm()
        return render(request, 'register.html', {'form': form, 'error_details': str(e)})

@login_required
def dashboard(request):
    user_snippets = CodeSnippet.objects.filter(owner=request.user).order_by('-created_at')
    context = {
        'snippets': user_snippets,
        'user': request.user
    }
    return render(request, 'deshboard.html', context)

@login_required
def create_code(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        language = request.POST.get('language')
        code_content = request.POST.get('code_content')
        user_input = request.POST.get('user_input', '')
        requirements = request.POST.get('requirements', '')
        
        # Create new code snippet
        snippet = CodeSnippet(
            title=title,
            description=description,
            language=language,
            code_content=code_content,
            user_input=user_input,
            requirements=requirements,
            owner=request.user
        )
        snippet.save()
        
        return redirect('code_detail', pk=snippet.id)
    
    # For GET requests, render the main.html template with the code editor
    languages = [choice[0] for choice in CodeSnippet._meta.get_field('language').choices]
    context = {
        'languages': languages,
        'user': request.user
    }
    return render(request, 'main.html', context)

@login_required
def code_detail(request, pk):
    snippet = get_object_or_404(CodeSnippet, pk=pk, owner=request.user)
    
    # Get all versions of this snippet
    versions = []
    if snippet.parent_snippet:
        # This is a version, get the parent and all its versions
        root = snippet.parent_snippet
        versions = list(root.versions.all().order_by('version_number'))
        versions.insert(0, root)  # Add the root as the first version
    elif hasattr(snippet, 'versions') and snippet.versions.exists():
        # This is a root with versions
        versions = list(snippet.versions.all().order_by('version_number'))
        versions.insert(0, snippet)  # Add the root as the first version
    
    return render(request, 'code_detail.html', {
        'snippet': snippet,
        'versions': versions
    })

def logout_view(request):
    logout(request)
    return redirect('home_page')

@login_required
def delete_code(request, pk):
    snippet = get_object_or_404(CodeSnippet, pk=pk, owner=request.user)
    if request.method == 'POST':
        snippet.delete()
        messages.success(request, f'Code "{snippet.title}" has been deleted successfully.')
    return redirect('dashboard')

def shared_code(request, pk):
    snippet = get_object_or_404(CodeSnippet, pk=pk)
    return render(request, 'shared_code.html', {'snippet': snippet})

@login_required
def edit_code(request, pk):
    # Get the original snippet
    snippet = get_object_or_404(CodeSnippet, pk=pk, owner=request.user)
    
    if request.method == 'POST':
        # Get the updated code content
        code_content = request.POST.get('code_content')
        
        if not code_content:
            messages.error(request, 'Code content cannot be empty')
            return redirect('code_detail', pk=pk)
        
        # Create a new version
        new_version = snippet.create_new_version(code_content)
        
        messages.success(request, f'Created version {new_version.version_number} of your code snippet')
        return redirect('code_detail', pk=new_version.pk)
    
    return render(request, 'edit_code.html', {'snippet': snippet})

@login_required
def save_edited_code(request):
    """AJAX endpoint to save edited code as a new version"""
    if request.method == 'POST':
        data = json.loads(request.body)
        snippet_id = data.get('snippet_id')
        code_content = data.get('code_content')
        
        snippet = get_object_or_404(CodeSnippet, pk=snippet_id, owner=request.user)
        
        try:
            # Create a new version
            new_version = snippet.create_new_version(code_content)
            
            return JsonResponse({
                'success': True,
                'message': f'Created version {new_version.version_number}',
                'new_url': reverse('code_detail', kwargs={'pk': new_version.pk}),
                'version': new_version.version_number
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=400)
            
    return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

@login_required
def chat_api(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        prompt = data.get('prompt')
        chat_history = data.get('chat_history', [])
        code_id = data.get('code_id')
        
        # Get API key from request headers if available
        api_key = None
        if 'X-OpenAI-API-Key' in request.headers:
            api_key = request.headers.get('X-OpenAI-API-Key')
        elif 'X-Github-Api-Key' in request.headers:
            api_key = request.headers.get('X-Github-Api-Key')
        
        if not prompt:
            return JsonResponse({'error': 'Prompt is required'}, status=400)
        
        # Get code snippet if ID is provided
        code_snippet = None
        if code_id:
            try:
                code_snippet = CodeSnippet.objects.get(id=code_id)
            except CodeSnippet.DoesNotExist:
                pass
        
        # Extract actual code content from the prompt for storage
        code_content = ""
        try:
            # Try to extract code from the prompt which typically follows a pattern like:
            # I'm working with the following code:
            # ```python
            # def hello():
            #     print("hello world")
            # ```
            code_match = re.search(r'```(?:\w+)?\n(.*?)\n```', prompt, re.DOTALL)
            if code_match:
                code_content = code_match.group(1)
        except Exception:
            # If extraction fails, don't prevent the API from functioning
            pass
        
        # If no code snippet exists but user is querying about code, create a temporary one
        if not code_snippet and code_content and request.user.is_authenticated:
            # Try to determine language from the prompt
            language = 'python'  # Default
            language_match = re.search(r'```(\w+)', prompt)
            if language_match:
                detected_lang = language_match.group(1).lower()
                if detected_lang in ['python', 'py']:
                    language = 'python'
                elif detected_lang in ['javascript', 'js']:
                    language = 'javascript'
                elif detected_lang in ['cpp', 'c++']:
                    language = 'cpp'
                elif detected_lang in ['c']:
                    language = 'c'
                elif detected_lang in ['java']:
                    language = 'java'
                elif detected_lang in ['php']:
                    language = 'php'
                elif detected_lang in ['ruby', 'rb']:
                    language = 'ruby'
                elif detected_lang in ['perl', 'pl']:
                    language = 'perl'
                elif detected_lang in ['csharp', 'cs', 'c#']:
                    language = 'csharp'
                elif detected_lang in ['ocaml', 'ml']:
                    language = 'ocaml'
                elif detected_lang in ['vbnet', 'vb', 'vb.net']:
                    language = 'vbnet'
                elif detected_lang in ['swift']:
                    language = 'swift'
                elif detected_lang in ['pascal', 'pas']:
                    language = 'pascal'
                elif detected_lang in ['fortran', 'f90', 'f95']:
                    language = 'fortran'
                elif detected_lang in ['haskell', 'hs']:
                    language = 'haskell'
                elif detected_lang in ['assembly', 'asm']:
                    language = 'assembly'
                elif detected_lang in ['prolog']:
                    language = 'prolog'
            
            code_snippet = CodeSnippet.objects.create(
                title=f"AI Chat Snippet - {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}",
                language=language,
                owner=request.user,
                code_content=code_content
            )
        
        # Pass the API key from the headers to the chat_with_gpt function
        response = chat_with_gpt(prompt, chat_history, api_key)
        
        # Completely new approach to process AI responses with code blocks
        def process_ai_response(text):
            import re
            
            # Check if response has any placeholders like %%CODEBLOCK0%%
            if '%%CODEBLOCK' not in text:
                return text  # No transformation needed
            
            # 1. Extract all actual code blocks with their languages
            code_blocks = []
            code_pattern = re.compile(r'```(.*?)\n([\s\S]*?)```', re.DOTALL)
            
            for match in code_pattern.finditer(text):
                language = match.group(1).strip()
                code = match.group(2).strip()
                code_blocks.append({'language': language, 'code': code})
            
            # 2. Check if we have placeholder references like %%CODEBLOCK0%%
            placeholder_pattern = re.compile(r'%%CODEBLOCK(\d+)%%')
            placeholders = [int(m.group(1)) for m in placeholder_pattern.finditer(text)]
            
            # 3. If we have placeholders but no or fewer code blocks, handle this case
            if placeholders and len(code_blocks) < len(set(placeholders)):
                # Use a fallback approach - create a clean version without placeholders
                # Find all text portions (not code blocks or placeholders)
                text_parts = re.split(r'(```.*?```|%%CODEBLOCK\d+%%)', text, flags=re.DOTALL)
                
                # Keep only the text parts and actual code blocks
                clean_parts = []
                for part in text_parts:
                    if part and not part.strip().startswith('%%CODEBLOCK'):
                        clean_parts.append(part)
                
                # If we have at least one code block, include only the first one
                # This handles the case where we should only show the "most appropriate" code
                if code_blocks:
                    best_code = code_blocks[0]
                    clean_text = ''.join(clean_parts).strip()
                    
                    # Ensure we have no remaining code blocks in the clean text
                    clean_text = re.sub(r'```.*?```', '', clean_text, flags=re.DOTALL).strip()
                    
                    return f"{clean_text}\n\n```{best_code['language']}\n{best_code['code']}\n```"
                
                # If we have no code blocks, just return the cleaned text
                return ''.join(clean_parts)
            
            # 4. If we have enough code blocks for all placeholders, do a direct replacement
            result = text
            
            for placeholder in set(placeholders):
                if placeholder < len(code_blocks):
                    block = code_blocks[placeholder]
                    replacement = f"```{block['language']}\n{block['code']}\n```"
                    result = result.replace(f"%%CODEBLOCK{placeholder}%%", replacement)
                else:
                    # Replace with an empty code block if placeholder index is out of range
                    result = result.replace(f"%%CODEBLOCK{placeholder}%%", 
                                          "```\nNo code available for this section\n```")
            
            return result
        
        # Apply our processing function to the raw response
        processed_response = process_ai_response(response)
        
        # Create AIAssistance record
        AIAssistance.objects.create(
            user=request.user,
            code=code_snippet,
            prompt=prompt,
            response=processed_response
        )
        
        return JsonResponse({
            'response': processed_response
        })
    
    return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
