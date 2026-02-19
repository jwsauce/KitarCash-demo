
import React, { useState, useRef } from 'react';
import { ChatMessage, EWasteItem } from '../types';
import { analyzeImage } from '../services/geminiService';
import { UploadIcon, SendIcon } from './IconComponents';
import DataSafetyGuide from './DataSafetyGuide';
import HazardWarning from './HazardWarning';

interface ChatbotProps {
    setIdentifiedItem: (item: EWasteItem | null) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ setIdentifiedItem }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', type: 'text', content: 'Hello! Snap a picture of your e-waste to get started, or ask me a question.' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      type: 'text',
      content: inputValue,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    // Mock AI response for text messages
    setTimeout(() => {
        const aiResponse: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            type: 'text',
            content: "I'm best at analyzing images of e-waste. Please upload a photo for identification and value estimation."
        }
        setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imagePreviewUrl = URL.createObjectURL(file);
    const userMessage: ChatMessage = {
      id: `user-img-${Date.now()}`,
      sender: 'user',
      type: 'image',
      content: 'Here is my e-waste item.',
      imagePreviewUrl,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await analyzeImage(file);
      const aiResponse: ChatMessage = {
        id: `ai-analysis-${Date.now()}`,
        sender: 'ai',
        type: 'analysis',
        content: result,
      };
      setMessages(prev => [...prev, aiResponse]);
      setIdentifiedItem(result);
    } catch (error) {
      console.error('Error analyzing image:', error);
      const errorResponse: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        type: 'text',
        content: "Sorry, I couldn't analyze that image. Please try another one.",
      };
      setMessages(prev => [...prev, errorResponse]);
      setIdentifiedItem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.type === 'image' && msg.imagePreviewUrl) {
      return <img src={msg.imagePreviewUrl} alt="E-waste" className="rounded-lg max-w-xs" />;
    }
    if (msg.type === 'analysis') {
      const item = msg.content as EWasteItem;
      return (
        <div className="bg-green-50/50 p-4 rounded-lg text-gray-800">
          <h3 className="text-lg font-bold text-green-800">{item.itemName}</h3>
          <p className="text-sm text-gray-600 mb-2">Category: {item.category}</p>
          <p className="text-2xl font-bold my-2 text-green-600">
            Est. Value: RM{item.estimatedValue.min} - RM{item.estimatedValue.max}
          </p>
          <p className="text-xs italic bg-green-100/70 p-2 rounded-md">"{item.environmentalImpact}"</p>
          {item.hazardFlag && <HazardWarning item={item} />}
          {(item.category === 'phone' || item.category === 'laptop') && <DataSafetyGuide item={item} />}
        </div>
      );
    }
    return <p>{msg.content as string}</p>;
  };
  
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-lg overflow-hidden flex flex-col h-[70vh]">
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0"></div>}
            <div className={`max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-green-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
              {renderMessageContent(msg)}
            </div>
          </div>
        ))}
         {isLoading && (
            <div className="flex items-end gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0"></div>
              <div className="bg-gray-200 text-gray-800 p-3 rounded-2xl rounded-bl-none">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-300"></div>
                    <span className="text-sm">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50/70">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full bg-gray-200 text-gray-600 hover:bg-green-200 hover:text-green-800 transition-colors duration-200"
            aria-label="Upload image"
          >
            <UploadIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white text-gray-800 border border-gray-300 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button type="submit" className="p-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors duration-200" aria-label="Send message">
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
