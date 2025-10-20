import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { sanitizeMarkdown } from '@/lib/inputSanitization';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Secure markdown renderer with multi-layer sanitization:
 * 1. Input sanitization (removes dangerous patterns)
 * 2. ReactMarkdown (escapes HTML by default)
 * 3. rehype-sanitize (strips disallowed elements)
 */
export const SafeMarkdown = ({ content, className }: SafeMarkdownProps) => {
  // First layer: sanitize markdown syntax
  const sanitizedContent = sanitizeMarkdown(content);

  // Define strict sanitization schema
  const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      // Only allow safe link attributes
      a: ['href', 'title'],
      // Only allow safe image attributes (block onerror, onload)
      img: ['src', 'alt', 'title'],
    },
    protocols: {
      // Block javascript:, data:, vbscript: protocols
      href: ['http', 'https', 'mailto'],
      src: ['http', 'https'],
    },
  };

  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      disallowedElements={['script', 'iframe', 'object', 'embed', 'form', 'input', 'button']}
      unwrapDisallowed={true}
    >
      {sanitizedContent}
    </ReactMarkdown>
  );
};
