from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse

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
    parent_snippet = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='versions')
    version_number = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        if self.version_number > 1:
            return f"{self.title} (v{self.version_number})"
        return self.title
        
    def get_absolute_url(self):
        return reverse('code_detail', kwargs={'pk': self.pk})
        
    def create_new_version(self, new_code_content):
        """Create a new version of this code snippet with the updated content"""
        # Get the root snippet (the first version)
        root_snippet = self
        while root_snippet.parent_snippet:
            root_snippet = root_snippet.parent_snippet
            
        # Find the highest version number among all versions
        highest_version = CodeSnippet.objects.filter(
            models.Q(pk=root_snippet.pk) | models.Q(parent_snippet=root_snippet)
        ).order_by('-version_number').first().version_number
        
        # Create new version
        new_version = CodeSnippet(
            title=self.title,
            description=self.description,
            language=self.language,
            owner=self.owner,
            code_content=new_code_content,
            user_input=self.user_input,
            requirements=self.requirements,
            parent_snippet=root_snippet,
            version_number=highest_version + 1
        )
        new_version.save()
        return new_version

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
