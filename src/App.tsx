import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Send, Bot, User, Paperclip, Image, ArrowRight, Sparkles, Zap, Brain, 
  Copy, Check, Settings, Moon, Sun, Maximize2, Minimize2, RefreshCw, 
  Download, Upload, Mic, MicOff, Volume2, VolumeX, Star, Heart,
  MessageSquare, Cpu, Layers, Palette, Wand2
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
  rating?: number;
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Memoized theme classes
  const themeClasses = useMemo(() => ({
    background: theme === 'dark' 
      ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900' 
      : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50',
    text: theme === 'dark' ? 'text-white' : 'text-slate-800',
    textSecondary: theme === 'dark' ? 'text-gray-300' : 'text-slate-600',
    textMuted: theme === 'dark' ? 'text-gray-400' : 'text-slate-500',
    glass: theme === 'dark' ? 'glass' : 'glass-light',
    glassStrong: theme === 'dark' ? 'glass-strong' : 'glass-strong-light'
  }), [theme]);

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
    setMessageCount(prev => prev + 1);

    // Auto-resize textarea
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
      
      // Play notification sound
      if (isSoundEnabled) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      }
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

  const formatAIResponse = (text: string) => {
    return text
      .split('\n')
      .map((paragraph, index) => (
        <p key={index} className="mb-3 last:mb-0 leading-relaxed">
          {paragraph}
        </p>
      ));
  };

  const clearChat = () => {
    setMessages([]);
    setMessageCount(0);
  };

  const exportChat = () => {
    const chatData = {
      messages,
      model: selectedModel,
      timestamp: new Date().toISOString(),
      messageCount
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

  const rateMessage = (messageId: string, rating: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ));
  };

  if (appState === 'landing') {
    return (
      <div className={`min-h-screen transition-all duration-1000 ${themeClasses.background} flex flex-col relative overflow-hidden floating-particles`}>
        
        {/* Floating Particles */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="particle" style={{ top: '10%', left: '10%' }}></div>
          <div className="particle" style={{ top: '20%', right: '20%' }}></div>
          <div className="particle" style={{ bottom: '30%', left: '30%' }}></div>
          <div className="particle" style={{ bottom: '10%', right: '10%' }}></div>
          <div className="particle" style={{ top: '50%', left: '50%' }}></div>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-8 right-8 z-20">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`${themeClasses.glass} rounded-2xl p-4 border border-white/20 hover:border-cyan-400/60 transition-all duration-500 hover:scale-110 group magnetic ripple`}
          >
            {theme === 'dark' ? (
              <Sun className="w-6 h-6 text-yellow-400 group-hover:rotate-180 transition-transform duration-700" />
            ) : (
              <Moon className="w-6 h-6 text-slate-600 group-hover:rotate-180 transition-transform duration-700" />
            )}
          </button>
        </div>

        {/* Enhanced Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-3xl animate-float animate-morphing"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-3xl animate-float-delayed animate-morphing"></div>
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-float-slow animate-morphing"></div>
          <div className="absolute top-3/4 left-1/3 w-[300px] h-[300px] bg-indigo-500/15 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-1/2 right-1/3 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        {/* Main Landing Content */}
        <div className="flex-1 flex items-center justify-center px-6 relative z-10">
          <div className="text-center max-w-6xl mx-auto animate-fade-in-up">
            
            {/* Enhanced Logo and Title */}
            <div className="mb-20">
              <div className="relative inline-block mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-75 animate-pulse-glow"></div>
                <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 shadow-2xl shadow-cyan-500/40 hover:scale-110 transition-all duration-700 cursor-pointer animate-breathe holographic">
                  <Brain className="w-16 h-16 text-white animate-pulse transform-3d" />
                </div>
              </div>
              
              <h1 className={`text-8xl md:text-[10rem] font-black mb-8 animate-pulse-glow ${themeClasses.text} transform-3d`}>
                <span className="gradient-text glow-text-strong animate-gradient">
                  NsvlLLM
                </span>
              </h1>
              
              <div className="space-y-4 animate-text-reveal">
                <p className={`text-3xl md:text-5xl font-light ${themeClasses.textSecondary} text-shadow-lg`}>
                  Премиум AI Chat
                </p>
                <p className={`text-xl md:text-2xl ${themeClasses.textMuted} max-w-3xl mx-auto leading-relaxed`}>
                  Два мощных ИИ в одном элегантном интерфейсе
                </p>
                <div className="flex items-center justify-center gap-4 mt-8">
                  <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 rounded-full border border-cyan-500/30">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-300 font-medium">Google Gemini</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-300 font-medium">Mistral AI</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
              <div className={`${themeClasses.glass} rounded-3xl p-10 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-700 hover-lift animate-slide-in-left group cursor-pointer card-premium transform-3d`}>
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className={`text-3xl font-bold mb-4 ${themeClasses.text} neon-cyan`}>
                  NsvlLLM 1
                </h3>
                <p className={`text-xl mb-3 ${themeClasses.textSecondary} font-medium`}>
                  Google Gemini API
                </p>
                <p className={`text-base ${themeClasses.textMuted} leading-relaxed`}>
                  Молниеносные и точные ответы на любые вопросы с передовыми возможностями
                </p>
                <div className="mt-6 flex items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
              
              <div className={`${themeClasses.glass} rounded-3xl p-10 border border-purple-500/30 hover:border-purple-400/60 transition-all duration-700 hover-lift animate-slide-in-up group cursor-pointer card-premium transform-3d`}>
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Zap className="w-10 h-10 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className={`text-3xl font-bold mb-4 ${themeClasses.text} neon-purple`}>
                  NsvlLLM 2
                </h3>
                <p className={`text-xl mb-3 ${themeClasses.textSecondary} font-medium`}>
                  Mistral AI API
                </p>
                <p className={`text-base ${themeClasses.textMuted} leading-relaxed`}>
                  Продвинутые возможности анализа и глубокое понимание контекста
                </p>
                <div className="mt-6 flex items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
              
              <div className={`${themeClasses.glass} rounded-3xl p-10 border border-pink-500/30 hover:border-pink-400/60 transition-all duration-700 hover-lift animate-slide-in-right group cursor-pointer card-premium transform-3d`}>
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Bot className="w-10 h-10 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className={`text-3xl font-bold mb-4 ${themeClasses.text} neon-pink`}>
                  Файлы
                </h3>
                <p className={`text-xl mb-3 ${themeClasses.textSecondary} font-medium`}>
                  Поддержка загрузки
                </p>
                <p className={`text-base ${themeClasses.textMuted} leading-relaxed`}>
                  Текст, изображения, документы и код с умным анализом
                </p>
                <div className="mt-6 flex items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </div>

            {/* Enhanced About Section */}
            <div className={`${themeClasses.glass} rounded-3xl p-12 mb-20 border border-white/15 hover:border-white/25 transition-all duration-700 hover-lift group liquid-bg`}>
              <div className="relative z-10">
                <h2 className={`text-5xl font-bold mb-10 glow-text-strong ${themeClasses.text} gradient-text`}>
                  О проекте
                </h2>
                <div className={`leading-relaxed space-y-8 text-xl ${themeClasses.textSecondary} max-w-4xl mx-auto`}>
                  <p className="text-2xl font-light">
                    <span className="neon-cyan font-bold">NsvlLLM</span> — это премиум чат-ассистент нового поколения, 
                    объединяющий лучшие искусственные интеллекты в одном элегантном интерфейсе.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    <div className="space-y-4">
                      <h4 className="text-2xl font-bold neon-purple">Технологии</h4>
                      <ul className="space-y-2 text-lg">
                        <li className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-cyan-400" />
                          Google Gemini 1.5 Flash
                        </li>
                        <li className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-purple-400" />
                          Mistral AI Small
                        </li>
                        <li className="flex items-center gap-3">
                          <Palette className="w-5 h-5 text-pink-400" />
                          Премиум дизайн
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-2xl font-bold neon-pink">Возможности</h4>
                      <ul className="space-y-2 text-lg">
                        <li className="flex items-center gap-3">
                          <Upload className="w-5 h-5 text-emerald-400" />
                          Загрузка файлов
                        </li>
                        <li className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-blue-400" />
                          Экспорт чатов
                        </li>
                        <li className="flex items-center gap-3">
                          <Wand2 className="w-5 h-5 text-orange-400" />
                          Умные анимации
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced CTA Button */}
            <div className="relative">
              <button
                onClick={() => setAppState('chat')}
                className="group btn-primary text-white px-20 py-10 rounded-3xl text-3xl font-bold transition-all duration-700 shadow-2xl glow-box-strong animate-button-pulse magnetic ripple"
              >
                <span className="flex items-center gap-6 relative z-10">
                  <MessageSquare className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500" />
                  Начать чат с ИИ
                  <ArrowRight className="w-10 h-10 group-hover:translate-x-4 transition-transform duration-500" />
                </span>
              </button>
              
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 -z-10"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="relative z-10 py-10 text-center">
          <div className={`${themeClasses.glass} rounded-2xl p-6 max-w-2xl mx-auto border border-white/10`}>
            <p className={`text-lg ${themeClasses.textMuted} mb-2`}>
              © 2025 NsvlLLM Project
            </p>
            <p className={`text-sm ${themeClasses.textMuted}`}>
              Премиум экспериментальная версия с улучшенным дизайном и функционалом
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-1000 ${themeClasses.background} flex flex-col relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''} floating-particles`}>
      
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-3xl animate-float animate-morphing"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-3xl animate-float-delayed animate-morphing"></div>
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-float-slow animate-morphing"></div>
        <div className="absolute top-3/4 left-1/3 w-[300px] h-[300px] bg-indigo-500/15 rounded-full blur-2xl animate-float"></div>
      </div>

      {/* Enhanced Header */}
      <header className="relative z-10 py-8 px-6 border-b border-white/15 backdrop-blur-xl">
        <div className="max-w-8xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setAppState('landing')}
            className={`flex items-center gap-5 transition-all duration-500 group magnetic ${themeClasses.text} hover:text-cyan-400`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40 group-hover:scale-110 transition-transform duration-500 holographic">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold glow-text gradient-text">NsvlLLM</h1>
              <p className={`text-lg ${themeClasses.textMuted} font-medium`}>
                Премиум AI Chat
              </p>
            </div>
          </button>
          
          <div className="flex items-center gap-6">
            {/* Chat Stats */}
            <div className={`${themeClasses.glass} rounded-2xl px-6 py-4 border border-white/15`}>
              <div className="text-center">
                <p className={`text-sm ${themeClasses.textMuted}`}>Сообщений:</p>
                <p className={`text-2xl font-bold ${themeClasses.text}`}>{messageCount}</p>
              </div>
            </div>
            
            {/* Model Info */}
            <div className="text-right">
              <p className={`text-sm ${themeClasses.textMuted}`}>Активная модель:</p>
              <p className={`font-bold text-lg ${themeClasses.text}`}>
                {selectedModel === 'gemini' ? (
                  <span className="neon-cyan">NsvlLLM 1 (Gemini)</span>
                ) : (
                  <span className="neon-purple">NsvlLLM 2 (Mistral)</span>
                )}
              </p>
            </div>
            
            {/* Control Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="btn-secondary p-4 rounded-2xl transition-all duration-500 hover:scale-110 magnetic ripple"
                title="Переключить тему"
              >
                {theme === 'dark' ? (
                  <Sun className="w-6 h-6 text-yellow-400" />
                ) : (
                  <Moon className="w-6 h-6 text-slate-600" />
                )}
              </button>
              
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="btn-secondary p-4 rounded-2xl transition-all duration-500 hover:scale-110 magnetic ripple"
                title="Звуковые уведомления"
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-6 h-6 text-green-400" />
                ) : (
                  <VolumeX className="w-6 h-6 text-red-400" />
                )}
              </button>
              
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="btn-secondary p-4 rounded-2xl transition-all duration-500 hover:scale-110 magnetic ripple"
                title="Полноэкранный режим"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-6 h-6 text-cyan-400" />
                ) : (
                  <Maximize2 className="w-6 h-6 text-cyan-400" />
                )}
              </button>
              
              <button
                onClick={exportChat}
                className="btn-secondary p-4 rounded-2xl transition-all duration-500 hover:scale-110 magnetic ripple"
                title="Экспорт чата"
                disabled={messages.length === 0}
              >
                <Download className="w-6 h-6 text-blue-400" />
              </button>
              
              <button
                onClick={clearChat}
                className="btn-secondary p-4 rounded-2xl transition-all duration-500 hover:scale-110 magnetic ripple"
                title="Очистить чат"
                disabled={messages.length === 0}
              >
                <RefreshCw className="w-6 h-6 text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Chat Interface */}
      <main className="flex-1 flex flex-col max-w-8xl mx-auto w-full px-6 pb-6 relative z-10">
        <div className={`flex-1 ${themeClasses.glassStrong} rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-fade-in-up hover:border-white/25 transition-all duration-700 hover-glow`}>
          
          {/* Enhanced Messages Area */}
          <div className={`${isFullscreen ? 'h-[calc(100vh-280px)]' : 'h-96 md:h-[700px]'} overflow-y-auto p-10 space-y-10 scrollbar-premium transition-all duration-700`}>
            {messages.length === 0 && (
              <div className="text-center mt-32 animate-text-reveal">
                <div className="relative inline-block mb-12">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full blur-2xl opacity-75 animate-pulse-glow"></div>
                  <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 shadow-2xl shadow-cyan-500/40 animate-breathe holographic">
                    <Bot className="w-14 h-14 text-white animate-pulse" />
                  </div>
                </div>
                
                <h2 className={`text-5xl font-bold mb-8 glow-text-strong ${themeClasses.text} gradient-text`}>
                  Добро пожаловать в NsvlLLM!
                </h2>
                
                <p className={`text-2xl mb-8 ${themeClasses.textSecondary} max-w-3xl mx-auto leading-relaxed`}>
                  Задайте любой вопрос и получите ответ от продвинутого ИИ
                </p>
                
                <div className={`${themeClasses.glass} rounded-3xl p-8 max-w-2xl mx-auto border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-500 hover-lift`}>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <p className={`text-lg font-medium ${themeClasses.text}`}>
                      Система готова к работе
                    </p>
                  </div>
                  <p className={`text-base ${themeClasses.textSecondary}`}>
                    Активная модель: <span className="neon-cyan font-bold">
                      {selectedModel === 'gemini' ? 'NsvlLLM 1 (Google Gemini)' : 'NsvlLLM 2 (Mistral AI)'}
                    </span>
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} group`}
                style={{
                  animation: `messageSlideIn 1s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`
                }}
              >
                <div className={`flex items-start gap-6 max-w-xs md:max-w-md lg:max-w-5xl ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Enhanced Avatar */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 animate-avatar-glow relative ${
                    message.isUser 
                      ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-purple-500/60' 
                      : 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 shadow-cyan-500/60'
                  }`}>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                    {message.isUser ? (
                      <User className="w-8 h-8 text-white relative z-10" />
                    ) : (
                      <Bot className="w-8 h-8 text-white animate-pulse relative z-10" />
                    )}
                  </div>

                  {/* Enhanced Message Content */}
                  <div className={`relative rounded-3xl px-8 py-6 shadow-2xl backdrop-blur-xl border transition-all duration-700 hover:scale-[1.02] hover:shadow-3xl group-hover:shadow-4xl ${
                    message.isUser
                      ? 'message-user text-white shadow-purple-500/40 border-purple-400/50 rounded-br-lg'
                      : 'message-ai text-gray-100 border-cyan-500/40 shadow-cyan-500/30 rounded-bl-lg'
                  }`}>
                    
                    {/* Enhanced File Attachment */}
                    {message.fileAttachment && (
                      <div className="mb-6 p-6 bg-black/50 rounded-2xl border border-white/25 backdrop-blur-sm hover:bg-black/60 transition-all duration-500">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-cyan-500/30 rounded-xl shadow-lg">
                            <Paperclip className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-white text-lg">{message.fileAttachment.name}</p>
                            <p className="text-sm text-gray-300">Файл успешно загружен и обработан</p>
                          </div>
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Message Text */}
                    <div className="text-lg md:text-xl leading-relaxed font-premium">
                      {message.isUser ? (
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {formatAIResponse(message.text)}
                        </div>
                      )}
                    </div>

                    {/* Enhanced Message Footer */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/15">
                      <div className={`text-sm opacity-80 flex items-center gap-3 ${
                        message.isUser ? 'text-purple-100' : 'text-cyan-200'
                      }`}>
                        <span className="font-medium">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!message.isUser && (
                          <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20">
                            {selectedModel === 'gemini' ? 'Gemini' : 'Mistral'}
                          </span>
                        )}
                      </div>
                      
                      {!message.isUser && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                          {/* Rating */}
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => rateMessage(message.id, star)}
                                className={`transition-all duration-300 hover:scale-125 ${
                                  message.rating && star <= message.rating
                                    ? 'text-yellow-400'
                                    : 'text-gray-500 hover:text-yellow-300'
                                }`}
                              >
                                <Star className="w-4 h-4" fill={message.rating && star <= message.rating ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                          
                          {/* Copy Button */}
                          <button
                            onClick={() => copyToClipboard(message.text, message.id)}
                            className="p-2 hover:bg-white/15 rounded-xl transition-all duration-300 magnetic"
                            title="Копировать ответ"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-5 h-5 text-green-400" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-400 hover:text-white" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Enhanced AI Thinking Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-2xl shadow-cyan-500/60 flex items-center justify-center animate-avatar-glow holographic">
                    <Bot className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <div className="message-ai backdrop-blur-xl rounded-3xl rounded-bl-lg px-8 py-6 border border-cyan-500/40 shadow-2xl shadow-cyan-500/30 hover-glow">
                    <div className="flex items-center gap-6 text-cyan-200">
                      <span className="text-xl font-medium">ИИ анализирует ваш запрос</span>
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-cyan-300/70">
                      Модель: {selectedModel === 'gemini' ? 'Google Gemini 1.5 Flash' : 'Mistral AI Small'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="p-10 border-t border-white/15 bg-black/30 backdrop-blur-xl">
            
            {/* Enhanced File Upload Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-cyan-400 px-8 py-4 rounded-2xl transition-all duration-500 hover:scale-110 group flex items-center gap-4 magnetic ripple"
                title="Загрузить текстовый файл"
              >
                <Paperclip className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
                <span className="font-bold text-lg">Файл</span>
              </button>
              
              <button
                onClick={() => imageInputRef.current?.click()}
                className="btn-secondary text-purple-400 px-8 py-4 rounded-2xl transition-all duration-500 hover:scale-110 group flex items-center gap-4 magnetic ripple"
                title="Загрузить изображение"
              >
                <Image className="w-6 h-6 group-hover:scale-110 transition-transform duration-500" />
                <span className="font-bold text-lg">Изображение</span>
              </button>
              
              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className={`btn-secondary px-8 py-4 rounded-2xl transition-all duration-500 hover:scale-110 group flex items-center gap-4 magnetic ripple ${
                  isVoiceEnabled ? 'text-green-400' : 'text-gray-400'
                }`}
                title="Голосовой ввод"
              >
                {isVoiceEnabled ? (
                  <Mic className="w-6 h-6 animate-pulse" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
                <span className="font-bold text-lg">Голос</span>
              </button>
            </div>

            {/* Enhanced Message Input */}
            <div className="flex gap-6 items-end mb-8">
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-50"></div>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={autoResizeTextarea}
                  onKeyPress={handleKeyPress}
                  placeholder="Напишите ваше сообщение..."
                  className={`relative w-full backdrop-blur-xl border rounded-2xl px-8 py-6 pr-20 focus:outline-none transition-all duration-500 resize-none scrollbar-premium font-premium text-lg ${
                    theme === 'dark'
                      ? 'bg-slate-800/80 text-white placeholder-gray-400 border-purple-500/40 focus:border-cyan-500 focus:shadow-xl focus:shadow-cyan-500/30'
                      : 'bg-white/80 text-slate-800 placeholder-slate-400 border-slate-300/50 focus:border-cyan-500 focus:shadow-xl focus:shadow-cyan-500/30'
                  } hover:border-cyan-400/60`}
                  style={{ minHeight: '64px', maxHeight: '200px' }}
                  disabled={isLoading}
                />
                
                {/* Character Counter */}
                <div className="absolute bottom-3 right-20 text-xs text-gray-500">
                  {inputText.length}/2000
                </div>
              </div>
              
              <button
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="btn-primary p-6 rounded-2xl transition-all duration-500 shadow-2xl hover:shadow-cyan-500/50 hover:scale-110 disabled:scale-100 disabled:shadow-none group disabled:opacity-50 magnetic ripple"
              >
                {isLoading ? (
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Send className="w-8 h-8 text-white transform group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" />
                )}
              </button>
            </div>

            {/* Enhanced Model Selector */}
            <div className="flex justify-center">
              <div className={`${themeClasses.glassStrong} rounded-3xl p-4 border border-white/20 shadow-2xl hover:border-white/30 transition-all duration-500 hover-glow`}>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedModel('gemini')}
                    className={`flex items-center gap-4 px-10 py-6 rounded-2xl transition-all duration-500 font-bold text-lg magnetic ripple ${
                      selectedModel === 'gemini'
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-xl shadow-cyan-500/40 scale-105 glow-box'
                        : `${themeClasses.textSecondary} hover:text-white hover:bg-white/10 hover:scale-105`
                    }`}
                  >
                    <div className="relative">
                      <Sparkles className="w-8 h-8" />
                      {selectedModel === 'gemini' && (
                        <div className="absolute inset-0 bg-white/30 rounded-full blur-lg animate-pulse"></div>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-black">NsvlLLM 1</div>
                      <div className="text-sm opacity-90 font-medium">Google Gemini</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedModel('mistral')}
                    className={`flex items-center gap-4 px-10 py-6 rounded-2xl transition-all duration-500 font-bold text-lg magnetic ripple ${
                      selectedModel === 'mistral'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-xl shadow-purple-500/40 scale-105 glow-box'
                        : `${themeClasses.textSecondary} hover:text-white hover:bg-white/10 hover:scale-105`
                    }`}
                  >
                    <div className="relative">
                      <Zap className="w-8 h-8" />
                      {selectedModel === 'mistral' && (
                        <div className="absolute inset-0 bg-white/30 rounded-full blur-lg animate-pulse"></div>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-black">NsvlLLM 2</div>
                      <div className="text-sm opacity-90 font-medium">Mistral AI</div>
                    </div>
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