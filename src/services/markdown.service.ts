import type { MarkdownService } from '@/types';

class MarkdownProcessor implements MarkdownService {
  toHtml(markdown: string): string {
    // Convert markdown to HTML for Tiptap
    let html = markdown
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/==(.*?)==/g, '<mark>$1</mark>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\n/g, '</p><p>');
    
    return `<p>${html}</p>`;
  }

  toMarkdown(html: string): string {
    // Convert HTML back to markdown
    return html
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<strong><em>(.*?)<\/em><\/strong>/g, '***$1***')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<mark[^>]*>(.*?)<\/mark>/g, '==$1==')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<del>(.*?)<\/del>/g, '~~$1~~')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n+$/, '');
  }

  processHighlights(text: string): string {
    // Process highlight syntax in markdown
    return text.replace(/==(.*?)==/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  }

  // Utility methods
  extractPlainText(markdown: string): string {
    return markdown
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/==(.*?)==/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/~~(.*?)~~/g, '$1');
  }

  getWordCount(markdown: string): number {
    const plainText = this.extractPlainText(markdown);
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }

  truncate(markdown: string, maxLength: number): string {
    const plainText = this.extractPlainText(markdown);
    if (plainText.length <= maxLength) return markdown;
    
    return plainText.substring(0, maxLength) + '...';
  }
}

export const markdownService = new MarkdownProcessor();