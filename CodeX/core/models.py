from django.db import models
from django.contrib.auth.models import User

LANGUAGE_CHOICES = [
    ('python', 'Python'),
    ('javascript', 'JavaScript'),
    ('cpp', 'C++'),
    ('c', 'C'),
    ('java', 'Java'),
    ('php', 'PHP'),
    ('ruby', 'Ruby'),
    ('perl', 'Perl'),
    ('csharp', 'C#'),
    ('ocaml', 'OCaml'),
    ('vbnet', 'VB.NET'),
    ('swift', 'Swift'),
    ('fortran', 'Fortran'),
    ('haskell', 'Haskell'),
    ('assembly', 'Assembly'),
    ('prolog', 'Prolog'),
]

class CodeSnippet(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='snippets')
    code_content = models.TextField()
    user_input = models.TextField(
        blank=True, 
        null=True, 
        help_text="Input provided by the user for code execution"
    )
    requirements = models.TextField(
        blank=True, 
        null=True, 
        help_text="Additional requirements or specifications for the code"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class CodeExecution(models.Model):
    code = models.ForeignKey(CodeSnippet, on_delete=models.CASCADE, related_name='executions')
    executed_at = models.DateTimeField(auto_now_add=True)
    code_snapshot = models.TextField()
    execution_result = models.TextField(blank=True, null=True)
    execution_status = models.CharField(
        max_length=20,
        choices=[
            ('SUCCESS', 'Success'),
            ('ERROR', 'Error'),
            ('TIMEOUT', 'Timeout'),
            ('PENDING', 'Pending')
        ],
        default='PENDING'
    )
    
    def __str__(self):
        formatted_date = self.executed_at.strftime('%Y-%m-%d %H:%M:%S')
        return f"Execution of '{self.code.title}' [{self.execution_status}] at {formatted_date}"

class AIAssistance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_assistance')
    code = models.ForeignKey(CodeSnippet, on_delete=models.CASCADE, related_name='ai_assistance', null=True, blank=True)
    prompt = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        code_info = f" for code '{self.code.title}'" if self.code else ""
        formatted_date = self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        return f"AI Assistance for {self.user.username}{code_info} at {formatted_date}"
