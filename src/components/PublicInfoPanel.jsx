import React from "react";

export default function PublicInfoPanel({ results }) {
  return (
    <div className="public-info-panel">
      <div className="public-info-header">
        PUBLIC WEB RESULTS
      </div>

      <div className="public-info-note">
        These are search results from publicly accessible webpages.
        The app does not assume that every result belongs to the
        person you entered.
      </div>

      <div className="public-results">
        {results.map((result, index) => (
          <a
            key={`${result.url}-${index}`}
            className="public-result"
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="public-result-title">
              {result.title || "Untitled result"}
            </div>

            {result.description && (
              <div className="public-result-description">
                {result.description}
              </div>
            )}

            <div className="public-result-url">
              {result.url}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
