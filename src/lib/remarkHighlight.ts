import { visit } from 'unist-util-visit';

export function remarkHighlight() {
  return (tree: any) => {
    visit(tree, 'text', (node: any, index: any, parent: any) => {
      const { value } = node;
      const regex = /==(.*?)==/g;
      
      const matches = [];
      let match;
      while ((match = regex.exec(value)) !== null) {
        matches.push(match);
      }
      
      if (matches.length === 0) return;
      
      const children = [];
      let lastIndex = 0;
      
      for (const match of matches) {
        // Add text before the match
        if (match.index > lastIndex) {
          children.push({
            type: 'text',
            value: value.slice(lastIndex, match.index)
          });
        }
        
        // Add highlighted text as HTML
        children.push({
          type: 'html',
          value: `<mark class="bg-yellow-200 px-1 rounded">${match[1]}</mark>`
        });
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < value.length) {
        children.push({
          type: 'text',
          value: value.slice(lastIndex)
        });
      }
      
      // Replace the node with new nodes
      if (children.length > 0 && parent && index !== undefined) {
        parent.children.splice(index, 1, ...children);
      }
    });
  };
}