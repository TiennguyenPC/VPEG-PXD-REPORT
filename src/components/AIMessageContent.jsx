import React from 'react';

/** Render Markdown cơ bản cho tin nhắn AI */
export default function AIMessageContent({ content }) {
  if (!content) return null;

  const blocks = String(content).split(/\n\n+/);

  return (
    <div className="space-y-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        const isList = lines.every((l) => /^[\s]*[-*•]\s/.test(l) || l.trim() === '');

        if (isList && lines.some((l) => /^[\s]*[-*•]\s/.test(l))) {
          return (
            <ul key={bi} className="list-disc pl-4 space-y-1 my-1">
              {lines
                .filter((l) => /^[\s]*[-*•]\s/.test(l))
                .map((l, i) => (
                  <li key={i}>{formatInline(l.replace(/^[\s]*[-*•]\s+/, ''))}</li>
                ))}
            </ul>
          );
        }

        const isNumbered = lines.every((l) => /^[\s]*\d+\.\s/.test(l) || l.trim() === '');
        if (isNumbered && lines.some((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={bi} className="list-decimal pl-4 space-y-1 my-1">
              {lines
                .filter((l) => /^[\s]*\d+\.\s/.test(l))
                .map((l, i) => (
                  <li key={i}>{formatInline(l.replace(/^[\s]*\d+\.\s+/, ''))}</li>
                ))}
            </ol>
          );
        }

        return (
          <p key={bi} className="my-0.5">
            {lines.map((line, li) => (
              <React.Fragment key={li}>
                {li > 0 && <br />}
                {formatInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function formatInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[var(--text-strong)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="text-[11px] bg-[var(--bg-hover)] text-[#7373ff] px-1 py-0.5 rounded font-mono border border-[var(--border-main)]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
