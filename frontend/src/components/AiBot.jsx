import { useState, useRef } from 'react';
import api from '../services/api.js';

export default function AiBot({ onClose }) {
    const [messages, setMessages] = useState([
        { role: 'model', text: "Hello! I am your AI assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        
        const newMessages = [...messages, { role: 'user', text: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);
        scrollToBottom();

        try {
            // FIX: Skip the very first "Hello" message (index 0) so the history 
            // sent to the API strictly starts with a user message.
            const history = messages
                .filter((_, index) => index !== 0) 
                .map(m => ({
                    role: m.role === 'model' ? 'model' : 'user',
                    parts: [{ text: m.text }]
                }));

            // Make sure this path matches your backend setup (add /api/ if needed!)
            const res = await api.post('/ai/chat', { message: userMsg, history });
            
            setMessages([...newMessages, { role: 'model', text: res.data.text }]);
        } catch (error) {
            // Check your backend terminal if this still triggers! It will print the exact Google error.
            setMessages([...newMessages, { role: 'model', text: "⚠️ Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 absolute inset-0 z-30">
            {/* AI Header with Close Button */}
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <h3 className="font-semibold text-white tracking-wide text-sm">AI Assistant</h3>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            {/* AI Messages Area */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-gray-50 dark:bg-gray-900">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                        <div className={`px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="self-start px-4 py-2.5 bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700 animate-pulse text-gray-400 text-sm">
                        Thinking...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* AI Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Ask the AI something..."
                    disabled={isLoading}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-full px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors outline-none">
                    Ask
                </button>
            </form>
        </div>
    );
}