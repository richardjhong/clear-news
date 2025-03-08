type Props = {
  inputText: string;
  setInputText: (text: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

const ChatInput = ({ inputText, setInputText, isLoading, onSubmit }: Props) => {
  return (
    <form onSubmit={onSubmit} className="p-4 bg-white border-t">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 p-2 
                   focus:outline-none focus:border-blue-500"
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg
                   hover:bg-blue-600 transition-colors
                   disabled:bg-blue-300"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
