import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Paperclip, Image, ArrowRight, Sparkles, Zap, Brain, 
  Copy, Check, Moon, Sun, Download, RefreshCw, MessageSquare
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  fileAttachment?: {
    name: string;
    type: string;
    content: string;
  };
}

type ModelType = 'gemini' | 'mistral';
type AppState = 'landing' | 'chat';
type Theme = 'dark' | 'light';

const GEMINI_API_KEY = 'AIzaSyBO9uGNMtrgbCpII_dX4GQFyBQSICyFni8';
const MISTRAL_API_KEY = 'jtuFL14sevCZ2OwdiJsEBIDRjOhuGJuV';

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini');
  const [theme, setTheme] = useState<Theme>('dark');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callGeminiAPI = async (text: string) => {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: text,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Gemini API');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Извините, не удалось получить ответ.';
  };

  const callMistralAPI = async (text: string) => {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Mistral API');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Извините, не удалось получить ответ.';
  };

  const sendMessage = async (messageText?: string, attachment?: Message['fileAttachment']) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
      fileAttachment: attachment,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = '64px';
    }

    try {
      let aiResponse: string;
      
      if (selectedModel === 'gemini') {
        aiResponse = await callGeminiAPI(textToSend);
      } else {
        aiResponse = await callMistralAPI(textToSend);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Извините, произошла ошибка при обращении к AI. Проверьте подключение к интернету и попробуйте еще раз.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const attachment = {
        name: file.name,
        type: file.type,
        content: content,
      };
      
      sendMessage(`Загружен файл: ${file.name}`, attachment);
    };
    
    if (file.type.startsWith('text/')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const exportChat = () => {
    const chatData = {
      messages,
      model: selectedModel,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nsvl-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = '64px';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    setInputText(textarea.value);
  };

  if (appState === 'landing') {
    return (
      <div className={`min-h-screen transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      } flex flex-col relative overflow-hidden`}>
        
        {/* Theme Toggle */}
        <div className="absolute top-8 right-8 z-20">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`${theme === 'dark' ? 'glass' : 'glass-light'} rounded-xl p-3 transition-all duration-300 hover:scale-110`}
          >
            {theme === 'dark' ? (
              <Sun className="w-6 h-6 text-yellow-400" />
            ) : (
              <Moon className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>

        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 relative z-10">
          <div className="text-center max-w-6xl mx-auto animate-fade-in">
            
            {/* Logo and Title */}
            <div className="mb-16">
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl mx-auto">
                  <Brain className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h1 className={`text-6xl md:text-8xl font-black mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>
                <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  NsvlLLM
                </span>
              </h1>
              
              <div className="space-y-4">
                <p className={`text-2xl md:text-3xl font-light ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  Премиум AI Chat
                </p>
                <p className={`text-lg md:text-xl ${
                  theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                } max-w-2xl mx-auto`}>
                  Два мощных ИИ в одном элегантном интерфейсе
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className={`${theme === 'dark' ? 'glass' : 'glass-light'} rounded-2xl p-8 transition-all duration-300 hover:scale-105`}>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  NsvlLLM 1
                </h3>
                <p className={`text-lg mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  Google Gemini API
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                }`}>
                  Молниеносные и точные ответы на любые вопросы
                </p>
              </div>
              
              <div className={`${theme === 'dark' ? 'glass' : 'glass-light'} rounded-2xl p-8 transition-all duration-300 hover:scale-105`}>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  NsvlLLM 2
                </h3>
                <p className={`text-lg mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  Mistral AI API
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                }`}>
                  Продвинутые возможности анализа и понимание контекста
                </p>
              </div>
              
              <div className={`${theme === 'dark' ? 'glass' : 'glass-light'} rounded-2xl p-8 transition-all duration-300 hover:scale-105`}>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  Файлы
                </h3>
                <p className={`text-lg mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  Поддержка загрузки
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                }`}>
                  Текст, изображения, документы и код
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setAppState('chat')}
              className="btn-primary text-white px-12 py-6 rounded-2xl text-xl font-bold transition-all duration-300 shadow-xl inline-flex items-center gap-4"
            >
              <MessageSquare className="w-6 h-6" />
              Начать чат с ИИ
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 py-8 text-center">
          <div className={`${theme === 'dark' ? 'glass' : 'glass-light'} rounded-xl p-4 max-w-lg mx-auto`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
            }`}>
              © 2025 NsvlLLM Project - Премиум AI Chat
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    } flex flex-col relative overflow-hidden`}>
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 px-6 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setAppState('landing')}
            className={`flex items-center gap-4 transition-all duration-300 ${
              theme === 'dark' ? 'text-white hover:text-cyan-400' : 'text-slate-800 hover:text-cyan-600'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">NsvlLLM</h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
              }`}>
                Премиум AI Chat
              </p>
            </div>
          </button>
          
          <div className="flex items-center gap-4">
            <div className={`${theme === 'dark' ? 'glass' : 'glass-light'} rounded-xl px-4 py-2`}>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
              }`}>
                Модель: <span className="font-bold text-cyan-400">
                  {selectedModel === 'gemini' ? 'Gemini' : 'Mistral'}
                </span>
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="btn-secondary p-3 rounded-xl"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>
              
              <button
                onClick={exportChat}
                className="btn-secondary p-3 rounded-xl"
                disabled={messages.length === 0}
              >
                <Download className="w-5 h-5 text-blue-400" />
              </button>
              
              <button
                onClick={clearChat}
                className="btn-secondary p-3 rounded-xl"
                disabled={messages.length === 0}
              >
                <RefreshCw className="w-5 h-5 text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 pb-6 relative z-10">
        <div className={`flex-1 ${theme === 'dark' ? 'glass' : 'glass-light'} rounded-2xl border border-white/10 shadow-xl overflow-hidden animate-fade-in`}>
          
          {/* Messages Area */}
          <div className="h-96 md:h-[600px] overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center mt-20">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Bot className="w-10 h-10 text-white animate-pulse-soft" />
                </div>
                
                <h2 className={`text-3xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  Добро пожаловать в NsvlLLM!
                </h2>
                
                <p className={`text-lg mb-6 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                } max-w-2xl mx-auto`}>
                  Задайте любой вопрос и получите ответ от продвинутого ИИ
                </p>
                
                <div className={`${theme === 'dark' ? 'glass' : 'glass-light'} rounded-xl p-4 max-w-md mx-auto`}>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                  }`}>
                    Активная модель: <span className="font-bold text-cyan-400">
                      {selectedModel === 'gemini' ? 'Google Gemini' : 'Mistral AI'}
                    </span>
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} group animate-slide-in`}
              >
                <div className={`flex items-start gap-4 max-w-xs md:max-w-2xl ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                    message.isUser 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  }`}>
                    {message.isUser ? (
                      <User className="w-6 h-6 text-white" />
                    ) : (
                      <Bot className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`rounded-2xl px-6 py-4 shadow-lg backdrop-blur-xl border transition-all duration-300 ${
                    message.isUser
                      ? 'message-user text-white border-purple-400/50 rounded-br-md'
                      : 'message-ai text-gray-100 border-cyan-500/30 rounded-bl-md'
                  }`}>
                    
                    {/* File Attachment */}
                    {message.fileAttachment && (
                      <div className="mb-4 p-4 bg-black/30 rounded-xl border border-white/20">
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-5 h-5 text-cyan-400" />
                          <div>
                            <p className="font-bold text-white">{message.fileAttachment.name}</p>
                            <p className="text-xs text-gray-300">Файл загружен</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message Text */}
                    <div className="text-base leading-relaxed">
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </div>

                    {/* Message Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                      <span className={`text-xs opacity-70 ${
                        message.isUser ? 'text-purple-100' : 'text-cyan-200'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {!message.isUser && (
                        <button
                          onClick={() => copyToClipboard(message.text, message.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Bot className="w-6 h-6 text-white animate-pulse-soft" />
                  </div>
                  <div className="message-ai backdrop-blur-xl rounded-2xl rounded-bl-md px-6 py-4 border border-cyan-500/30 shadow-lg">
                    <div className="flex items-center gap-4 text-cyan-200">
                      <span className="font-medium">ИИ думает...</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-xl">
            
            {/* File Upload Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-cyan-400 px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <Paperclip className="w-4 h-4" />
                <span className="font-medium">Файл</span>
              </button>
              
              <button
                onClick={() => imageInputRef.current?.click()}
                className="btn-secondary text-purple-400 px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                <span className="font-medium">Изображение</span>
              </button>
            </div>

            {/* Message Input */}
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={autoResizeTextarea}
                  onKeyPress={handleKeyPress}
                  placeholder="Напишите ваше сообщение..."
                  className={`w-full backdrop-blur-xl border rounded-xl px-4 py-3 focus:outline-none transition-all duration-300 resize-none ${
                    theme === 'dark'
                      ? 'bg-slate-800/80 text-white placeholder-gray-400 border-purple-500/30 focus:border-cyan-500'
                      : 'bg-white/80 text-slate-800 placeholder-slate-400 border-slate-300/50 focus:border-cyan-500'
                  }`}
                  style={{ minHeight: '48px', maxHeight: '150px' }}
                  disabled={isLoading}
                />
              </div>
              
              <button
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="btn-primary p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin-slow" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            {/* Model Selector */}
            <div className="flex justify-center mt-4">
              <div className={`${theme === 'dark' ? 'glass' : 'glass-light'} rounded-xl p-2 border border-white/10`}>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedModel('gemini')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      selectedModel === 'gemini'
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                        : `${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-800 hover:bg-black/10'}`
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">NsvlLLM 1</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedModel('mistral')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      selectedModel === 'mistral'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                        : `${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-800 hover:bg-black/10'}`
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">NsvlLLM 2</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.csv,.log,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.yaml,.yml"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}

export default App;
