from django.contrib import admin
from .models import CodeSnippet, CodeExecution, AIAssistance
from django.utils import formats

class FormattedDateMixin:
    def format_date(self, obj, field_name):
        date = getattr(obj, field_name)
        return formats.date_format(date, "Y-m-d H:i:s")

# Register your models here.
@admin.register(CodeSnippet)
class CodeSnippetAdmin(admin.ModelAdmin, FormattedDateMixin):
    list_display = ('title', 'language', 'owner', 'formatted_created_at', 'formatted_updated_at')
    list_filter = ('language', 'created_at')
    search_fields = ('title', 'description', 'code_content')
    date_hierarchy = 'created_at'
    
    def formatted_created_at(self, obj):
        return self.format_date(obj, 'created_at')
    formatted_created_at.short_description = 'Created At'
    
    def formatted_updated_at(self, obj):
        return self.format_date(obj, 'updated_at')
    formatted_updated_at.short_description = 'Updated At'

@admin.register(CodeExecution)
class CodeExecutionAdmin(admin.ModelAdmin, FormattedDateMixin):
    list_display = ('code', 'formatted_executed_at', 'execution_status')
    list_filter = ('execution_status', 'executed_at')
    search_fields = ('code__title', 'execution_result')
    date_hierarchy = 'executed_at'
    
    def formatted_executed_at(self, obj):
        return self.format_date(obj, 'executed_at')
    formatted_executed_at.short_description = 'Executed At'

@admin.register(AIAssistance)
class AIAssistanceAdmin(admin.ModelAdmin, FormattedDateMixin):
    list_display = ('user', 'code', 'formatted_created_at', 'prompt_preview', 'response_preview')
    list_filter = ('created_at',)
    search_fields = ('prompt', 'response', 'user__username')
    date_hierarchy = 'created_at'
    
    def formatted_created_at(self, obj):
        return self.format_date(obj, 'created_at')
    formatted_created_at.short_description = 'Created At'
    
    def prompt_preview(self, obj):
        return obj.prompt[:50] + '...' if len(obj.prompt) > 50 else obj.prompt
    prompt_preview.short_description = 'Prompt'
    
    def response_preview(self, obj):
        return obj.response[:50] + '...' if len(obj.response) > 50 else obj.response
    response_preview.short_description = 'Response'
