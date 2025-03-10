import { Message } from '../types';
import Markdown from 'react-markdown';

type Props = {
  message: Message;
  isFirst: boolean;
  showChoiceButtons: boolean;
  onHistoryChoice: (continuePrevious: boolean) => void;
  onAnalysisChoice: (type: 'summarize' | 'findSimilar' | 'factCheck') => void;
  falseClaims?: Array<{ claim: string; correction: string }>;
};

const MessageDisplay = ({
  message,
  isFirst,
  showChoiceButtons,
  onHistoryChoice,
  onAnalysisChoice,
  falseClaims,
}: Props) => {
  return (
    <div key={message.id}>
      <div
        className={`flex ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        } items-center gap-2`}
      >
        {message.role === 'assistant' && (
          <span className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}

        <div
          className={`
          max-w-[80%] rounded-lg p-3
          ${
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-white shadow-sm border'
          }
          ${message.role === 'assistant' ? 'prose prose-sm max-w-none' : ''}
        `}
        >
          <Markdown>{message.content}</Markdown>
        </div>

        {message.role === 'user' && (
          <span className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {message.role === 'assistant' && isFirst && showChoiceButtons && (
        <div className="flex gap-2 justify-center mt-4">
          {message.content.includes('previous chat history') ? (
            <>
              <button
                onClick={() => onHistoryChoice(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg
                         hover:bg-blue-600 transition-colors text-sm"
              >
                Continue Previous
              </button>
              <button
                onClick={() => onHistoryChoice(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg
                         hover:bg-gray-600 transition-colors text-sm"
              >
                Start Fresh
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onAnalysisChoice('summarize')}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg
                         hover:bg-blue-600 transition-colors text-sm"
              >
                Summarize
              </button>
              <button
                onClick={() => onAnalysisChoice('findSimilar')}
                className="bg-green-500 text-white px-6 py-2 rounded-lg
                         hover:bg-green-600 transition-colors text-sm"
              >
                Find Similar
              </button>
              <button
                onClick={() => onAnalysisChoice('factCheck')}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg
                         hover:bg-yellow-600 transition-colors text-sm"
              >
                Fact Check
              </button>
            </>
          )}
        </div>
      )}

      {falseClaims && falseClaims.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold">False Claims and Corrections:</h3>
          {falseClaims.map((claim, index) => (
            <div
              key={index}
              className="bg-yellow-100 p-2 my-2 border border-yellow-300 rounded"
            >
              <p>
                <strong>False Claim:</strong> {claim.claim}
              </p>
              <p>
                <strong>Correction:</strong> {claim.correction}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageDisplay;
