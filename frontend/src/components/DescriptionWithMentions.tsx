import { useState } from "react";
import { Link } from "react-router-dom";

interface DescriptionWithMentionsProps {
  description: string;
  maxLength?: number;
}

export const DescriptionWithMentions = ({ 
  description, 
  maxLength = 150 
}: DescriptionWithMentionsProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const shouldTruncate = description.length > maxLength;
  const displayText = expanded || !shouldTruncate 
    ? description 
    : description.slice(0, maxLength) + "...";

  // Parse mentions (@username) and convert to links
  const renderText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const username = part.slice(1);
        return (
          <Link
            key={index}
            to={`/user/${username}`}
            className="text-primary font-semibold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="text-sm">
      <span className="text-foreground whitespace-pre-wrap">
        {renderText(displayText)}
      </span>
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-muted-foreground hover:text-foreground ml-1 font-medium"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
};
