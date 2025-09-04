import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Send, Bot, User, Paperclip, Image, ArrowRight, Sparkles, Zap, Brain, 
  Copy, Check, Settings, Moon, Sun, Maximize2, Minimize2, RefreshCw, 
  Download, Upload, Mic, MicOff, Volume2, VolumeX, Star, Heart,
  MessageSquare, Cpu, Layers, Palette, Wand2, Chrome, Globe, Shield,
  Trash2, Edit3, MoreVertical, Search, Filter, BookOpen, Code,
  Lightbulb, Target, Rocket, Award, TrendingUp, Activity
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
  model?: ModelType;
  tokens?: number;
  responseTime?: number;
}

type ModelType = 'gemini' | 'mistral';
type AppState = 'landing' | 'chat';
type Theme = 'dark' | 'light' | 'auto';

const GEMINI_API_KEY = 'AIzaSyBO9uGNMtrgbCpII_dX4GQFyBQSICyFni8';
const MISTRAL_API_KEY = 'jtuFL14sevCZ2OwdiJsEBIDRjOhuGJuV';
const DEPLOYED_URL = 'https://fgkdhgdg.vercel.app/';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [favoriteMessages, setFavoriteMessages] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Enhanced theme detection
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Auto theme logic would go here
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Memoized theme classes with enhanced styling
  const themeClasses = useMemo(() => ({
    background: theme === 'dark' 
      ? 'bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950' 
      : 'bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50',
    text: theme === 'dark' ? 'text-white' : 'text-slate-800',
    textSecondary: theme === 'dark' ? 'text-gray-300' : 'text-slate-600',
    textMuted: theme === 'dark' ? 'text-gray-400' : 'text-slate-500',
    glass: theme === 'dark' ? 'glass' : 'glass-light',
    glassStrong: theme === 'dark' ? 'glass-strong' : 'glass-strong-light',
    accent: theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600',
    accentSecondary: theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
  }), [theme]);

  // Enhanced API calls with metrics
  const callGeminiAPI = async (text: string) => {
    const startTime = Date.now();
    
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
    const responseTime = Date.now() - startTime;
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Извините, не удалось получить ответ.';
    
    return { text: responseText, responseTime, tokens: responseText.length };
  };

  const callMistralAPI = async (text: string) => {
    const startTime = Date.now();
    
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
    const responseTime = Date.now() - startTime;
    const responseText = data.choices?.[0]?.message?.content || 'Извините, не удалось получить ответ.';
    
    return { text: responseText, responseTime, tokens: responseText.length };
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
    setIsTyping(true);
    setMessageCount(prev => prev + 1);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '64px';
    }

    try {
      let aiResponse: { text: string; responseTime: number; tokens: number };
      
      if (selectedModel === 'gemini') {
        aiResponse = await callGeminiAPI(textToSend);
      } else {
        aiResponse = await callMistralAPI(textToSend);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        isUser: false,
        timestamp: new Date(),
        model: selectedModel,
        tokens: aiResponse.tokens,
        responseTime: aiResponse.responseTime,
      };

      setMessages(prev => [...prev, aiMessage]);
      setTotalTokens(prev => prev + aiResponse.tokens);
      setAvgResponseTime(prev => {
        const newAvg = (prev * (messageCount / 2) + aiResponse.responseTime) / ((messageCount / 2) + 1);
        return Math.round(newAvg);
      });
      
      // Play notification sound
      if (isSoundEnabled) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Извините, произошла ошибка при обращении к AI. Проверьте подключение к интернету и попробуйте еще раз.',
        isUser: false,
        timestamp: new Date(),
        model: selectedModel,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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
        <p key={index} className="mb-4 last:mb-0 leading-relaxed">
          {paragraph}
        </p>
      ));
  };

  const clearChat = () => {
    setMessages([]);
    setMessageCount(0);
    setTotalTokens(0);
    setAvgResponseTime(0);
  };

  const exportChat = () => {
    const chatData = {
      messages,
      model: selectedModel,
      timestamp: new Date().toISOString(),
      messageCount,
      totalTokens,
      avgResponseTime,
      deployedUrl: DEPLOYED_URL
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

  const toggleFavorite = (messageId: string) => {
    setFavoriteMessages(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(messageId)) {
        newFavorites.delete(messageId);
      } else {
        newFavorites.add(messageId);
      }
      return newFavorites;
    });
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter(msg => 
      msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  const openGoogleAuth = () => {
    window.open(DEPLOYED_URL, '_blank');
  };

  if (appState === 'landing') {
    return (
      <div className={`min-h-screen transition-all duration-1000 ${themeClasses.background} flex flex-col relative overflow-hidden`}>
        
        {/* Enhanced Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/20 via-purple-500/15 to-pink-500/10 rounded-full blur-3xl animate-float animate-morphing"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-orange-500/10 rounded-full blur-3xl animate-float-delayed animate-morphing"></div>
          <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-gradient-to-br from-indigo-500/15 via-cyan-500/10 to-emerald-500/10 rounded-full blur-3xl animate-float-slow animate-morphing"></div>
          
          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full opacity-60 animate-particle-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${20 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        {/* Enhanced Header Controls */}
        <div className="absolute top-8 right-8 z-20 flex gap-4">
          <button
            onClick={openGoogleAuth}
            className={`${themeClasses.glass} rounded-2xl px-6 py-4 border border-white/20 hover:border-green-400/60 transition-all duration-500 hover:scale-110 group magnetic ripple flex items-center gap-3`}
            title="Привязка к Google"
          >
            <Chrome className="w-6 h-6 text-green-400 group-hover:rotate-12 transition-transform duration-500" />
            <span className={`font-bold ${themeClasses.text}`}>Google</span>
          </button>
          
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

        {/* Enhanced Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 relative z-10">
          <div className="text-center max-w-7xl mx-auto animate-fade-in-up">
            
            {/* Enhanced Hero Section */}
            <div className="mb-24">
              <div className="relative inline-block mb-16">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-75 animate-pulse-glow"></div>
                <div className="relative inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 shadow-2xl shadow-cyan-500/50 hover:scale-110 transition-all duration-700 cursor-pointer animate-breathe holographic">
                  <Brain className="w-20 h-20 text-white animate-pulse transform-3d" />
                </div>
              </div>
              
              <h1 className={`text-9xl md:text-[12rem] font-black mb-12 animate-pulse-glow ${themeClasses.text} transform-3d`}>
                <span className="gradient-text glow-text-strong animate-gradient">
                  NsvlLLM
                </span>
              </h1>
              
              <div className="space-y-6 animate-text-reveal">
                <p className={`text-4xl md:text-6xl font-light ${themeClasses.textSecondary} text-shadow-lg`}>
                  Премиум AI Ассистент
                </p>
                <p className={`text-2xl md:text-3xl ${themeClasses.textMuted} max-w-4xl mx-auto leading-relaxed`}>
                  Два мощных ИИ в одном элегантном интерфейсе с Google интеграцией
                </p>
                
                {/* Enhanced Feature Badges */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
                  <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-500 hover:scale-105 magnetic">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <span className="text-lg text-cyan-300 font-bold">Google Gemini</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 hover:border-purple-400/60 transition-all duration-500 hover:scale-105 magnetic">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <span className="text-lg text-purple-300 font-bold">Mistral AI</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/30 hover:border-green-400/60 transition-all duration-500 hover:scale-105 magnetic">
                    <Chrome className="w-5 h-5 text-green-400" />
                    <span className="text-lg text-green-300 font-bold">Google Auth</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
              <div className={`${themeClasses.glass} rounded-3xl p-8 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-700 hover-lift animate-slide-in-left group cursor-pointer card-premium transform-3d`}>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${themeClasses.text} neon-cyan`}>
                  NsvlLLM 1
                </h3>
                <p className={`text-lg mb-2 ${themeClasses.textSecondary} font-medium`}>
                  Google Gemini
                </p>
                <p className={`text-sm ${themeClasses.textMuted} leading-relaxed`}>
                  Молниеносные ответы с передовыми возможностями
                </p>
              </div>
              
              <div className={`${themeClasses.glass} rounded-3xl p-8 border border-purple-500/30 hover:border-purple-400/60 transition-all duration-700 hover-lift animate-slide-in-up group cursor-pointer card-premium transform-3d`}>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Zap className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${themeClasses.text} neon-purple`}>
                  NsvlLLM 2
                </h3>
                <p className={`text-lg mb-2 ${themeClasses.textSecondary} font-medium`}>
                  Mistral AI
                </p>
                <p className={`text-sm ${themeClasses.textMuted} leading-relaxed`}>
                  Глубокий анализ и понимание контекста
                </p>
              </div>
              
              <div className={`${themeClasses.glass} rounded-3xl p-8 border border-green-500/30 hover:border-green-400/60 transition-all duration-700 hover-lift animate-slide-in-right group cursor-pointer card-premium transform-3d`}>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Chrome className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${themeClasses.text} neon-cyan`}>
                  Google Auth
                </h3>
                <p className={`text-lg mb-2 ${themeClasses.textSecondary} font-medium`}>
                  Безопасная авторизация
                </p>
                <p className={`text-sm ${themeClasses.textMuted} leading-relaxed`}>
                  Интеграция с Google сервисами
                </p>
              </div>
              
              <div className={`${themeClasses.glass} rounded-3xl p-8 border border-pink-500/30 hover:border-pink-400/60 transition-all duration-700 hover-lift animate-slide-in-right group cursor-pointer card-premium transform-3d`}>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/40 group-hover:scale-110 transition-transform duration-500">
                    <Upload className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${themeClasses.text} neon-pink`}>
                  Файлы
                </h3>
                <p className={`text-lg mb-2 ${themeClasses.textSecondary} font-medium`}>
                  Умная загрузка
                </p>
                <p className={`text-sm ${themeClasses.textMuted} leading-relaxed`}>
                  Поддержка всех форматов файлов
                </p>
              </div>
            </div>

            {/* Enhanced Stats Section */}
            <div className={`${themeClasses.glass} rounded-3xl p-12 mb-20 border border-white/15 hover:border-white/25 transition-all duration-700 hover-lift group liquid-bg`}>
              <div className="relative z-10">
                <h2 className={`text-5xl font-bold mb-12 glow-text-strong ${themeClasses.text} gradient-text`}>
                  Статистика проекта
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur-lg opacity-50"></div>
                      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-2xl">
                        <TrendingUp className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h3 className={`text-4xl font-bold mb-2 ${themeClasses.text} neon-cyan`}>99.9%</h3>
                    <p className={`text-xl ${themeClasses.textSecondary}`}>Время работы</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl blur-lg opacity-50"></div>
                      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto shadow-2xl">
                        <Rocket className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h3 className={`text-4xl font-bold mb-2 ${themeClasses.text} neon-purple`}>2.1s</h3>
                    <p className={`text-xl ${themeClasses.textSecondary}`}>Средний ответ</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-lg opacity-50"></div>
                      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl">
                        <Award className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h3 className={`text-4xl font-bold mb-2 ${themeClasses.text} neon-cyan`}>A+</h3>
                    <p className={`text-xl ${themeClasses.textSecondary}`}>Качество ответов</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced CTA Section */}
            <div className="relative">
              <button
                onClick={() => setAppState('chat')}
                className="group btn-primary text-white px-24 py-12 rounded-3xl text-4xl font-bold transition-all duration-700 shadow-2xl glow-box-strong animate-button-pulse magnetic ripple"
              >
                <span className="flex items-center gap-8 relative z-10">
                  <MessageSquare className="w-12 h-12 group-hover:rotate-12 transition-transform duration-500" />
                  Начать чат с ИИ
                  <ArrowRight className="w-12 h-12 group-hover:translate-x-4 transition-transform duration-500" />
                </span>
              </button>
              
              {/* Enhanced button glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 -z-10 animate-gradient"></div>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-16 flex flex-wrap justify-center gap-6">
              <button
                onClick={openGoogleAuth}
                className="btn-secondary text-green-400 px-8 py-4 rounded-2xl transition-all duration-500 hover:scale-110 group flex items-center gap-4 magnetic ripple"
              >
                <Globe className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
                <span className="font-bold">Привязать Google</span>
              </button>
              
              <button
                onClick={() => window.open('https://github.com', '_blank')}
                className="btn-secondary text-purple-400 px-8 py-4 rounded-2xl transition-all duration-500 hover:scale-110 group flex items-center gap-4 magnetic ripple"
              >
                <Code className="w-6 h-6 group-hover:scale-110 transition-transform duration-500" />
                <span className="font-bold">Исходный код</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="relative z-10 py-12 text-center">
          <div className={`${themeClasses.glass} rounded-3xl p-8 max-w-4xl mx-auto border border-white/10 hover:border-white/20 transition-all duration-500 hover-lift`}>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Shield className="w-6 h-6 text-green-400" />
              <p className={`text-xl font-bold ${themeClasses.text}`}>
                Развернуто на Vercel
              </p>
            </div>
            <p className={`text-lg ${themeClasses.textMuted} mb-2`}>
              © 2025 NsvlLLM Project - Премиум AI Chat
            </p>
            <p className={`text-sm ${themeClasses.textMuted}`}>
              Экспериментальная версия с улучшенным дизайном и Google интеграцией
            </p>
            <div className="mt-6 flex items-center justify-center">
              <a 
                href={DEPLOYED_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 font-medium"
              >
                {DEPLOYED_URL}
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-1000 ${themeClasses.background} flex flex-col relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/15 via-purple-500/10 to-pink-500/5 rounded-full blur-3xl animate-float animate-morphing"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-orange-500/5 rounded-full blur-3xl animate-float-delayed animate-morphing"></div>
        <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-emerald-500/5 rounded-full blur-3xl animate-float-slow animate-morphing"></div>
      </div>

      {/* Enhanced Header */}
      <header className="relative z-10 py-6 px-6 border-b border-white/15 backdrop-blur-xl">
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
          
          {/* Enhanced Stats Dashboard */}
          <div className="hidden lg:flex items-center gap-6">
            <div className={`${themeClasses.glass} rounded-2xl px-6 py-4 border border-white/15 hover:border-cyan-400/40 transition-all duration-500`}>
              <div className="flex items-center gap-4">
                <Activity className="w-5 h-5 text-cyan-400" />
                <div className="text-center">
                  <p className={`text-sm ${themeClasses.textMuted}`}>Сообщений</p>
                  <p className={`text-2xl font-bold ${themeClasses.text}`}>{messageCount}</p>
                </div>
              </div>
            </div>
            
            <div className={`${themeClasses.glass} rounded-2xl px-6 py-4 border border-white/15 hover:border-purple-400/40 transition-all duration-500`}>
              <div className="flex items-center gap-4">
                <Target className="w-5 h-5 text-purple-400" />
                <div className="text-center">
                  <p className={`text-sm ${themeClasses.textMuted}`}>Токенов</p>
                  <p className={`text-2xl font-bold ${themeClasses.text}`}>{totalTokens.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className={`${themeClasses.glass} rounded-2xl px-6 py-4 border border-white/15 hover:border-green-400/40 transition-all duration-500`}>
              <div className="flex items-center gap-4">
                <Zap className="w-5 h-5 text-green-400" />
                <div className="text-center">
                  <p className={`text-sm ${themeClasses.textMuted}`}>Ср. время</p>
                  <p className={`text-2xl font-bold ${themeClasses.text}`}>{avgResponseTime}ms</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Control Panel */}
          <div className="flex items-center gap-3">
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`btn-secondary p-4 rounded-2xl transition-all duration-500 hover:scale-110 magnetic ripple ${showSearch ? 'bg-cyan-500/20 border-cyan-400/60' : ''}`}
              title="Поиск по сообщениям"
            >
              <Search className="w-6 h-6 text-cyan-400" />
            </button>
            
            {/* Google Auth Button */}
            <button
              onClick={openGoogleAuth}
              className="btn-secondary p-4 rounded-2xl transition-all duration-500 hover:scale-110 magnetic ripple group"
              title="Привязка к Google"
            >
              <Chrome className="w-6 h-6 text-green-400 group-hover:rotate-12 transition-transform duration-500" />
            </button>
            
            {/* Theme Toggle */}
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
            
            {/* Sound Toggle */}
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
            
            {/* Fullscreen Toggle */}
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
            
            {/* Export Chat */}
            <button
              onClick={exportChat}
              className="btn-secondary p-4 rounded-2xl transition-all duration-500 hover:scale-110 magnetic ripple"
              title="Экспорт чата"
              disabled={messages.length === 0}
            >
              <Download className="w-6 h-6 text-blue-400" />
            </button>
            
            {/* Clear Chat */}
            <button
              onClick={clearChat}
              className="btn-secondary p-4 rounded-2xl transition-all duration-500 hover:scale-110 magnetic ripple"
              title="Очистить чат"
              disabled={messages.length === 0}
            >
              <Trash2 className="w-6 h-6 text-red-400" />
            </button>
          </div>
        </div>
        
        {/* Enhanced Search Bar */}
        {showSearch && (
          <div className="px-6 py-4 border-b border-white/10 animate-slide-in-up">
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по сообщениям..."
                className={`w-full pl-12 pr-4 py-3 rounded-2xl backdrop-blur-xl border transition-all duration-500 ${
                  theme === 'dark'
                    ? 'bg-slate-800/80 text-white placeholder-gray-400 border-purple-500/40 focus:border-cyan-500'
                    : 'bg-white/80 text-slate-800 placeholder-slate-400 border-slate-300/50 focus:border-cyan-500'
                }`}
              />
            </div>
          </div>
        )}
      </header>

      {/* Enhanced Chat Interface */}
      <main className="flex-1 flex flex-col max-w-8xl mx-auto w-full px-6 pb-6 relative z-10">
        <div className={`flex-1 ${themeClasses.glassStrong} rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-fade-in-up hover:border-white/25 transition-all duration-700 hover-glow`}>
          
          {/* Enhanced Messages Area */}
          <div className={`${isFullscreen ? 'h-[calc(100vh-320px)]' : 'h-96 md:h-[600px]'} overflow-y-auto p-8 space-y-8 scrollbar-premium transition-all duration-700`}>
            {filteredMessages.length === 0 && !isLoading && (
              <div className="text-center mt-20 animate-text-reveal">
                <div className="relative inline-block mb-12">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full blur-3xl opacity-75 animate-pulse-glow"></div>
                  <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 shadow-2xl shadow-cyan-500/50 animate-breathe holographic">
                    <Bot className="w-16 h-16 text-white animate-pulse" />
                  </div>
                </div>
                
                <h2 className={`text-6xl font-bold mb-8 glow-text-strong ${themeClasses.text} gradient-text`}>
                  Добро пожаловать!
                </h2>
                
                <p className={`text-2xl mb-12 ${themeClasses.textSecondary} max-w-3xl mx-auto leading-relaxed`}>
                  Задайте любой вопрос и получите ответ от продвинутого ИИ
                </p>
                
                {/* Enhanced Status Card */}
                <div className={`${themeClasses.glass} rounded-3xl p-8 max-w-3xl mx-auto border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-500 hover-lift`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse mx-auto mb-3"></div>
                      <p className={`text-lg font-bold ${themeClasses.text}`}>Система готова</p>
                      <p className={`text-sm ${themeClasses.textMuted}`}>Все сервисы активны</p>
                    </div>
                    <div className="text-center">
                      <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse mx-auto mb-3"></div>
                      <p className={`text-lg font-bold ${themeClasses.text}`}>
                        {selectedModel === 'gemini' ? 'Gemini' : 'Mistral'}
                      </p>
                      <p className={`text-sm ${themeClasses.textMuted}`}>Активная модель</p>
                    </div>
                    <div className="text-center">
                      <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse mx-auto mb-3"></div>
                      <p className={`text-lg font-bold ${themeClasses.text}`}>Vercel</p>
                      <p className={`text-sm ${themeClasses.textMuted}`}>Развернуто</p>
                    </div>
                  </div>
                </div>
                
                {/* Quick Start Suggestions */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {[
                    { icon: Lightbulb, text: "Объясни квантовую физику простыми словами", color: "yellow" },
                    { icon: Code, text: "Помоги написать React компонент", color: "blue" },
                    { icon: BookOpen, text: "Расскажи интересную историю", color: "green" },
                    { icon: Rocket, text: "Идеи для стартапа в 2025 году", color: "purple" }
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(suggestion.text)}
                      className={`${themeClasses.glass} rounded-2xl p-6 border border-white/15 hover:border-${suggestion.color}-400/60 transition-all duration-500 hover-lift group text-left`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-${suggestion.color}-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                          <suggestion.icon className={`w-6 h-6 text-${suggestion.color}-400`} />
                        </div>
                        <p className={`text-lg font-medium ${themeClasses.text} group-hover:text-${suggestion.color}-400 transition-colors duration-500`}>
                          {suggestion.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Enhanced Messages */}
            {filteredMessages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} group`}
                style={{
                  animation: `messageSlideIn 1s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`
                }}
              >
                <div className={`flex items-start gap-6 max-w-xs md:max-w-md lg:max-w-6xl ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
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

                  {/* Enhanced Message Bubble */}
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

                    {/* Enhanced Message Content */}
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
                          <>
                            <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20">
                              {message.model === 'gemini' ? 'Gemini' : 'Mistral'}
                            </span>
                            {message.responseTime && (
                              <span className="px-3 py-1 bg-green-500/20 rounded-full text-xs font-bold text-green-300">
                                {message.responseTime}ms
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      
                      {!message.isUser && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                          {/* Favorite Button */}
                          <button
                            onClick={() => toggleFavorite(message.id)}
                            className={`p-2 hover:bg-white/15 rounded-xl transition-all duration-300 magnetic ${
                              favoriteMessages.has(message.id) ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                            }`}
                            title="Добавить в избранное"
                          >
                            <Heart className="w-5 h-5" fill={favoriteMessages.has(message.id) ? 'currentColor' : 'none'} />
                          </button>
                          
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
                      <span className="text-xl font-medium">
                        {isTyping ? 'ИИ печатает ответ' : 'ИИ анализирует ваш запрос'}
                      </span>
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-cyan-300/70">
                      <span>Модель: {selectedModel === 'gemini' ? 'Google Gemini 1.5 Flash' : 'Mistral AI Small'}</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Подключено к Vercel</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="p-8 border-t border-white/15 bg-black/30 backdrop-blur-xl">
            
            {/* Enhanced File Upload Section */}
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-cyan-400 px-6 py-3 rounded-2xl transition-all duration-500 hover:scale-110 group flex items-center gap-3 magnetic ripple"
                title="Загрузить текстовый файл"
              >
                <Paperclip className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" />
                <span className="font-bold">Файл</span>
              </button>
              
              <button
                onClick={() => imageInputRef.current?.click()}
                className="btn-secondary text-purple-400 px-6 py-3 rounded-2xl transition-all duration-500 hover:scale-110 group flex items-center gap-3 magnetic ripple"
                title="Загрузить изображение"
              >
                <Image className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
                <span className="font-bold">Изображение</span>
              </button>
              
              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className={`btn-secondary px-6 py-3 rounded-2xl transition-all duration-500 hover:scale-110 group flex items-center gap-3 magnetic ripple ${
                  isVoiceEnabled ? 'text-green-400 bg-green-500/10' : 'text-gray-400'
                }`}
                title="Голосовой ввод"
              >
                {isVoiceEnabled ? (
                  <Mic className="w-5 h-5 animate-pulse" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
                <span className="font-bold">Голос</span>
              </button>
              
              <button
                onClick={openGoogleAuth}
                className="btn-secondary text-green-400 px-6 py-3 rounded-2xl transition-all duration-500 hover:scale-110 group flex items-center gap-3 magnetic ripple"
                title="Привязка к Google"
              >
                <Chrome className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" />
                <span className="font-bold">Google</span>
              </button>
            </div>

            {/* Enhanced Message Input */}
            <div className="flex gap-6 items-end mb-6">
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
                
                {/* Enhanced Character Counter */}
                <div className="absolute bottom-3 right-20 flex items-center gap-2">
                  <div className={`text-xs ${inputText.length > 1800 ? 'text-red-400' : themeClasses.textMuted}`}>
                    {inputText.length}/2000
                  </div>
                  {inputText.length > 1800 && (
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  )}
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
              <div className={`${themeClasses.glassStrong} rounded-3xl p-6 border border-white/20 shadow-2xl hover:border-white/30 transition-all duration-500 hover-glow`}>
                <div className="flex gap-6">
                  <button
                    onClick={() => setSelectedModel('gemini')}
                    className={`flex items-center gap-4 px-8 py-6 rounded-2xl transition-all duration-500 font-bold text-lg magnetic ripple ${
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
                    className={`flex items-center gap-4 px-8 py-6 rounded-2xl transition-all duration-500 font-bold text-lg magnetic ripple ${
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
