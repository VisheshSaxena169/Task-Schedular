import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import AiBot from './AiBot'; // Make sure this import is here!

export default function ChatBox({ workspaceId, onNewMessage }) {
    const { user, socket } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    const [editingMsgId, setEditingMsgId] = useState(null);
    const [editInput, setEditInput] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // --- NEW AI STATES ---
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [showAiBot, setShowAiBot] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/workspaces/${workspaceId}/messages`);
                setMessages(res.data.messages);
                scrollToBottom();
            } catch (error) {
                // FIX 2: Actually show the error so you know if the backend failed!
                console.error("History fetch error:", error);
                toast.error(error.response?.data?.message || "Failed to load chat history");
            }
        };
        fetchHistory();
    }, [workspaceId]);



    // 2. Handle Socket Connection separately
    useEffect(() => {
        if (!socket) return; 

        socket.emit('join_workspace', workspaceId);

        // Socket Listeners for Real-Time Actions
        const handleNewMessage = (msg) => {
            setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
            scrollToBottom();
            if (msg.sender && user && msg.sender._id !== (user._id || user.id) && onNewMessage) {
                onNewMessage();
            }
        };

        const handleEditedMessage = (updatedMsg) => {
            setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
        };

        const handleDeletedMessage = (deletedMsgId) => {
            setMessages((prev) => prev.filter(m => m._id !== deletedMsgId));
        };

        const handleChatCleared = () => {
            setMessages([]);
        };

        // Attach Listeners
        socket.on('receive_chat_message', handleNewMessage);
        socket.on('message_edited', handleEditedMessage);
        socket.on('message_deleted', handleDeletedMessage);
        socket.on('chat_cleared', handleChatCleared);

        return () => {
            socket.emit('leave_workspace', workspaceId);
            socket.off('receive_chat_message', handleNewMessage);
            socket.off('message_edited', handleEditedMessage);
            socket.off('message_deleted', handleDeletedMessage);
            socket.off('chat_cleared', handleChatCleared);
        };
    }, [workspaceId, socket, user, onNewMessage]);


    useEffect(() => {
        if (!socket) return; 

        socket.emit('join_workspace', workspaceId);

        const handleNewMessage = (msg) => {
            console.log("Socket received message:", msg);
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
        };

        socket.on('receive_chat_message', handleNewMessage);

        return () => {
            socket.emit('leave_workspace', workspaceId);
            socket.off('receive_chat_message', handleNewMessage);
        };
    }, [workspaceId, socket]);

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // const handleSendMessage = async (e) => {
    //     e.preventDefault();
    //     if (!chatInput.trim()) return;

    //     try {
    //         await api.post(`/workspaces/${workspaceId}/messages`, { text: chatInput });
    //         setChatInput('');
    //     } catch (error) {
    //         toast.error("Failed to send message");
    //     }
    // };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        // --- NEW: INTERCEPT @ai COMMAND ---
        if (chatInput.trim().toLowerCase().startsWith('@ai ')) {
            setIsGenerating(true);
            try {
                // Extract the prompt (remove '@ai ')
                const prompt = chatInput.replace(/@ai /i, '').trim();

                console.log("Sending prompt to AI:", prompt);
                const res = await api.post('/ai/generate', { prompt });
                
                // Show the suggestion instead of sending
                setAiSuggestion(res.data.text);
            } catch (error) {
                toast.error("AI generation failed");
            } finally {
                setIsGenerating(false);
            }
            return;
        }

        // --- Normal Send Logic ---
        try {
            await api.post(`/workspaces/${workspaceId}/messages`, { text: chatInput });
            setChatInput('');
            setAiSuggestion(null); // Clear suggestion if any
        } catch (error) {
            toast.error("Failed to send message");
        }
    };

    const handleEditSubmit = async (e, msgId) => {
        e.preventDefault();
        if (!editInput.trim()) return setEditingMsgId(null);
        try {
            await api.patch(`/workspaces/${workspaceId}/messages/${msgId}`, { text: editInput });
            setEditingMsgId(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Cannot edit message");
            setEditingMsgId(null);
        }
    };

    const handleDelete = async (msgId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await api.delete(`/workspaces/${workspaceId}/messages/${msgId}`);
        } catch (error) {
            toast.error("Failed to delete message");
        }
    };

    const handleClearChat = async () => {
        if (!window.confirm("Are you sure you want to delete ALL messages? This cannot be undone.")) return;
        try {
            await api.delete(`/workspaces/${workspaceId}/messages`);
        } catch (error) {
            toast.error("Failed to clear chat");
        }
    };

    return (
        <div className="flex flex-col h-[500px] w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-300">
            
            {/* --- FIX: AI BOT OVERLAY ADDED HERE --- */}
            {showAiBot && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
                    <AiBot onClose={() => setShowAiBot(false)} />
                </div>
            )}

            {/* Header */}
           <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center transition-colors duration-300">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm tracking-wide uppercase">Team Chat</h3>
                </div>




            

           <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 outline-none"
                        title="Chat Options"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <>
                            {/* Invisible overlay to close menu when clicking outside */}
                            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                            
                            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                <button 
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        handleClearChat();
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    Clear Chat
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {/* Messages Area - Light Theme Gradient / Dark Theme Solid */}
           {/* Messages Area - Light Theme Gradient / Dark Theme Solid */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-none dark:bg-gray-900 transition-colors duration-300">
                {messages.map((msg) => {
                    const isMe = user && msg.sender && (msg.sender._id === (user._id || user.id));
                    
                    return (
                        <div 
                            key={msg._id} 
                            // Add 'group' to trigger hover states on children
                            className={`group flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mb-1 px-1">
                                {msg.sender?.name || "Unknown"}
                            </span>
                            
                            <div className="flex items-center gap-2">
                                {/* Hover Action Buttons (Only visible for the sender) */}
                                {isMe && editingMsgId !== msg._id && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button onClick={() => { setEditingMsgId(msg._id); setEditInput(msg.text); }} className="p-1 text-gray-400 hover:text-blue-500" title="Edit">
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDelete(msg._id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                                            🗑️
                                        </button>
                                    </div>
                                )}

                                {/* Message Bubble or Edit Input */}
                                {editingMsgId === msg._id ? (
                                    <form onSubmit={(e) => handleEditSubmit(e, msg._id)} className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={editInput}
                                            onChange={(e) => setEditInput(e.target.value)}
                                            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded-lg outline-none text-black dark:text-white"
                                            autoFocus
                                        />
                                        <button type="button" onClick={() => setEditingMsgId(null)} className="text-xs text-gray-500">Cancel</button>
                                        <button type="submit" className="text-xs text-blue-500 font-bold">Save</button>
                                    </form>
                                ) : (
                                    <div className={`px-4 py-2.5 text-sm shadow-sm transition-colors duration-300 relative flex flex-col ${
                                        isMe 
                                        ? 'bg-blue-600 dark:bg-blue-500 text-white rounded-2xl rounded-tr-sm' 
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm'
                                    }`}>
                                        <span>{msg.text}</span>
                                        {/* Display 'edited' tag if updated */}
                                        {msg.isEdited && (
                                            <span className="text-[9px] opacity-70 text-right mt-0.5">(edited)</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>


             {/* --- NEW: AI Suggestion Preview Box --- */}
            {aiSuggestion && (
                <div className="absolute bottom-16 left-2 right-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 p-3 rounded-lg shadow-lg z-10 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase">
                        <span>✨ AI Suggestion</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {aiSuggestion}
                    </p>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => {
                                setChatInput(aiSuggestion); // Insert into input!
                                setAiSuggestion(null);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        >
                            Insert Message
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAiSuggestion(null)}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            )}



{/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 relative">
                
                <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    placeholder="Type @ai to generate, or chat..."
                    disabled={isGenerating}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 rounded-full px-5 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
                />

                {/* AI BOT BUTTON: Placed between input and send */}
                <button 
                    type="button" 
                    onClick={() => setShowAiBot(true)}
                    className="flex items-center justify-center p-2 rounded-full text-indigo-500 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors outline-none"
                    title="Open AI Bot"
                >
                    <span className="text-xl leading-none">🤖</span>
                </button>

                <button 
                    type="submit" 
                    disabled={!chatInput.trim() || isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-full px-6 py-2.5 text-sm transition-colors shadow-sm outline-none"
                >
                    {isGenerating ? '✨...' : 'Send'}
                </button>
            </form>
        </div>
    );
}