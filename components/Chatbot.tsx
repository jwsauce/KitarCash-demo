
import React, { useState, useRef } from 'react';
import { ChatMessage, EWasteItem } from '../types';
import { analyzeImage, analyzeText } from '../services/geminiService';
import { uploadChatImage } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!inputValue.trim() || isUploading) return;

  const userMessage: ChatMessage = {
    id: `user-${Date.now()}`,
    sender: 'user',
    type: 'text',
    content: inputValue,
  };
  setMessages(prev => [...prev, userMessage]);
  setInputValue('');
  setIsLoading(true);

  try {
    const responseText = await analyzeText(inputValue);

    const aiResponse: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      type: 'text',
      content: responseText,
    };
    setMessages(prev => [...prev, aiResponse]);

  } catch (error: any) {
    const errorResponse: ChatMessage = {
      id: `ai-error-${Date.now()}`,
      sender: 'ai',
      type: 'text',
      content: `Sorry, something went wrong: ${error.message}`,
    };
    setMessages(prev => [...prev, errorResponse]);

  } finally {
    setIsLoading(false);
  }
};
  

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // 1. Log the truth
    console.log("DEBUG: Current User Object ->", user);

    // 2. The Gatekeeper: Stop if there is no user or no UID
    if (!file) return;
    if (!user || !user.id) {
        alert("Upload blocked: You must be logged in. (UID is undefined)");
        return; 
    }

    // Reset state for new upload
    e.target.value = ''; 
    setUploadError(null);
    
    // Add a temporary message with a local preview
    const localImageUrl = URL.createObjectURL(file);
    const tempMessageId = `user-img-temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempMessageId,
      sender: 'user',
      type: 'image',
      content: 'Uploading e-waste item...',
      imageUrl: localImageUrl,
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
        setUploadProgress(0);
        const downloadURL = await uploadChatImage(file, user.id, setUploadProgress);
        
        // Replace temporary message with the final one containing the Firebase URL
        setMessages(prev => prev.map(msg => 
            msg.id === tempMessageId ? { ...msg, content: 'Here is my e-waste item.', imageUrl: downloadURL } : msg
        ));

        setUploadProgress(null);
        setIsLoading(true);

        const result = await analyzeImage(file);
        const aiResponse: ChatMessage = {
            id: `ai-analysis-${Date.now()}`,
            sender: 'ai',
            type: 'analysis',
            content: result,
        };
        setMessages(prev => [...prev, aiResponse]);
        setIdentifiedItem(result);
    } catch (error: any) {
        setUploadError(error.message || "An unknown error occurred during upload.");
        // Remove the temporary message on failure
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
    } finally {
        setIsLoading(false);
        setUploadProgress(null);
        URL.revokeObjectURL(localImageUrl); // Clean up blob URL
    }
  };


  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.type === 'image' && msg.imageUrl) {
      return (
        <div>
            <img src={msg.imageUrl} alt="E-waste" className="rounded-lg max-w-xs" />
            <p className="text-xs mt-1 opacity-80">{msg.content as string}</p>
        </div>
      );
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
  
  const isUploading = uploadProgress !== null;

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
      
      {(isUploading || uploadError) && (
        <div className="px-4 pb-2">
            {isUploading && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-xs text-center text-gray-600 mt-1">Uploading... {Math.round(uploadProgress!)}%</p>
              </>
            )}
            {uploadError && (
              <p className="text-xs text-center text-red-600 mt-1">{uploadError}</p>
            )}
        </div>
      )}

      <div className="p-4 border-t border-gray-200 bg-gray-50/70">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full bg-gray-200 text-gray-600 hover:bg-green-200 hover:text-green-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Upload image"
            disabled={isUploading}
          >
            <UploadIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isUploading ? "Waiting for upload..." : "Type your message..."}
            className="flex-1 bg-white text-gray-800 border border-gray-300 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            disabled={isUploading}
          />
          <button type="submit" className="p-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors duration-200 disabled:bg-gray-400" aria-label="Send message" disabled={isUploading}>
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
