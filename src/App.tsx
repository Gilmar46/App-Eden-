import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Home, 
  Users, 
  Calendar, 
  Heart, 
  Music, 
  FileText, 
  Bell, 
  Search, 
  Plus, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Video, 
  CheckCircle2, 
  MoreHorizontal,
  Wallet,
  BookOpen,
  MessageCircle,
  BarChart3,
  UserPlus,
  LogOut,
  LogIn,
  Settings,
  Pencil,
  Pin,
  Trash2,
  Church,
  Zap,
  Copy,
  QrCode,
  HelpCircle,
  MessageSquare,
  Shield,
  ShieldCheck,
  Smile,
  X,
  ChevronLeft,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Activity,
  Play,
  TrendingUp,
  Droplets,
  CalendarDays,
  Flame,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Send,
  UserCircle,
  HandMetal,
  Languages,
  Sprout,
  TreePine,
  Volume2,
  Download,
  Printer,
  UserX
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  Timestamp,
  getDoc,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from './lib/firebase';


// EDEN_N8N_INTEGRACAO_V1
type EdenTipoRegistro = 'presenca' | 'estudo_biblico' | 'leitura_diaria';
type EdenDadosRegistro = Record<string, string | number | boolean | undefined>;

// Para uso fora da rede local, substitua por um endereco HTTPS permanente.
const EDEN_N8N_WEBHOOK_URL = "https://expose-faculty-yogurt.ngrok-free.dev/webhook/eden/registro";

const edenDataReferencia = (valor?: unknown): string => {
  const texto = String(valor || '').trim();
  const formatoIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (formatoIso) return `${formatoIso[1]}-${formatoIso[2]}-${formatoIso[3]}`;

  const formatoBrasileiro = texto.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (formatoBrasileiro) {
    return `${formatoBrasileiro[3]}-${formatoBrasileiro[2].padStart(2, '0')}-${formatoBrasileiro[1].padStart(2, '0')}`;
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

// --- Types ---
type View = 'home' | 'bible' | 'donations' | 'prayers' | 'profile' | 'ministries' | 'agenda' | 'financial' | 'spiritual' | 'more' | 'members' | 'missions' | 'chat' | 'devotionals' | 'admin' | 'lives' | 'guests' | 'courses' | 'locations' | 'announcements' | 'ai-chat' | 'news' | 'fake-news';

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
  ministry: string;
  status: 'Ativo' | 'Visitante' | 'Líder';
  userType?: 'admin' | 'lider' | 'membro';
  departmentId?: string;
  email?: string;
  phone?: string;
}

interface Comment {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: any;
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  image?: string;
  pubDate: string;
  source: string;
}

interface NewsSource {
  id: string;
  name: string;
  url: string;
  active: boolean;
}

interface DevotionalVideo {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  videoUrl: string;
  videoId: string;
  category: string;
  type: string;
  thumbnailUrl?: string;
  description?: string;
  createdAt: any;
}

interface DigitalBulletin {
  id: string;
  theme: string;
  preacher: string;
  date: string;
  jsonContent: {
    capa: {
      nome: string;
      tema: string;
      data: string;
      versiculo_destaque: string;
    };
    resumo_pregacao: string;
    licoes: string[];
    versiculos_relacionados: { referencia: string; trecho: string }[];
    aplicacao: string[];
    semana_espiritual: { dia: string; foco: string; versiculo: string; acao: string }[];
    frase_final: string;
  };
  createdAt: any;
}

const CONTRIBUTION_LEVELS = [
  { label: 'Participação', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50', min: 0, max: 50, symbol: '💧' },
  { label: 'Fidelidade', icon: Sprout, color: 'text-green-500', bg: 'bg-green-50', min: 50, max: 200, symbol: '🌱' },
  { label: 'Generosidade', icon: TreePine, color: 'text-emerald-500', bg: 'bg-emerald-50', min: 200, max: 1000, symbol: '🌳' },
  { label: 'Excelência', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', min: 1000, max: Infinity, symbol: '🔥' },
];

const getContributionLevel = (amount: number) => {
  return CONTRIBUTION_LEVELS.find(l => amount >= l.min && amount < l.max) || CONTRIBUTION_LEVELS[0];
};

const playNotificationSound = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
};

interface PrayerRequest {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  prayerCount: number;
  createdAt: any;
}

interface AgendaItem {
  id: string;
  title: string;
  time: string;
  date: string;
  description?: string;
  location?: string;
  type?: string;
  isFeatured?: boolean;
}

interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any;
  ministry?: string;
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: any;
}

interface MissionaryGoal {
  id: string;
  department: string;
  goal: number;
  collected: number;
}

interface MissionCampaign {
  id: string;
  title: string;
  totalGoal: number;
  departments: MissionaryGoal[];
  nextTargets?: { label: string, month: string }[];
}

const MOCK_CAMPAIGN: MissionCampaign = {
  id: 'missao-2026',
  title: 'Missões Mundiais 2026',
  totalGoal: 10000,
  departments: [
    { id: '1', department: 'Jovens', goal: 200, collected: 150 },
    { id: '2', department: 'Mulheres', goal: 400, collected: 280 },
    { id: '3', department: 'Homens', goal: 500, collected: 420 },
    { id: '4', department: 'Crianças', goal: 150, collected: 90 },
  ],
  nextTargets: [
    { label: 'Nacional', month: 'Setembro' },
    { label: 'Estadual', month: 'Novembro' }
  ]
};

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Gilmar Brito', avatar: 'https://picsum.photos/seed/gilmar/100', role: 'Líder', ministry: 'Louvor', status: 'Líder' },
  { id: '2', name: 'Ana Silva', avatar: 'https://picsum.photos/seed/ana/100', role: 'Membro', ministry: 'Crianças', status: 'Ativo' },
  { id: '3', name: 'Lucas Silveira', avatar: 'https://picsum.photos/seed/lucas/100', role: 'Líder', ministry: 'Mídia', status: 'Líder' },
  { id: '4', name: 'Bia Oliveira', avatar: 'https://picsum.photos/seed/bia/100', role: 'Voluntária', ministry: 'Recepção', status: 'Ativo' },
  { id: '5', name: 'Marcos Souza', avatar: 'https://picsum.photos/seed/marcos/100', role: 'Pastor', ministry: 'Pastoral', status: 'Líder' },
  { id: '6', name: 'Carla Dias', avatar: 'https://picsum.photos/seed/carla/100', role: 'Visitante', ministry: 'Nenhum', status: 'Visitante' },
  { id: '7', name: 'Tiago Lima', avatar: 'https://picsum.photos/seed/tiago/100', role: 'Membro', ministry: 'Louvor', status: 'Ativo' },
  { id: '8', name: 'Julia Martins', avatar: 'https://picsum.photos/seed/julia/100', role: 'Membro', ministry: 'Apoio', status: 'Ativo' },
];

interface Announcement {
  id: string;
  title: string;
  content: string;
  tag: string;
  date: string;
}

interface Scale {
  id: string;
  ministry: string;
  date: string;
  role: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  status: 'confirmed' | 'pending' | 'declined' | 'needs_replacement';
  replacementId?: string;
  replacementName?: string;
  notes?: string;
  createdAt: any;
}

// --- Components ---

const Logo = ({ size = 'md', className = '', glow = false }: { size?: 'sm' | 'md' | 'lg', className?: string, glow?: boolean }) => {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-24 h-24',
    lg: 'w-36 h-36'
  };
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-12 h-12',
    lg: 'w-18 h-18'
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative flex items-center justify-center ${className}`}
    >
      {glow && (
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className={`absolute inset-0 bg-primary/30 blur-3xl rounded-full ${sizes[size]}`} 
        />
      )}
      
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`${sizes[size]} bg-primary rounded-[32%] shadow-sm flex items-center justify-center relative overflow-hidden transition-all duration-500`}
      >
        {/* Modern Glass Reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30" />
        
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center relative z-10"
        >
          <Church className={`${iconSizes[size]} text-white`} strokeWidth={1.5} />
          
          {/* Minimal Connection Nodes - Accent color */}
          <div className="absolute inset-0 w-full h-full">
            {[0, 120, 240].map((rot, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                className="absolute w-1 h-1 bg-accent rounded-full"
                style={{ 
                  top: '50%', 
                  left: '50%', 
                  transform: `rotate(${rot}deg) translate(${size === 'lg' ? '40px' : '25px'})` 
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Modern Badge */}
      <motion.div 
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className={`absolute -top-1 -right-1 ${size === 'sm' ? 'w-4 h-4' : (size === 'md' ? 'w-8 h-8' : 'w-12 h-12')} bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 z-20`}
      >
        <Zap className={`${size === 'sm' ? 'w-2 h-2' : (size === 'md' ? 'w-4 h-4' : 'w-6 h-6')} text-accent fill-accent/10`} />
      </motion.div>
    </motion.div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex-1 flex flex-col items-center justify-center relative py-2 group"
  >
    <div className={`p-2.5 rounded-xl transition-all duration-300 mb-1 ${active ? 'bg-primary text-white shadow-md' : 'text-primary/40 group-hover:text-primary/60'}`}>
      <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
    </div>
    <span className={`text-[9px] font-bold tracking-tight transition-colors duration-300 ${active ? 'text-primary' : 'text-primary/30 group-hover:text-primary/50'}`}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="nav-active-dot"
        className="absolute -bottom-1 w-1 h-1 bg-accent rounded-full"
      />
    )}
  </button>
);

const SectionHeader = ({ title, action, onAction, onAdd }: { title: string, action?: string, onAction?: () => void, onAdd?: () => void }) => (
  <div className="flex items-center justify-between px-6 mb-6 pt-6">
    <div className="flex items-center space-x-3">
      <div className="h-6 w-1 bg-accent rounded-full" />
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
    </div>
    <div className="flex items-center space-x-2">
      {onAdd && (
        <button 
          onClick={onAdd}
          className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-110 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
      {action && onAction && (
        <button 
          onClick={onAction} 
          className="px-6 py-2.5 bg-card border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
        >
          {action}
        </button>
      )}
    </div>
  </div>
);

const Banner = ({ onAction, title, reference }: { onAction?: () => void, title: string, reference: string }) => {
  const dailyImage = `https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000&sig=${new Date().toISOString().split('T')[0]}`;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-6 mb-8 bg-white rounded-[20px] p-8 text-white relative overflow-hidden shadow-2xl border border-white/20 group cursor-pointer"
      onClick={onAction}
    >
      <img 
        src={dailyImage} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" 
        alt="Daily Landscape" 
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-transparent backdrop-blur-[1px]" />
      
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-8 h-[1px] bg-white/40" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 drop-shadow-md">Versículo do Dia</span>
          <div className="w-8 h-[1px] bg-white/40" />
        </div>
        
        <h1 className="text-xl md:text-2xl font-medium italic tracking-tight leading-relaxed mb-6 text-white drop-shadow-lg">
          "{title}"
        </h1>
        
        <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
          <BookOpen className="w-3.5 h-3.5 text-white" />
          <span className="text-[10px] font-bold text-white italic leading-none">{reference}</span>
        </div>
      </div>
    </motion.div>
  );
};

const AnnouncementCard = ({ id, title, tag, date, isAdmin, isPinned, onDelete, onEdit, onClick }: { id?: string, title: string, tag: string, date: string, isAdmin?: boolean, isPinned?: boolean, onDelete?: (id: string) => void, onEdit?: (id: string) => void, onClick?: () => void, key?: any }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    onClick={onClick}
    className={`flex flex-col space-y-3 p-8 bg-card rounded-[40px] border transition-all group cursor-pointer shadow-xl shadow-slate-200/20 relative active:scale-[0.98] ${
      isPinned ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/10' : 'border-slate-100 hover:border-primary/30'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary bg-primary/5 px-3 py-1.5 rounded-full ring-1 ring-primary/10">{tag}</span>
        {isPinned && (
          <div className="flex items-center space-x-1.5 bg-warning/10 text-warning px-3 py-1.5 rounded-full ring-1 ring-warning/20">
            <Pin className="w-3 h-3 fill-warning" />
            <span className="text-[9px] font-black uppercase tracking-widest">Importante</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 bg-background px-3 py-1.5 rounded-full border border-slate-100">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{date}</span>
        </div>
        {isAdmin && id && (
          <div className="flex items-center space-x-1 ml-2">
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(id); }}
                className="p-2 text-slate-400 hover:text-primary rounded-xl hover:bg-primary/5 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors text-slate-800 tracking-tight italic">{title}</h3>
    <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
        <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">Detalhes Completos</span>
    </div>
  </motion.div>
);

const EditModal = ({ title, children, isOpen, onClose }: { title: string, children: React.ReactNode, isOpen: boolean, onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-lg rounded-[40px] p-6 md:p-10 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto scrollbar-hide"
        >
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10 bg-white rounded-full shadow-sm">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 italic sticky top-0 bg-white pb-2 z-10">{title}</h2>
          <div className="pb-4">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CommentSection = ({ contentId, user, isAdmin, userRole }: { contentId: string, user: FirebaseUser | null, isAdmin: boolean, userRole: string }) => {
  const [commentText, setCommentText] = useState('');
  const commentsRef = collection(db, 'comments');
  const [commentsSnap] = useCollection(
    user ? query(commentsRef, where('contentId', '==', contentId), orderBy('createdAt', 'desc')) : null
  );

  const comments = commentsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as Comment)) || [];

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Faça login para comentar");
      return;
    }
    if (!commentText.trim()) return;

    try {
      await addDoc(commentsRef, {
        contentId,
        userId: user.uid,
        userName: user.displayName || 'Anônimo',
        userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100`,
        text: commentText,
        createdAt: Timestamp.now()
      });
      setCommentText('');
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!isAdmin && userRole !== 'lider') return;
    if (window.confirm("Deseja excluir este comentário?")) {
      try {
        await deleteDoc(doc(db, 'comments', id));
      } catch (err) {
        console.error("Erro ao excluir comentário:", err);
      }
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 border-l-4 border-primary pl-3">Comentários</h4>
      
      {user ? (
        <form onSubmit={handleAddComment} className="flex flex-col space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Digite seu comentário..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 resize-none h-24"
          />
          <button 
            type="submit"
            className="self-end px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Enviar
          </button>
        </form>
      ) : (
        <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
          <p className="text-xs font-bold text-slate-400">Faça login para comentar</p>
        </div>
      )}

      <div className="space-y-4">
        {comments.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex space-x-3">
            <img src={c.userAvatar} alt={c.userName} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-900">{c.userName}</p>
                <div className="flex items-center space-x-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {c.createdAt instanceof Timestamp ? c.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}
                  </p>
                  {(isAdmin || userRole === 'lider') && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Sem comentários até agora</p>
        )}
      </div>
    </div>
  );
};

// --- Helpers ---
const extractYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

// --- Main App ---

const LoginView = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card rounded-[48px] p-12 shadow-2xl shadow-primary/5 border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          
          <Logo size="md" className="mx-auto mb-10" glow />
          
          <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight italic">Nova Aliança</h1>
          <p className="text-sm font-medium text-slate-400 mb-10 leading-relaxed">Conectando vidas e ministérios <br/> em um só lugar.</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-primary text-white py-4.5 rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 group"
          >
            <LogIn className="w-5 h-5 text-white/50 group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Entrar com Google</span>
          </button>
          
          <p className="mt-8 text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">Eco-Sistema Ministerial v2.0</p>
        </div>
      </motion.div>
    </div>
  );
};

const MINISTRIES = ['Louvor', 'Mídia', 'Recepção', 'Crianças', 'Apoio', 'Corpo Diaconal', 'Pastoral', 'Segurança', 'Missões'];

const PersonalDataForm = ({ initialData, onSave, onBack }: { initialData: any, onSave: (data: any) => void, onBack: () => void }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    privacyMode: initialData?.privacyMode || 'leadership'
  });

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
       <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white border border-slate-100 rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Dados Cadastrais</h1>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-6">
         <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
         </div>
         <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
              <input 
                type="email" 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
           </div>
         </div>

         <div className="py-4 border-t border-slate-50">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Privacidade das Doações</h4>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div>
                  <p className="text-sm font-bold text-slate-900">Modo Anônimo</p>
                  <p className="text-[10px] text-slate-400 font-medium">Liderança não verá seu nome nas ofertas</p>
               </div>
               <button 
                 type="button"
                 onClick={() => setFormData({...formData, privacyMode: formData.privacyMode === 'anonymous' ? 'leadership' : 'anonymous'})}
                 className={`w-12 h-6 rounded-full relative transition-colors ${formData.privacyMode === 'anonymous' ? 'bg-primary' : 'bg-slate-300'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.privacyMode === 'anonymous' ? 'left-7' : 'left-1'}`} />
               </button>
            </div>
         </div>

         <button type="submit" className="w-full py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">Salvar Alterações</button>
      </form>
    </motion.div>
  );
};

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [splash, setSplash] = useState(true);
  const [activeView, setActiveView] = useState<View>('home');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAnalyzingFakeNews, setIsAnalyzingFakeNews] = useState(false);
  const [fakeNewsAnalysis, setFakeNewsAnalysis] = useState<{
    verdict: 'true' | 'false' | 'misleading' | 'unknown';
    explanation: string;
    biblicalPerspective: string;
    confidence: number;
  } | null>(null);
  const [fakeNewsInput, setFakeNewsInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [confirmedScales, setConfirmedScales] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'Todos' | 'Ativo' | 'Visitante' | 'Líder'>('Todos');
  const [ministryFilter, setMinistryFilter] = useState('Todos');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '', ministry: '', status: 'Ativo' as any, email: '', phone: '' });
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'Dízimo' | 'Oferta' | 'Missões'>('Dízimo');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'lider' | 'membro'>('membro');
  const [userDepartmentId, setUserDepartmentId] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsSources, setNewsSources] = useState<NewsSource[]>([]);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [selectedBulletin, setSelectedBulletin] = useState<DigitalBulletin | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showDevotionalForm, setShowDevotionalForm] = useState(false);
  const [newDevotional, setNewDevotional] = useState({ title: '', videoUrl: '', description: '', category: 'devocionais' });
  const [userPrayedFor, setUserPrayedFor] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [recommendedCourseIds, setRecommendedCourseIds] = useState<string[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [showInterestSelector, setShowInterestSelector] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentScaleIndex, setCurrentScaleIndex] = useState(0);
  const [activeHomeTab, setActiveHomeTab] = useState<'contributions' | 'benevolence'>('contributions');
  const [homeActiveSection, setHomeActiveSection] = useState<string>('main');
  const [showNewsTicker, setShowNewsTicker] = useState(false);
  const [bgIntensity, setBgIntensity] = useState<number>(() => {
    const saved = localStorage.getItem('bgIntensity');
    return saved ? parseInt(saved) : 50;
  });

  useEffect(() => {
    localStorage.setItem('bgIntensity', bgIntensity.toString());
  }, [bgIntensity]);

  const getDynamicStyles = () => {
    // Base colors inspired by user: #BFCFCB (164, 15, 78) and #7A84B8 (230, 29, 60)
    // Intensity 0-100 adjusts brightness and saturation
    const topL = 98 - (bgIntensity * 0.3); // 0 -> 98, 100 -> 68
    const topS = 5 + (bgIntensity * 0.2); // 0 -> 5, 100 -> 25
    const bottomL = 88 - (bgIntensity * 0.4); // 0 -> 88, 100 -> 48
    const bottomS = 10 + (bgIntensity * 0.4); // 0 -> 10, 100 -> 50

    return {
      background: `linear-gradient(to bottom, hsl(164, ${topS}%, ${topL}%), hsl(230, ${bottomS}%, ${bottomL}%))`,
      transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setShowNewsTicker(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToContent = () => {
    const contentElement = document.getElementById('home-content-area');
    if (contentElement) {
      const topOffset = contentElement.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }
  };

  const handleTabClick = (id: string) => {
    setHomeActiveSection(id);
    setTimeout(scrollToContent, 100);
  };
  const [profileSubView, setProfileSubView] = useState<'main' | 'notifications' | 'donations' | 'personal' | 'theme'>('main');
  const [userNotificationPrefs, setUserNotificationPrefs] = useState<string[]>(['Avisos', 'Eventos', 'Escalas']);
  const [appTheme, setAppTheme] = useState<'light' | 'dark' | 'sepia'>('light');

  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [newPrayer, setNewPrayer] = useState({ content: '', isAnonymous: false });
  const [isSubmittingPrayer, setIsSubmittingPrayer] = useState(false);
  const [showAgendaForm, setShowAgendaForm] = useState(false);
  const [newAgendaItem, setNewAgendaItem] = useState({ title: '', time: '', date: '', description: '' });
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showScaleForm, setShowScaleForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', tag: 'Aviso', isPinned: false });
  const [newScale, setNewScale] = useState({ ministry: 'Louvor', role: '', date: '', memberId: '', memberName: '', memberAvatar: '' });
  const [completedSteps, setCompletedSteps] = useState<string[]>(['Novo na Igreja', 'Batismo']);

  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [editingAgendaItem, setEditingAgendaItem] = useState<any | null>(null);
  const [editingScale, setEditingScale] = useState<any | null>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<string | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<any | null>(null);
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<any | null>(null);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ collection: string, id: string } | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<MissionCampaign | null>(null);
  const [editingDevotional, setEditingDevotional] = useState<any | null>(null);
  const [constructionGoal, setConstructionGoal] = useState({ current: 45200, target: 80000 });
  const [editingConstruction, setEditingConstruction] = useState(false);
  const [pixKey, setPixKey] = useState('12.345.678/0001-90');
  const [verseTitle, setVerseTitle] = useState('Deixai vir a mim os pequeninos...');
  const [verseRef, setVerseRef] = useState('Mateus 19:14');
  const [privacyMode, setPrivacyMode] = useState<'anonymous' | 'leadership'>('leadership');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', info: '', duration: '', description: '', status: 'Inscrições Abertas' });
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isScaleUnlocked, setIsScaleUnlocked] = useState(false);
  const [scalePasswordInput, setScalePasswordInput] = useState('');
  const [showScaleViewPassword, setShowScaleViewPassword] = useState(false);
  const [isAdminSetupMode, setIsAdminSetupMode] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminSecretState, setAdminSecretState] = useState("pastor2026");
  const [lastAnnouncementId, setLastAnnouncementId] = useState<string | null>(null);

  const [selectedBibleBook, setSelectedBibleBook] = useState<string | null>(null);
  const [selectedBibleChapter, setSelectedBibleChapter] = useState<number>(1);
  const [bibleContent, setBibleContent] = useState<any | null>(null);
  const [isBibleLoading, setIsBibleLoading] = useState(false);
  const [bibleSearchQuery, setBibleSearchQuery] = useState("");
  const [bibleSearchResults, setBibleSearchResults] = useState<any[] | null>(null);
  const [isSearchingBible, setIsSearchingBible] = useState(false);

  const [edenRegistroEmAndamento, setEdenRegistroEmAndamento] = useState<EdenTipoRegistro | null>(null);

  const registrarAtividadeEden = async (
    tipo: EdenTipoRegistro,
    detalhes: EdenDadosRegistro = {},
  ): Promise<boolean> => {
    const membroAutenticado = auth.currentUser;
    if (!membroAutenticado) {
      alert('Faça login novamente para registrar sua atividade.');
      return false;
    }

    if (edenRegistroEmAndamento) return false;

    setEdenRegistroEmAndamento(tipo);
    const controlador = new AbortController();
    const limite = window.setTimeout(() => controlador.abort(), 20000);

    const nomes: Record<EdenTipoRegistro, string> = {
      presenca: 'Presença',
      estudo_biblico: 'Estudo bíblico',
      leitura_diaria: 'Leitura diária',
    };

    try {
      const tokenFirebase = await membroAutenticado.getIdToken();
      const resposta = await fetch(EDEN_N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenFirebase}`,
        },
        body: JSON.stringify({
          tipo,
          data_referencia: edenDataReferencia(detalhes.data_referencia),
          concluido: true,
          ...detalhes,
        }),
        signal: controlador.signal,
      });

      const corpo = await resposta.text();
      let retorno: { sucesso?: boolean; mensagem?: string } = {};
      try {
        retorno = corpo ? JSON.parse(corpo) : {};
      } catch {
        throw new Error(`Resposta inesperada do servidor (${resposta.status}).`);
      }

      if (!resposta.ok || retorno.sucesso !== true) {
        throw new Error(retorno.mensagem || `Servidor respondeu ${resposta.status}.`);
      }

      alert(`${nomes[tipo]} registrada com sucesso!`);
      return true;
    } catch (falha) {
      const mensagem = falha instanceof Error
        ? (falha.name === 'AbortError' ? 'O servidor demorou para responder.' : falha.message)
        : 'Falha desconhecida ao registrar a atividade.';
      console.error('Falha ao registrar atividade do App Eden:', mensagem);
      alert(`Não foi possível registrar ${nomes[tipo].toLowerCase()}.\n${mensagem}`);
      return false;
    } finally {
      window.clearTimeout(limite);
      setEdenRegistroEmAndamento(null);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      alert("Erro ao fazer login. Verifique sua conexão.");
    }
  };

  const BIBLE_BOOKS = [
    "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Ester", "Jó", "Salmos", "Provérbios", "Eclesiastes", "Cânticos", "Isaías", "Jeremias", "Lamentações", "Ezequiel", "Daniel", "Oseias", "Joel", "Amós", "Obadias", "Jonas", "Miqueias", "Naum", "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias",
    "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas", "Apocalipse"
  ];

  const BIBLE_BOOKS_MAP: { [key: string]: string } = {
    "Gênesis": "Genesis", "Êxodo": "Exodus", "Levítico": "Leviticus", "Números": "Numbers", "Deuteronômio": "Deuteronomy", 
    "Josué": "Joshua", "Juízes": "Judges", "Rute": "Ruth", "1 Samuel": "1 Samuel", "2 Samuel": "2 Samuel", 
    "1 Reis": "1 Kings", "2 Reis": "2 Kings", "1 Crônicas": "1 Chronicles", "2 Crônicas": "2 Chronicles", 
    "Esdras": "Ezra", "Neemias": "Nehemiah", "Ester": "Esther", "Jó": "Job", "Salmos": "Psalms", 
    "Provérbios": "Proverbs", "Eclesiastes": "Ecclesiastes", "Cânticos": "Song of Solomon", "Isaías": "Isaiah", 
    "Jeremias": "Jeremiah", "Lamentações": "Lamentations", "Ezequiel": "Ezekiel", "Daniel": "Daniel", 
    "Oseias": "Hosea", "Joel": "Joel", "Amós": "Amos", "Obadias": "Obadiah", "Jonas": "Jonah", 
    "Miqueias": "Micah", "Naum": "Nahum", "Habacuque": "Habakkuk", "Sofonias": "Zephaniah", 
    "Ageu": "Haggai", "Zacarias": "Zechariah", "Malaquias": "Malachi",
    "Mateus": "Matthew", "Marcos": "Mark", "Lucas": "Luke", "João": "John", "Atos": "Acts", 
    "Romanos": "Romans", "1 Coríntios": "1 Corinthians", "2 Coríntios": "2 Corinthians", "Gálatas": "Galatians", 
    "Efésios": "Ephesians", "Filipenses": "Philippians", "Colossenses": "Colossians", "1 Tessalonicenses": "1 Thessalonians", 
    "2 Tessalonicenses": "2 Thessalonians", "1 Timóteo": "1 Timothy", "2 Timóteo": "2 Timothy", 
    "Tito": "Titus", "Filemom": "Philemon", "Hebreus": "Hebrews", "Tiago": "James", "1 Pedro": "1 Peter", 
    "2 Pedro": "2 Peter", "1 João": "1 John", "2 João": "2 John", "3 João": "3 John", "Judas": "Jude", "Apocalipse": "Revelation"
  };

  const fetchBibleChapter = async (book: string, chapter: number) => {
    setIsBibleLoading(true);
    setBibleSearchResults(null);
    try {
      const englishBook = BIBLE_BOOKS_MAP[book] || book;
      const response = await fetch(`https://bible-api.com/${englishBook}+${chapter}?translation=almeida`);
      const data = await response.json();
      setBibleContent(data);
    } catch (error) {
      console.error("Erro ao carregar bíblia:", error);
    } finally {
      setIsBibleLoading(false);
    }
  };

  const handleBibleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bibleSearchQuery || bibleSearchQuery.trim().length < 2) return;
    
    setIsSearchingBible(true);
    setSelectedBibleBook(null);
    setBibleContent(null);
    
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(bibleSearchQuery)}?translation=almeida`);
      const data = await response.json();
      if (data.verses) {
        setBibleSearchResults(data.verses);
      } else {
        setBibleSearchResults([]);
      }
    } catch (error) {
      console.error("Erro na busca bíblica:", error);
      setBibleSearchResults([]);
    } finally {
      setIsSearchingBible(false);
    }
  };

  useEffect(() => {
    if (selectedBibleBook) {
      fetchBibleChapter(selectedBibleBook, selectedBibleChapter);
    }
  }, [selectedBibleBook, selectedBibleChapter]);

  // Boletim Digital State
  const [showBulletinForm, setShowBulletinForm] = useState(false);
  const [isGeneratingBulletin, setIsGeneratingBulletin] = useState(false);
  const [bulletinInputs, setBulletinInputs] = useState({
    tema: '',
    pregador: '',
    texto_biblico: '',
    pregacao_texto: '',
    data: new Date().toLocaleDateString('pt-BR')
  });

  // Firestore Queries
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'members' | 'bulletins' | 'agenda' | 'announcements' | 'scales'>('overview');

  const membersRef = collection(db, 'members');
  const [membersSnap] = useCollection(
    user ? query(membersRef, orderBy('name', 'asc')) : null
  );
  
  const announcementsRef = collection(db, 'announcements');
  const [announcementsSnap] = useCollection(
    user ? query(announcementsRef, orderBy('createdAt', 'desc'), limit(30)) : null
  );

  const scalesRef = collection(db, 'scales');
  const [scalesSnap] = useCollection(
    user ? query(scalesRef, orderBy('date', 'asc')) : null
  );

  const roomsRef = collection(db, 'chatRooms');
  const [rooms] = useCollectionData(
    user ? query(roomsRef, where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc')) : null
  );

  const messagesRef = activeRoomId ? collection(db, 'chatRooms', activeRoomId, 'messages') : null;
  const [messages] = useCollectionData(
    messagesRef ? query(messagesRef, orderBy('createdAt', 'asc')) : null
  );

  const devotionalsRef = collection(db, 'devotionals');
  const [devotionalsSnap] = useCollection(
    user ? query(devotionalsRef, orderBy('createdAt', 'desc')) : null
  );

  const prayersRef = collection(db, 'prayers');
  const [prayersSnap] = useCollection(
    user ? query(prayersRef, orderBy('createdAt', 'desc')) : null
  );

  const agendaRef = collection(db, 'agenda');
  const [agendaSnap] = useCollection(
    user ? query(agendaRef, orderBy('date', 'asc')) : null
  );

  const logsRef = collection(db, 'activityLogs');
  const [activityLogs] = useCollectionData(
    user && isAdmin ? query(logsRef, orderBy('createdAt', 'desc'), limit(10)) : null
  );

  const financialRef = collection(db, 'financial');
  const [financialSnap] = useCollection(
    user ? query(financialRef, orderBy('date', 'desc')) : null
  );

  const missionRef = doc(db, 'missions', 'missao-2026');
  const [campaignSnap] = useCollection(
    user ? collection(db, 'missions') : null
  );

  const coursesRef = collection(db, 'courses');
  const [coursesSnap] = useCollection(
    user ? query(coursesRef, orderBy('createdAt', 'desc')) : null
  );

  const enrollmentsRef = collection(db, 'enrollments');
  const [enrollmentsSnap] = useCollection(user ? query(enrollmentsRef, where('userId', '==', user.uid)) : null);

  const bulletinsRef = collection(db, 'bulletins');
  const [bulletinsSnap] = useCollection(
    user ? query(bulletinsRef, orderBy('createdAt', 'desc'), limit(1)) : null
  );

  const newsSourcesRef = collection(db, 'newsFeedSources');
  const [newsSourcesSnap] = useCollection(user ? query(newsSourcesRef, where('active', '==', true)) : null);

  const newsCacheRef = collection(db, 'newsCache');
  const [newsCacheSnap] = useCollection(user ? query(newsCacheRef, orderBy('createdAt', 'desc'), limit(50)) : null);

  const userProfileRef = user ? doc(db, 'userProfiles', user.uid) : null;
  
  // Derived Data
  const members = membersSnap?.docs.map(d => ({ id: d.id, ...d.data() } as Member)) || [];
  const allScales = scalesSnap?.docs.map(d => ({ id: d.id, ...d.data() } as Scale)) || [];
  const announcements = (announcementsSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [])
    .sort((a: any, b: any) => {
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      return bPinned - aPinned; // Pinned first
    });
  const prayers = prayersSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const agendaItems = agendaSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const financialData = financialSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const campaignData = campaignSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const devotionals = (devotionalsSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [])
    .filter((d: any) => d.category === 'devocionais' || d.category === 'semeando' || !d.category);
  const courses = coursesSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const myEnrollments = enrollmentsSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const bulletins = bulletinsSnap?.docs.map(d => ({ id: d.id, ...d.data() } as DigitalBulletin)) || [];
  
  const currentCampaign = (campaignData && campaignData[0] as MissionCampaign) || MOCK_CAMPAIGN;

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        const normalizedEmail = user.email?.toLowerCase().trim();
        if (normalizedEmail === 'gilmarcoutobrito@gmail.com') {
          setIsAdmin(true);
          return;
        }
        try {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          setIsAdmin(adminSnap.exists());
        } catch (err) {
          console.error("Erro ao verificar admin:", err);
          setIsAdmin(false);
        }
      };
      checkAdmin();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    if (allScales.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentScaleIndex((prev) => (prev + 1) % allScales.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [allScales.length]);

  // Real-time Church Config Sync
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'config', 'church'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.pixKey) setPixKey(data.pixKey);
        if (data.verseTitle) setVerseTitle(data.verseTitle);
        if (data.verseRef) setVerseRef(data.verseRef);
        if (data.privacyMode) setPrivacyMode(data.privacyMode);
        if (data.adminSecret) setAdminSecretState(data.adminSecret);
      }
    });

    // Restore admin unlock state from session
    const isUnlocked = localStorage.getItem('admin_unlocked');
    if (isUnlocked === 'true') {
      setIsAdminUnlocked(true);
    }
    return () => unsub();
  }, [user]);

  // Real-time Announcement Sound Listener
  useEffect(() => {
    if (announcements.length > 0) {
      const latestId = announcements[0].id;
      
      if (lastAnnouncementId === null) {
        // Initial load - just set the ID without sound
        setLastAnnouncementId(latestId);
      } else if (latestId !== lastAnnouncementId) {
        // New announcement detected!
        playNotificationSound();
        setLastAnnouncementId(latestId);
      }
    }
  }, [announcements, lastAnnouncementId]);

  useEffect(() => {
    const handleFocus = (e: any) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      if (isInput) setIsInputFocused(true);
    };
    const handleBlur = (e: any) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      if (isInput) setIsInputFocused(false);
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  useEffect(() => {
    if (user && userProfileRef) {
      const syncProfile = async () => {
        const snap = await getDoc(userProfileRef);
        
        // Fetch role from members collection
        const membersRef = collection(db, 'members');
        const memberQuery = query(membersRef, where('email', '==', user.email));
        const memberSnap = await getDocs(memberQuery);
        
        if (!memberSnap.empty) {
          const memberData = memberSnap.docs[0].data() as Member;
          setUserRole(memberData.userType || 'membro');
          setUserDepartmentId(memberData.departmentId || null);
          if (memberData.userType === 'admin') setIsAdmin(true);
        } else if (user.email === 'gilmarcoutobrito@gmail.com') {
          setUserRole('admin');
          setIsAdmin(true);
        } else {
          setUserRole('membro');
        }

        if (snap.exists()) {
          const profile = snap.data();
          if (profile.completedSteps) setCompletedSteps(profile.completedSteps);
          if (profile.confirmedScales) setConfirmedScales(profile.confirmedScales);
          if (profile.interests) setUserInterests(profile.interests);
          if (profile.notificationPrefs) setUserNotificationPrefs(profile.notificationPrefs);
          if (profile.appTheme) setAppTheme(profile.appTheme);
          if (profile.privacyMode) setPrivacyMode(profile.privacyMode);
        } else {
          await setDoc(userProfileRef, {
            email: user.email,
            name: user.displayName,
            completedSteps: ['Novo na Igreja', 'Batismo'],
            confirmedScales: [],
            interests: [],
            notificationPrefs: ['Avisos', 'Eventos', 'Escalas'],
            appTheme: 'light',
            privacyMode: 'leadership',
            updatedAt: Timestamp.now()
          });
        }
      };
      syncProfile();
    }
  }, [user]);

  useEffect(() => {
    if (activeView === 'courses' && user && courses.length > 0) {
      handleGetCourseRecommendations();
    }
  }, [activeView, user, courses.length, userInterests.length]);

  // Update cloud when steps change
  const toggleStep = async (label: string) => {
    const isDone = completedSteps.includes(label);
    const newSteps = isDone 
      ? completedSteps.filter(step => step !== label)
      : [...completedSteps, label];
    
    setCompletedSteps(newSteps);
    if (userProfileRef) {
      await updateDoc(userProfileRef, { completedSteps: newSteps });
    }
  };

  // Initialize mission data if it doesn't exist or needs cleanup
  useEffect(() => {
    const initMission = async () => {
      const snap = await getDoc(missionRef);
      if (!snap.exists()) {
        await setDoc(missionRef, MOCK_CAMPAIGN);
      } else {
        const data = snap.data() as MissionCampaign;
        if (data.departments.some(d => d.department === 'Adultos') || !data.nextTargets) {
          const filtered = data.departments.filter(d => d.department !== 'Adultos');
          await updateDoc(missionRef, { 
            departments: filtered,
            nextTargets: data.nextTargets || MOCK_CAMPAIGN.nextTargets
          });
        }
      }
    };
    if (user && isAdmin) initMission();
  }, [user, isAdmin]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(membersRef, {
        name: newMember.name,
        role: newMember.role,
        ministry: newMember.ministry,
        status: newMember.status,
        email: newMember.email || '',
        phone: newMember.phone || '',
        avatar: `https://picsum.photos/seed/${newMember.name}/100`,
        createdAt: Timestamp.now(),
      });
      await addActivityLog("Membro Cadastrado", `Novo membro: ${newMember.name}`);
      setShowMemberForm(false);
      setNewMember({ name: '', role: '', ministry: '', status: 'Ativo', email: '', phone: '' });
      alert("Membro cadastrado com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar membro:", err);
    }
  };

  const handleFetchNews = async () => {
    if (!user || isFetchingNews) return;
    setIsFetchingNews(true);
    
    // Default fallback sources if none in DB
    const sources = newsSourcesSnap?.docs.map(d => ({ id: d.id, ...d.data() } as NewsSource)) || [
      { id: '1', name: 'Gospel Prime', url: 'https://www.gospelprime.com.br/feed/', active: true },
      { id: '2', name: 'Christian Post', url: 'https://portugues.christianpost.com/rss/feed.xml', active: true }
    ];

    try {
      for (const source of sources) {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`);
        const data = await response.json();
        
        if (data.status === 'ok') {
          for (const item of data.items) {
            // Check if already in cache by link
            const existsQuery = query(collection(db, 'newsCache'), where('link', '==', item.link));
            const existsSnap = await getDocs(existsQuery);
            
            if (existsSnap.empty) {
              await addDoc(collection(db, 'newsCache'), {
                title: item.title,
                description: item.description?.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
                link: item.link,
                image: item.enclosure?.link || item.thumbnail || 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2670&auto=format&fit=crop',
                pubDate: item.pubDate,
                source: source.name,
                createdAt: Timestamp.now()
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Erro ao buscar notícias:", err);
    } finally {
      setIsFetchingNews(false);
    }
  };

  useEffect(() => {
    if (activeView === 'news') {
      handleFetchNews();
    }
  }, [activeView]);

  const handleConfirmScale = async (id: string, currentStatus: string) => {
    if (!user) return;
    const scaleRef = doc(db, 'scales', id);
    const scale = allScales.find(s => s.id === id);
    const userMember = members.find(m => m.email === user.email);

    if (!isAdmin && scale?.memberId !== userMember?.id) {
       alert("Somente o voluntário escalado pode confirmar esta presença.");
       return;
    }

    const newStatus = currentStatus === 'confirmed' ? 'pending' : 'confirmed';
    try {
      await updateDoc(scaleRef, { status: newStatus });
      await addActivityLog(newStatus === 'confirmed' ? "Presença Confirmada" : "Presença Cancelada", `${scale?.memberName} em ${scale?.ministry}`);
      
      const newConfirmed = newStatus === 'confirmed' 
        ? [...confirmedScales, id] 
        : confirmedScales.filter(s => s !== id);
      
      setConfirmedScales(newConfirmed);
      if (userProfileRef) {
        await updateDoc(userProfileRef, { confirmedScales: newConfirmed });
      }

      // Nunca atribui ao administrador uma presenca de outro membro.
      if (newStatus === 'confirmed' && userMember?.id && scale?.memberId === userMember.id) {
        await registrarAtividadeEden('presenca', {
          evento_id: String(scale?.id || id),
          evento_nome: String(scale?.ministry || 'Escala da igreja'),
          data_referencia: edenDataReferencia(scale?.date),
          data_evento: edenDataReferencia(scale?.date),
          ministerio: String(scale?.ministry || ''),
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar escala:", err);
    }
  };

  const handleStartChat = async (otherMember: Member) => {
    if (!user) return;
    
    const roomId = user.uid < otherMember.id ? `${user.uid}_${otherMember.id}` : `${otherMember.id}_${user.uid}`;
    const roomRef = doc(db, 'chatRooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      await setDoc(roomRef, {
        type: 'direct',
        participants: [user.uid, otherMember.id],
        updatedAt: Timestamp.now(),
        participantNames: [user.displayName, otherMember.name],
        participantAvatars: [user.photoURL, otherMember.avatar]
      });
    }

    setActiveRoomId(roomId);
    setActiveView('chat');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeRoomId || !chatMessage.trim()) return;

    try {
      const msgData = {
        roomId: activeRoomId,
        senderId: user.uid,
        senderName: user.displayName || 'Irmão',
        senderAvatar: user.photoURL || '',
        text: chatMessage,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'chatRooms', activeRoomId, 'messages'), msgData);
      await updateDoc(doc(db, 'chatRooms', activeRoomId), {
        lastMessage: chatMessage,
        updatedAt: Timestamp.now()
      });
      setChatMessage('');
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  const handleCreateDevotional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const vId = extractYouTubeId(newDevotional.videoUrl);
      if (!vId) {
        alert("Link do YouTube inválido. Por favor, cole um link válido.");
        return;
      }

      await addDoc(collection(db, 'devotionals'), {
        title: newDevotional.title,
        videoUrl: newDevotional.videoUrl,
        videoId: vId,
        category: newDevotional.category || 'devocionais',
        type: 'youtube',
        section: 'home_devocionais',
        description: newDevotional.description,
        thumbnailUrl: `https://img.youtube.com/vi/${vId}/maxresdefault.jpg`,
        authorName: user.displayName,
        authorId: user.uid,
        createdAt: Timestamp.now()
      });
      setShowDevotionalForm(false);
      setNewDevotional({ title: '', videoUrl: '', description: '', category: 'devocionais' });
      await addActivityLog("Devocional Publicado", `Novo vídeo: ${newDevotional.title}`);
    } catch (err) {
      console.error("Erro ao salvar devocional:", err);
    }
  };

  const handleCreatePrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para publicar um pedido de oração.");
      return;
    }
    if (!newPrayer.content.trim()) return;
    
    setIsSubmittingPrayer(true);
    try {
      await addDoc(collection(db, 'prayers'), {
        content: newPrayer.content,
        authorName: newPrayer.isAnonymous ? 'Anônimo' : (user.displayName || 'Irmão'),
        authorId: user.uid,
        prayerCount: 0,
        isAnonymous: newPrayer.isAnonymous,
        createdAt: Timestamp.now()
      });
      setShowPrayerForm(false);
      setNewPrayer({ content: '', isAnonymous: false });
      alert("Pedido de oração publicado com sucesso!");
    } catch (err) {
      console.error("Erro ao publicar oração:", err);
      alert("Erro ao enviar pedido de oração: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmittingPrayer(false);
    }
  };

  const addActivityLog = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, 'activityLogs'), {
        action,
        details,
        userName: user?.displayName || 'Sistema',
        createdAt: Timestamp.now()
      });
    } catch (err) {
      console.error("Erro ao registrar log:", err);
    }
  };

  const handleCreateAgendaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'agenda'), {
        ...newAgendaItem,
        createdAt: Timestamp.now()
      });
      await addActivityLog("Evento Criado", `Novo evento: ${newAgendaItem.title}`);
      setShowAgendaForm(false);
      setNewAgendaItem({ title: '', time: '', date: '', description: '' });
    } catch (err) {
      console.error("Erro ao criar item de agenda:", err);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        createdAt: Timestamp.now()
      });
      await addActivityLog("Aviso Publicado", `Novo aviso: ${newAnnouncement.title}`);
      setShowAnnouncementForm(false);
      setNewAnnouncement({ title: '', content: '', tag: 'Aviso', isPinned: false });
    } catch (err) {
      console.error("Erro ao criar anúncio:", err);
    }
  };

  const handleCreateScale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'scales'), {
        ...newScale,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      await addActivityLog("Escala Criada", `${newScale.ministry}: ${newScale.memberName} (${newScale.role})`);
      setNewScale({ ministry: 'Louvor', role: '', date: '', memberId: '', memberName: '', memberAvatar: '' });
      alert("Escala criada com sucesso!");
    } catch (err) {
      console.error("Erro ao criar escala:", err);
    }
  };

  const handleAutoGenerateScale = async () => {
    if (!isAdmin) return;
    const dateStr = prompt("Para qual data deseja gerar as escalas? (Ex: Próximo Domingo)");
    if (!dateStr) return;

    const autoMinistries = [
      { name: 'Louvor', roles: ['Vocal', 'Teclado', 'Violão', 'Bateria', 'Baixo'] },
      { name: 'Mídia', roles: ['Som', 'Projeção', 'Câmera', 'Stream'] },
      { name: 'Recepção', roles: ['Portaria', 'Boas-vindas', 'Apoio'] }
    ];

    try {
      const newScalePromises = [];
      for (const min of autoMinistries) {
        const minMembers = members.filter(m => m.ministry === min.name);
        if (minMembers.length === 0) continue;

        for (const role of min.roles) {
          const member = minMembers[Math.floor(Math.random() * minMembers.length)];
          const scaleData = {
            ministry: min.name,
            role,
            date: dateStr,
            memberId: member.id,
            memberName: member.name,
            memberAvatar: member.avatar,
            status: 'pending' as const,
            createdAt: Timestamp.now()
          };
          newScalePromises.push(addDoc(collection(db, 'scales'), scaleData));
        }
      }

      if (newScalePromises.length === 0) {
        alert("Nenhum membro encontrado nos ministérios selecionados para gerar escalas.");
        return;
      }

      await Promise.all(newScalePromises);
      await addActivityLog("Escala Automática", `Escalas geradas para ${dateStr}`);
      alert(`${newScalePromises.length} escalas geradas automaticamente para ${dateStr}!`);
    } catch (err) {
      console.error("Erro ao auto-gerar escalas:", err);
      alert("Erro ao gerar escalas.");
    }
  };

  const handleRequestReplacement = async (scaleId: string, notes: string) => {
    if (!user) return;
    const scaleRef = doc(db, 'scales', scaleId);
    try {
       await updateDoc(scaleRef, {
         status: 'needs_replacement',
         notes: notes
       });
       await addActivityLog("Substituição Solicitada", `Solicitado substituto para uma escala por ${user.displayName}`);
    } catch (err) {
       console.error("Erro ao solicitar substituição:", err);
    }
  };
   
  const handleAssignReplacement = async (scaleId: string, replacement: Member) => {
    if (!isAdmin) return;
    const scaleRef = doc(db, 'scales', scaleId);
    try {
       await updateDoc(scaleRef, {
         memberId: replacement.id,
         memberName: replacement.name,
         memberAvatar: replacement.avatar,
         status: 'pending',
         replacementId: null,
         replacementName: null,
         notes: `Substituto atribuído: ${replacement.name}`
       });
       await addActivityLog("Substituto Atribuído", `Nova pessoa escalada em substituição: ${replacement.name}`);
       alert("Substituto atribuído com sucesso!");
    } catch (err) {
       console.error("Erro ao atribuir substituto:", err);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingMember) return;
    try {
      await updateDoc(doc(db, 'members', editingMember.id), {
        name: editingMember.name,
        role: editingMember.role,
        ministry: editingMember.ministry,
        status: editingMember.status,
        email: editingMember.email || '',
        phone: editingMember.phone || ''
      });
      await addActivityLog("Membro Atualizado", `Alteração em: ${editingMember.name}`);
      setEditingMember(null);
    } catch (err) {
      console.error("Erro ao atualizar membro:", err);
    }
  };

  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingAnnouncement) return;
    try {
      await updateDoc(doc(db, 'announcements', editingAnnouncement.id), {
        title: editingAnnouncement.title,
        tag: editingAnnouncement.tag,
        content: editingAnnouncement.content,
        isPinned: editingAnnouncement.isPinned || false
      });
      setEditingAnnouncement(null);
    } catch (err) {
      console.error("Erro ao atualizar anúncio:", err);
    }
  };

  const handleUpdateAgendaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingAgendaItem) return;
    try {
      await updateDoc(doc(db, 'agenda', editingAgendaItem.id), {
        title: editingAgendaItem.title,
        time: editingAgendaItem.time,
        date: editingAgendaItem.date,
        description: editingAgendaItem.description
      });
      setEditingAgendaItem(null);
    } catch (err) {
      console.error("Erro ao atualizar agenda:", err);
    }
  };

  const handleUpdateScale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingScale) return;
    try {
      await updateDoc(doc(db, 'scales', editingScale.id), {
        ministry: editingScale.ministry,
        role: editingScale.role,
        date: editingScale.date,
        memberId: editingScale.memberId,
        memberName: editingScale.memberName,
        memberAvatar: editingScale.memberAvatar,
        status: editingScale.status,
        replacementId: editingScale.replacementId || null,
        replacementName: editingScale.replacementName || null
      });
      setEditingScale(null);
    } catch (err) {
      console.error("Erro ao atualizar escala:", err);
    }
  };

  const handleDeleteItem = async (collectionName: string, id: string) => {
    if (!isAdmin) {
       // Allow authors to delete prayers/devotionals
       if (collectionName !== 'prayers' && collectionName !== 'devotionals') return;
    }
    setItemToDelete({ collection: collectionName, id });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, itemToDelete.collection, itemToDelete.id));
      await addActivityLog("Item Excluído", `Removido de ${itemToDelete.collection}`);
      setItemToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir item:", err);
    }
  };

  const handleUpdateMission = async (newCollected: number) => {
    if (!isAdmin) return;
    if (!currentCampaign.id) return;
    try {
      const updatedDepts = [...currentCampaign.departments];
      if (updatedDepts.length > 0) {
        updatedDepts[0].collected = newCollected;
      }
      await updateDoc(doc(db, 'missions', currentCampaign.id), {
        departments: updatedDepts
      });
    } catch (err) {
      console.error("Erro ao atualizar missões:", err);
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingCampaign) return;
    try {
      await updateDoc(doc(db, 'missions', editingCampaign.id), {
        title: editingCampaign.title,
        totalGoal: Number(editingCampaign.totalGoal),
        departments: editingCampaign.departments,
        nextTargets: editingCampaign.nextTargets || []
      });
      await addActivityLog("Missão Atualizada", `Meta: R$ ${editingCampaign.totalGoal}`);
      setEditingCampaign(null);
    } catch (err) {
      console.error("Erro ao salvar campanha:", err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'courses'), {
        ...newCourse,
        createdAt: Timestamp.now()
      });
      await addActivityLog("Curso Criado", `Novo curso: ${newCourse.title}`);
      setShowCourseForm(false);
      setNewCourse({ title: '', info: '', duration: '', description: '', status: 'Inscrições Abertas' });
    } catch (err) {
      console.error("Erro ao criar curso:", err);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingCourse) return;
    try {
      await updateDoc(doc(db, 'courses', editingCourse.id), {
        title: editingCourse.title,
        duration: editingCourse.duration,
        status: editingCourse.status,
        info: editingCourse.info,
        description: editingCourse.description
      });
      await addActivityLog("Curso Atualizado", `Alteração em: ${editingCourse.title}`);
      setEditingCourse(null);
    } catch (err) {
      console.error("Erro ao atualizar curso:", err);
    }
  };

  const handleEnrollCourse = async (courseId: string, courseTitle: string) => {
    if (!user) {
      alert("Você precisa estar logado para se inscrever.");
      return;
    }
    
    const isAlreadyEnrolled = myEnrollments.some((e: any) => e.courseId === courseId);
    if (isAlreadyEnrolled) {
      alert("Você já está inscrito neste curso!");
      return;
    }

    try {
      await addDoc(collection(db, 'enrollments'), {
        courseId,
        userId: user.uid,
        userName: user.displayName,
        status: 'pending',
        progress: 0,
        createdAt: Timestamp.now()
      });
      await addActivityLog("Inscrição em Curso", `Inscrito em: ${courseTitle}`);
      alert("Sua inscrição foi realizada com sucesso! Aguarde a confirmação.");
    } catch (err) {
      console.error("Erro ao se inscrever no curso:", err);
    }
  };

  const handleUpdateDevotional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingDevotional) return;
    try {
      await updateDoc(doc(db, 'devotionals', editingDevotional.id), {
        title: editingDevotional.title,
        description: editingDevotional.description,
        videoUrl: editingDevotional.videoUrl
      });
      setEditingDevotional(null);
    } catch (err) {
      console.error("Erro ao atualizar devocional:", err);
    }
  };

  const handleAddPrayerCount = async (prayerId: string, currentCount: number) => {
    if (userPrayedFor.includes(prayerId)) return;
    try {
      await updateDoc(doc(db, 'prayers', prayerId), {
        prayerCount: currentCount + 1
      });
      setUserPrayedFor(prev => [...prev, prayerId]);
      
      // Haptic-like feedback simulated by motion in UI
    } catch (err) {
      console.error("Erro ao atualizar oração:", err);
    }
  };
   
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(transactionAmount);
    try {
      await addDoc(collection(db, 'financial'), {
        userId: user.uid,
        userName: privacyMode === 'leadership' ? user.displayName : 'Membro Anônimo',
        amount: amount,
        type: transactionType,
        date: Timestamp.now(),
        status: 'completed'
      });
      setShowTransactionForm(false);
      setTransactionAmount('');
      
      const level = getContributionLevel(amount);
      const logMessage = privacyMode === 'leadership' 
        ? `${user.displayName} ofertou ${level.symbol}` 
        : `Nova contribuição registrada ${level.symbol}`;
        
      await addActivityLog("Contribuição", logMessage);
      playNotificationSound();
      alert("Contribuição registrada com sucesso! Deus te abençoe.");
    } catch (err) {
      console.error("Erro ao registrar contribuição:", err);
    }
  };

  const handleSignOut = () => signOut(auth);

  const downloadCSV = (data: any[], filename: string, headers: string[]) => {
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    data.forEach(item => {
      const values = headers.map(header => {
        const key = header.toLowerCase().replace(/ /g, '');
        const val = item[key] !== undefined ? item[key] : (item[header] || '');
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.click();
  };

  const handleScaleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scalePasswordInput) {
      alert("Por favor, digite a senha.");
      return;
    }
    
    let currentSecret = adminSecretState || "pastor2026";
    try {
      const configRef = doc(db, 'config', 'church');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        if (data && data.adminSecret) {
          currentSecret = data.adminSecret;
          setAdminSecretState(currentSecret);
        }
      }
    } catch (err) {
      console.warn("Usando senha em cache:", err);
    }

    if (scalePasswordInput.trim() === currentSecret.trim()) {
      setIsScaleUnlocked(true);
      setScalePasswordInput('');
      alert("Acesso às Escalas Liberado!");
    } else {
      alert("Senha incorreta! Acesso negado.");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput) {
      alert("Por favor, digite a senha.");
      return;
    }
    
    // Tentar buscar a configuração mais recente antes de comparar, para evitar problemas de sincronia
    let currentSecret = adminSecretState || "pastor2026";
    try {
      const configRef = doc(db, 'config', 'church');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        if (data && data.adminSecret) {
          currentSecret = data.adminSecret;
          setAdminSecretState(currentSecret);
        }
      }
    } catch (err) {
      console.warn("Usando senha em cache devido a erro de rede:", err);
    }

    if (adminPasswordInput.trim() === currentSecret.trim()) {
      setIsAdminUnlocked(true);
      setAdminPasswordInput('');
      localStorage.setItem('admin_unlocked', 'true');
      alert("Acesso Administrativo Liberado!");
    } else {
      alert("Equívoco: Senha administrativa incorreta! Tente novamente.");
    }
  };

  const handleGenerateBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsGeneratingBulletin(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in settings.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const promptText = `
        Você é um assistente inteligente especializado em conteúdo cristão, teologia básica e organização de cultos.
        Sua função é gerar automaticamente um BOLETIM DIGITAL DE CULTO para um aplicativo mobile.
        O boletim deve ser organizado, claro, envolvente e espiritualmente edificante.
        Nome do boletim: "Boletim Digital"

        INSTRUÇÕES ADICIONAIS:
        - O resumo da pregação deve ser fiel ao texto enviado, mas escrito de forma inspiradora.
        - As lições devem ser pontos práticos removidos da pregação.
        - Os versículos relacionados devem reforçar a mensagem.
        - O plano da semana deve ser um devocional sugerido dia a dia.

        ENTRADAS:
        - Tema do culto: "${bulletinInputs.tema}"
        - Nome do pregador: "${bulletinInputs.pregador}"
        - Texto bíblico base: "${bulletinInputs.texto_biblico}"
        - Transcrição ou resumo da pregação: "${bulletinInputs.pregacao_texto}"
        - Data do culto: "${bulletinInputs.data}"

        SAÍDA ESPERADA:
        JSON estruturado rigorosamente com os campos descritos no schema.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              capa: {
                type: Type.OBJECT,
                properties: {
                  nome: { type: Type.STRING },
                  tema: { type: Type.STRING },
                  data: { type: Type.STRING },
                  versiculo_destaque: { type: Type.STRING }
                },
                required: ["nome", "tema", "data", "versiculo_destaque"]
              },
              resumo_pregacao: { type: Type.STRING },
              licoes: { type: Type.ARRAY, items: { type: Type.STRING } },
              versiculos_relacionados: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    referencia: { type: Type.STRING },
                    trecho: { type: Type.STRING }
                  },
                  required: ["referencia", "trecho"]
                }
              },
              aplicacao: { type: Type.ARRAY, items: { type: Type.STRING } },
              semana_espiritual: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dia: { type: Type.STRING },
                    foco: { type: Type.STRING },
                    versiculo: { type: Type.STRING },
                    acao: { type: Type.STRING }
                  },
                  required: ["dia", "foco", "versiculo", "acao"]
                }
              },
              frase_final: { type: Type.STRING }
            },
            required: ["capa", "resumo_pregacao", "licoes", "versiculos_relacionados", "aplicacao", "semana_espiritual", "frase_final"]
          }
        }
      });

      const text = response.text || '{}';
      const result = JSON.parse(text);

      const docRef = await addDoc(collection(db, 'bulletins'), {
        theme: bulletinInputs.tema,
        preacher: bulletinInputs.pregador,
        date: bulletinInputs.data || new Date().toLocaleDateString('pt-BR'),
        jsonContent: result,
        createdAt: Timestamp.now()
      });

      await addActivityLog("Boletim Gerado", `Novo boletim: ${bulletinInputs.tema}`);
      setShowBulletinForm(false);
      setBulletinInputs({ tema: '', pregador: '', texto_biblico: '', pregacao_texto: '', data: new Date().toLocaleDateString('pt-BR') });
      setSelectedBulletin({ id: docRef.id, ...bulletinInputs, jsonContent: result, date: bulletinInputs.data || new Date().toLocaleDateString('pt-BR'), theme: bulletinInputs.tema, preacher: bulletinInputs.pregador, createdAt: Timestamp.now() } as DigitalBulletin);
      alert("Boletim Digital gerado com tecnologia IA e publicado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar boletim:", err);
      alert("Erro ao falar com a IA. Tente novamente em instantes.");
    } finally {
      setIsGeneratingBulletin(false);
    }
  };

  const handleGetCourseRecommendations = async () => {
    if (!user || isRecommending || courses.length === 0) return;
    setIsRecommending(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return;

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Com base no perfil do membro da igreja abaixo, recomende os 2 melhores cursos da lista disponível.
        
        PERFIL DO MEMBRO:
        - Interesses registrados: ${userInterests.join(', ') || 'Nenhum registrado'}
        - Escalas confirmadas (histórico de ministério): ${confirmedScales.length} escalas
        - Passos de crescimento concluídos: ${completedSteps.join(', ') || 'Nenhum'}
        
        LISTA DE CURSOS DISPONÍVEIS (ID e Título):
        ${(courses as any[]).map(c => `ID: ${c.id}, Título: ${c.title}, Descrição: ${c.info}`).join('\n')}
        
        Retorne APENAS um array JSON com os IDs dos cursos recomendados. Exemplo: ["id1", "id2"]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "[]";
      const ids = JSON.parse(text);
      if (Array.isArray(ids)) {
        setRecommendedCourseIds(ids);
      }
    } catch (err) {
      console.error("Erro ao gerar recomendações:", err);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleUpdateInterests = async (interest: string) => {
    if (!user || !userProfileRef) return;
    const newInterests = userInterests.includes(interest)
      ? userInterests.filter(i => i !== interest)
      : [...userInterests, interest];
    
    setUserInterests(newInterests);
    try {
      await updateDoc(userProfileRef, { interests: newInterests });
    } catch (err) {
      console.error("Erro ao atualizar interesses:", err);
    }
  };

  const handleUpdateNotificationPrefs = async (pref: string) => {
    if (!user || !userProfileRef) return;
    const newPrefs = userNotificationPrefs.includes(pref)
      ? userNotificationPrefs.filter(p => p !== pref)
      : [...userNotificationPrefs, pref];
    
    setUserNotificationPrefs(newPrefs);
    try {
      await updateDoc(userProfileRef, { notificationPrefs: newPrefs });
    } catch (err) {
      console.error("Erro ao atualizar notificações:", err);
    }
  };

  const handleUpdateTheme = async (theme: 'light' | 'dark' | 'sepia') => {
    if (!user || !userProfileRef) return;
    setAppTheme(theme);
    try {
      await updateDoc(userProfileRef, { appTheme: theme });
    } catch (err) {
      console.error("Erro ao atualizar tema:", err);
    }
  };

  const handleUpdatePersonalData = async (data: { name: string, phone: string, email: string, privacyMode: 'anonymous' | 'leadership' }) => {
    if (!user || !userProfileRef) return;
    setPrivacyMode(data.privacyMode);
    try {
      await updateDoc(userProfileRef, { 
        name: data.name,
        phone: data.phone,
        email: data.email,
        privacyMode: data.privacyMode
      });
      // Also update linked member record if any
      const userMember = members.find(m => m.email === user.email);
      if (userMember) {
        await updateDoc(doc(db, 'members', userMember.id), {
          name: data.name,
          phone: data.phone,
          email: data.email
        });
      }
      alert("Dados atualizados com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
      alert("Erro ao salvar dados.");
    }
  };

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setIsAiLoading(true);
    setAiError('');
    setAiResponse('');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Configuração de IA ausente no ambiente.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Você é um assistente cristão que responde com base na Bíblia, com linguagem simples, acolhedora e respeitosa.

Pergunta do usuário: ${aiQuestion}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      if (!response.text) {
        throw new Error('Não recebi uma resposta válida da IA.');
      }

      setAiResponse(response.text);
    } catch (err) {
      console.error(err);
      setAiError('Erro ao conectar. Tente novamente.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAnalyzeFakeNews = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fakeNewsInput.trim()) return;

    setIsAnalyzingFakeNews(true);
    setFakeNewsAnalysis(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Configuração de IA ausente.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Você é um especialista em detecção de desinformação e fake news, com profunda base em ética cristã e princípios bíblicos.
Sua missão é analisar a notícia ou afirmação abaixo e fornecer um veredito claro.

ENTRADA: "${fakeNewsInput}"

DIRETRIZES DE ANÁLISE:
1. Veracidade Factual: Cruze com conhecimentos gerais e fatos conhecidos.
2. Perspectiva Bíblica: Como a Bíblia trata esse assunto ou o ato de espalhar tal informação? Cite princípios como "não dirás falso testemunho".
3. Tom e Sensacionalismo: Analise se a linguagem é feita para causar pânico ou ódio.

SAÍDA ESPERADA:
Retorne RIGOROSAMENTE um JSON com este schema:
{
  "verdict": "true" | "false" | "misleading" | "unknown",
  "explanation": "Explicação detalhada sobre a veracidade",
  "biblicalPerspective": "Breve comentário baseado na sabedoria bíblica sobre o tema",
  "confidence": 0-100 (nível de certeza)
}`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Resposta inválida da IA.');
      }

      const analysisResult = JSON.parse(text);
      setFakeNewsAnalysis(analysisResult);
    } catch (err) {
      console.error(err);
      alert('Erro ao analisar notícia. Tente novamente.');
    } finally {
      setIsAnalyzingFakeNews(false);
    }
  };

  const handleResetApp = async () => {
    if (!isAdmin || !isAdminUnlocked) return;
    if (!confirm("AVISO CRÍTICO: Isso apagará todos os dados de membros, avisos, escalas, financeiro e mensagens. Deseja continuar?")) return;
    
    setIsResetting(true);
    try {
      const collectionsToClear = [
        'members', 'announcements', 'scales', 'financial', 
        'chatRooms', 'devotionals', 'prayers', 'agenda', 
        'courses', 'enrollments', 'bulletins', 'activityLogs'
      ];

      for (const collName of collectionsToClear) {
        try {
          const snap = await getDocs(collection(db, collName));
          const deletePromises = snap.docs.map(d => deleteDoc(doc(db, collName, d.id)));
          await Promise.all(deletePromises);
        } catch (e) {
          console.warn(`Could not clear collection ${collName}`, e);
        }
      }
      
      alert("Sistema resetado com sucesso para a nova fase!");
      window.location.reload();
    } catch (err) {
      console.error("Erro ao resetar aplicativo:", err);
      alert("Houve um erro ao resetar alguns dados.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDownloadMembersReport = () => {
    const headers = ['Name', 'Role', 'Ministry', 'Status', 'Email'];
    const data = members.map(m => ({
      name: m.name,
      role: m.role,
      ministry: m.ministry,
      status: m.status,
      email: m.email || 'N/A'
    }));
    downloadCSV(data, 'relatorio_membros', headers);
  };

  const handleDownloadFinancialReport = () => {
    const headers = ['Date', 'Type', 'Amount', 'User'];
    const data = (financialData as any[]).map(t => ({
      date: t.date?.toDate().toLocaleDateString() || '',
      type: t.type,
      amount: t.amount,
      user: (privacyMode === 'anonymous' && !isAdminUnlocked) ? 'Anônimo' : (t.userName || 'N/A')
    }));
    downloadCSV(data, 'relatorio_financeiro', headers);
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const trimmedPassword = adminSecretState.trim();
    if (trimmedPassword.length < 4) {
      alert("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    try {
      await setDoc(doc(db, 'config', 'church'), { adminSecret: trimmedPassword }, { merge: true });
      setAdminSecretState(trimmedPassword);
      await addActivityLog("Segurança Atualizada", "Senha do painel administrativo alterada.");
      alert("Senha administrativa atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar senha admin:", err);
      alert("Erro ao salvar no banco. Verifique as permissões.");
    }
  };

  const handleInitialPasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Erro: Você não tem permissão para definir a senha administrativa. Verifique se está logado com a conta correta.");
      return;
    }
    if (adminPasswordInput.length < 4) {
      alert("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    try {
      await setDoc(doc(db, 'config', 'church'), { adminSecret: adminPasswordInput.trim() }, { merge: true });
      setAdminSecretState(adminPasswordInput.trim());
      setIsAdminUnlocked(true);
      setIsAdminSetupMode(false);
      setAdminPasswordInput('');
      localStorage.setItem('admin_unlocked', 'true');
      await addActivityLog("Segurança Inicial", "Senha do painel administrativo configurada.");
      alert("Senha configurada com sucesso! Você já tem acesso ao painel.");
    } catch (err) {
      console.error("Erro ao configurar senha inicial:", err);
      alert("Ocorreu um erro ao salvar a senha no banco de dados. Verifique sua conexão.");
    }
  };
  const handleUpdatePixKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'config', 'church'), { pixKey }, { merge: true });
      await addActivityLog("Configuração Atualizada", `Chave Pix alterada para: ${pixKey}`);
      alert("Chave Pix atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar chave Pix:", err);
    }
  };

  const handleUpdateVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'config', 'church'), { verseTitle, verseRef }, { merge: true });
      await addActivityLog("Configuração Atualizada", `Versículo inicial alterado.`);
      alert("Versículo atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar versículo:", err);
    }
  };

  const handleTogglePrivacyMode = async () => {
    if (!isAdmin) return;
    const newMode = privacyMode === 'anonymous' ? 'leadership' : 'anonymous';
    try {
      await setDoc(doc(db, 'config', 'church'), { privacyMode: newMode }, { merge: true });
      setPrivacyMode(newMode);
      await addActivityLog("Privacidade Atualizada", `Modo de ofertas alterado para: ${newMode}`);
    } catch (err) {
      console.error("Erro ao alternar modo de privacidade:", err);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    alert('Chave Pix copiada com sucesso!');
  };

  const getChartData = () => {
    const data = financialData as any[];
    const aggregated: Record<string, number> = {};
    
    data.forEach(t => {
      const type = t.type || 'Outros';
      aggregated[type] = (aggregated[type] || 0) + (t.amount || 0);
    });

    return Object.entries(aggregated).map(([name, value]) => ({ name, value }));
  };

  if (loading || splash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <Logo size="lg" glow />
        <motion.div 
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3 }}
           className="mt-12 text-center"
        >
          <h2 className="text-xl font-black text-slate-800 tracking-[0.3em] uppercase italic">Igreja Conectada</h2>
          <div className="mt-4 w-48 h-1.5 bg-slate-100 rounded-full mx-auto relative overflow-hidden">
             <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: '100%' }}
               transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
               className="absolute inset-0 bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"
             />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="pb-24 max-w-md mx-auto bg-white min-h-screen"
          >
            {/* New Mockup Header */}
            <header className="p-6 flex justify-between items-center">
              <div>
                <h1 className="text-blue-900 font-bold text-xl flex items-center gap-2">
                  <span className="bg-blue-600 w-6 h-6 flex items-center justify-center rounded text-white text-xs">†</span> 
                  COMUNIDADE VIVA
                </h1>
                <p className="text-slate-400 text-[10px] mt-4 font-black uppercase tracking-[0.2em]">Página Inicial</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-xs text-slate-500 block">Olá,</span>
                  <span className="text-sm font-bold text-slate-800">{user?.displayName?.split(' ')[0] || 'Visitante'}</span>
                </div>
                <button 
                  onClick={() => setActiveView('profile')}
                  className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm shadow-slate-200/50"
                >
                  <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'U'}&background=6F7DAA&color=fff`} className="w-full h-full object-cover" alt="Profile" />
                </button>
              </div>
            </header>

            {/* Hero Section - Next Service */}
            <section className="px-5 mb-10">
              <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                <div className="absolute right-[-30px] top-[-30px] w-48 h-48 bg-blue-500 opacity-20 rounded-full blur-3xl"></div>
                <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 bg-emerald-500 opacity-10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 block">Próximo Culto:</span>
                  <h2 className="text-3xl font-black italic tracking-tighter mb-6 leading-none">Celebração de <br /> Domingo</h2>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center space-x-3 text-sm font-medium opacity-90">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                         <Calendar className="w-4 h-4 text-blue-400" />
                      </div>
                      <span>Domingo, 18:00h</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm font-medium opacity-90">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                         <MapPin className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span>Coração Transformado</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveView('lives')}
                    className="w-full bg-white text-slate-900 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-slate-50 transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    ASSISTIR AO VIVO
                  </button>
                </div>
              </div>
            </section>

            {/* Highlights Section */}
            <section className="px-5 mb-10">
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em]">Destaques da Semana</h3>
                <span className="w-8 h-px bg-slate-100"></span>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  className="min-w-[160px] bg-blue-50 rounded-[32px] p-6 flex flex-col items-center text-center border border-blue-100/50"
                >
                  <div className="w-20 h-20 bg-white rounded-3xl mb-4 overflow-hidden border-2 border-white shadow-xl shadow-blue-900/5">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Pastor" />
                  </div>
                  <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest mb-1">CULTO AO VIVO</p>
                  <span className="text-[11px] font-bold text-slate-500 mb-4 block">Pr. Daniel Silva</span>
                  <button onClick={() => setActiveView('lives')} className="text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-blue-600/20">Assista Agora</button>
                </motion.div>

                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveView('locations')}
                  className="min-w-[160px] bg-emerald-50 rounded-[32px] p-6 flex flex-col items-center text-center border border-emerald-100/50"
                >
                  <div className="flex -space-x-3 mb-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-12 h-12 rounded-2xl bg-white border-2 border-white shadow-lg overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1">Grupos Pequenos</p>
                  <span className="text-[11px] font-bold text-slate-500 mb-4 block">Comunhão e Fé</span>
                  <button className="text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-emerald-600/20">Encontrar</button>
                </motion.div>

                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveView('bible')}
                  className="min-w-[160px] bg-amber-50 rounded-[32px] p-6 flex flex-col items-center text-center border border-amber-100/50"
                >
                  <div className="w-20 h-20 bg-white rounded-3xl mb-4 flex items-center justify-center border-2 border-white shadow-xl shadow-amber-900/5 text-amber-500">
                    <BookOpen className="w-10 h-10" />
                  </div>
                  <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1">BÍBLIA DIGITAL</p>
                  <span className="text-[11px] font-bold text-slate-500 mb-4 block">Leitura Diária</span>
                  <button className="text-[9px] font-black uppercase tracking-widest bg-amber-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-amber-600/20">Ler Agora</button>
                </motion.div>
              </div>
            </section>

            {/* Explore More Grid */}
            <section className="px-5 mb-10">
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em]">Explorar Mais</h3>
                <span className="w-8 h-px bg-slate-100"></span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div onClick={() => setActiveView('devotionals')} className="flex flex-col items-center gap-3 cursor-pointer group">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pregações</span>
                </div>
                <div onClick={() => setActiveView('agenda')} className="flex flex-col items-center gap-3 cursor-pointer group">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Agenda</span>
                </div>
                <div onClick={() => setActiveView('prayers')} className="flex flex-col items-center gap-3 cursor-pointer group">
                  <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Orações</span>
                </div>
                <div onClick={() => setActiveView('courses')} className="flex flex-col items-center gap-3 cursor-pointer group">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cursos</span>
                </div>
              </div>
            </section>

            {/* Verse of the Day Footer Banner */}
            <div className="px-5 mb-8">
              <div className="bg-slate-50 border border-slate-100 p-8 rounded-[32px] text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Zap className="w-20 h-20 text-blue-600" />
                </div>
                <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Versículo do Dia</p>
                <h4 className="text-sm font-bold text-slate-800 leading-relaxed italic mb-4">
                  "{verseTitle || 'O Senhor é o meu pastor, nada me faltará.'}"
                </h4>
                <div className="inline-flex items-center space-x-2 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                   <BookOpen className="w-3 h-3 text-blue-600" />
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{verseRef || 'Salmos 23:1'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'bible':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pb-32 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center space-x-4">
                {selectedBibleBook && (
                  <button 
                    onClick={() => {
                      if (bibleContent) setBibleContent(null);
                      else setSelectedBibleBook(null);
                    }}
                    className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">
                  {selectedBibleBook ? `${selectedBibleBook} ${selectedBibleChapter}` : 'Bíblia'}
                </h1>
              </div>
              <button 
                onClick={() => { setSelectedBibleBook(null); setBibleContent(null); }}
                className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>

            {!selectedBibleBook && !bibleSearchResults ? (
              <>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBibleSearch();
                  }}
                  className="relative mb-8 bg-white border border-slate-100 p-2 rounded-[32px] flex items-center px-6 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all mx-2"
                >
                   <Search className="w-5 h-5 text-slate-400 mr-3" />
                   <input 
                     type="text" 
                     placeholder="Buscar na Bíblia (ex: Amor, Fé, João 3:16)" 
                     value={bibleSearchQuery}
                     onChange={(e) => setBibleSearchQuery(e.target.value)}
                     className="bg-transparent border-none outline-none py-4 text-sm font-medium w-full" 
                   />
                   {bibleSearchQuery && (
                     <button 
                       type="button"
                       onClick={() => {
                         setBibleSearchQuery('');
                         setBibleSearchResults(null);
                       }}
                       className="p-2 text-slate-300 hover:text-slate-500 transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   )}
                </form>

                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-[40px] p-8 shadow-xl shadow-indigo-100/50 mb-8 relative overflow-hidden mx-2">
                  <div className="absolute top-4 right-4 text-indigo-200">
                    <BookOpen className="w-16 h-16 opacity-20" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Versículo do dia</p>
                    </div>
                    <h3 className="text-xl font-black text-indigo-900 leading-tight italic mb-4">
                      {verseTitle}
                    </h3>
                    <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">{verseRef}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-xl font-black text-slate-800 italic">Planos de leitura</h3>
                  <button className="text-[10px] font-black text-primary uppercase tracking-widest">Ver todos</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 px-2">
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[32px] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
                    <div className="relative z-10">
                      <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Plano de 7 dias</p>
                      <h4 className="text-sm font-bold text-emerald-900 leading-tight">Comece hoje</h4>
                    </div>
                    <Sprout className="absolute bottom-[-10px] right-[-10px] w-16 h-16 text-emerald-200 opacity-30 transform group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="bg-purple-50 border border-purple-100 p-6 rounded-[32px] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
                      <div className="relative z-10">
                      <p className="text-[9px] font-black text-purple-600 uppercase mb-1">Plano de 30 dias</p>
                      <h4 className="text-sm font-bold text-purple-900 leading-tight">Transformação</h4>
                    </div>
                    <Flame className="absolute bottom-[-10px] right-[-10px] w-16 h-16 text-purple-200 opacity-30 transform group-hover:scale-110 transition-transform" />
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-6 italic px-2">Livros da Bíblia</h3>
                <div className="grid grid-cols-2 gap-3 px-2">
                   {BIBLE_BOOKS.map((book, i) => (
                     <button 
                       key={i} 
                       onClick={() => {
                         setSelectedBibleBook(book);
                         setSelectedBibleChapter(1);
                       }}
                       className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[28px] group hover:border-primary/30 transition-all shadow-sm"
                     >
                       <span className="text-sm font-bold text-slate-700 truncate">{book}</span>
                       <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all" />
                     </button>
                   ))}
                </div>
              </>
            ) : isSearchingBible ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Pesquisando nas Escrituras...</p>
              </div>
            ) : bibleSearchResults ? (
              <div className="mx-2 space-y-6 mb-32">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xl font-black text-slate-800 italic">Resultados para "{bibleSearchQuery}"</h3>
                   <button 
                     onClick={() => setBibleSearchResults(null)}
                     className="text-xs font-black text-primary uppercase tracking-widest"
                   >
                     Limpar
                   </button>
                </div>
                {bibleSearchResults.length > 0 ? (
                  <div className="space-y-4">
                    {bibleSearchResults.map((v: any, idx: number) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx} 
                        className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => {
                          const bookTitle = BIBLE_BOOKS.find(b => BIBLE_BOOKS_MAP[b] === v.book_name) || v.book_name;
                          setSelectedBibleBook(bookTitle);
                          setSelectedBibleChapter(v.chapter);
                          setBibleSearchResults(null);
                        }}
                      >
                         <div className="flex items-center justify-between mb-3">
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{v.book_name} {v.chapter}:{v.verse}</span>
                           <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-primary transition-all" />
                         </div>
                         <p className="text-sm font-medium text-slate-800 leading-relaxed italic">
                           "{v.text}"
                         </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center bg-white rounded-[48px] border-4 border-dashed border-slate-50 italic text-slate-300 uppercase tracking-widest text-[10px] font-black">
                    Nenhum versículo encontrado.
                  </div>
                )}
              </div>
            ) : isBibleLoading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abrindo Livro...</p>
              </div>
            ) : bibleContent ? (
              <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl mb-32 mx-2">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    disabled={selectedBibleChapter <= 1}
                    onClick={() => setSelectedBibleChapter(prev => prev - 1)}
                    className="p-3 bg-slate-50 rounded-2xl text-slate-400 disabled:opacity-20 transition-all active:scale-90"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Capítulo {selectedBibleChapter}</p>
                  <button 
                    onClick={() => setSelectedBibleChapter(prev => prev + 1)}
                    className="p-3 bg-slate-50 rounded-2xl text-slate-400 transition-all active:scale-90"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="prose prose-slate max-w-none">
                  {bibleContent.verses?.map((v: any, idx: number) => (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx} 
                      className="mb-4 text-slate-700 leading-relaxed font-serif"
                    >
                      <sup className="mr-2 text-[10px] font-black text-primary/40 italic">{v.verse}</sup>
                      {v.text}
                    </motion.p>
                  ))}
                </div>
                

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => void registrarAtividadeEden('leitura_diaria', {
                      livro: selectedBibleBook || 'Leitura diária',
                      capitulo: String(selectedBibleChapter),
                      data_referencia: edenDataReferencia(),
                      concluido: true,
                    })}
                    disabled={edenRegistroEmAndamento !== null}
                    className="w-full rounded-[24px] bg-emerald-600 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {edenRegistroEmAndamento === 'leitura_diaria'
                      ? 'Registrando leitura...'
                      : 'Marcar leitura diária como concluída'}
                  </button>
                </div>

                <div className="mt-12 flex justify-center">
                  <button 
                    onClick={() => {
                       setSelectedBibleChapter(prev => prev + 1);
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-10 py-4 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                  >
                    Próximo Capítulo
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-20">
                <p className="text-slate-400">Erro ao carregar o conteúdo. Tente novamente.</p>
                <button onClick={() => fetchBibleChapter(selectedBibleBook!, selectedBibleChapter)} className="mt-4 text-primary font-bold">Recarregar</button>
              </div>
            )}
          </motion.div>
        );

      case 'donations':
        return (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="pb-32 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center justify-between mb-10 px-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Doar</h1>
              <Heart className="w-6 h-6 text-red-500 fill-red-500/10" />
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200/50 mb-10 mx-2 group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-30" />
              <div className="relative z-10">
                <h2 className="text-3xl font-black italic tracking-tighter leading-tight mb-4">Gratidão que Transforma</h2>
                <p className="text-sm text-indigo-100/80 font-medium leading-relaxed max-w-[200px]">Honre ao Senhor com os seus bens e com as primícias.</p>
              </div>
              <div className="absolute bottom-[-20px] right-[-20px] p-6 opacity-60">
                 <Heart className="w-32 h-32 text-white/20 fill-white/10" />
              </div>
            </div>

            <div className="mb-10 px-2">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Finalidade da Oferta</p>
               <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide pb-2">
                 {['Dízimo', 'Oferta', 'Missões', 'Construção'].map((type) => (
                   <button 
                     key={type} 
                     onClick={() => {
                       setTransactionType(type === 'Construção' ? 'Oferta' : type as any);
                       setShowTransactionForm(true);
                     }}
                     className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${transactionType === type ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200'}`}
                   >
                     {type}
                   </button>
                 ))}
               </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-3">Método de Contribuição</p>
            <div className="space-y-4 px-2">
               {[
                 { icon: Wallet, label: 'Saldo / Reservas', sub: 'Transação Segura e Instantânea', action: () => { setTransactionType('Oferta'); setShowTransactionForm(true); } },
                 { icon: QrCode, label: 'PIX Institucional', sub: 'Confirmação via Chave ou QR', action: () => setActiveView('financial') },
                 { icon: FileText, label: 'Boleto Bancário', sub: 'Compensação em até 48 horas', action: () => alert('Funcionalidade em implantação. Use PIX por enquanto.') }
               ].map((method, i) => (
                 <button key={i} onClick={method.action} className="w-full flex items-center justify-between p-7 bg-white border border-slate-100 rounded-[2.5rem] group hover:border-indigo-200 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-600/5">
                   <div className="flex items-center space-x-5">
                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                       <method.icon className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                     </div>
                     <div className="text-left">
                       <h4 className="text-sm font-black text-slate-800 tracking-tight italic">{method.label}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{method.sub}</p>
                     </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                 </button>
               ))}
            </div>

          </motion.div>
        );

      case 'prayers':
        return (
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="pb-32 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center justify-between mb-10 px-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Pedidos de oração</h1>
              <button className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <Settings className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="bg-indigo-600 border border-indigo-700 rounded-[3rem] p-10 mb-10 shadow-2xl shadow-indigo-200/50 mx-2 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
               <h3 className="text-3xl font-black italic tracking-tighter mb-2">Envie seu Pedido</h3>
               <p className="text-[10px] font-black text-indigo-200/80 mb-8 uppercase tracking-[0.2em] italic">Nossa liderança vai orar por você</p>
               
               <div className="space-y-6 relative z-10">
                 <textarea 
                   placeholder="Conte-nos como podemos interceder..." 
                   className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-sm font-medium outline-none text-white placeholder:text-indigo-200/50 min-h-[160px] shadow-inner focus:bg-white/10 transition-all"
                 />
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                   <div className="flex items-center space-x-4 bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
                      <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer group/toggle">
                         <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full translate-x-0 transition-transform group-hover/toggle:scale-110" />
                      </div>
                      <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Identidade Oculta</span>
                   </div>
                   <button className="w-full sm:w-auto bg-white text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 rounded-[1.5rem] shadow-xl shadow-indigo-900/20 flex items-center justify-center space-x-3 hover:bg-secondary hover:text-white transition-all active:scale-95 group/submit">
                     <Heart className="w-4 h-4 fill-current group-hover/submit:scale-110 transition-transform" />
                     <span>Enviar Pedido</span>
                   </button>
                 </div>
               </div>
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-8 italic px-2">Pedidos Recentes</h3>
            <div className="space-y-4 px-2 pb-12">
               {[
                 { name: 'Vitória da minha filha', date: 'Hoje', prayers: 12 },
                 { name: 'Saúde do meu pai', date: 'Ontem', prayers: 45 },
                 { name: 'Agradecimento pela família', date: 'Ontem', prayers: 8 }
               ].map((p, i) => (
                 <div key={i} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-600/5 transition-all">
                   <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                         <Heart className="w-6 h-6 text-slate-200 group-hover:text-white transition-colors" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-slate-800 tracking-tight italic">{p.name}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.date} • Interceção</p>
                      </div>
                   </div>
                   <div className="flex items-center space-x-3 bg-red-50/50 px-4 py-2 rounded-xl group-hover:bg-red-500 transition-colors">
                     <span className="text-[11px] font-black text-red-600 group-hover:text-white">{p.prayers}</span>
                     <Heart className="w-4 h-4 text-red-500 fill-current group-hover:text-white" />
                   </div>
                 </div>
               ))}
            </div>
          </motion.div>
        );

      case 'announcements':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('home')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-slate-900">Todos os Avisos</h1>
            </div>
            <div className="space-y-4">
              {announcements && announcements.length > 0 ? (
                (announcements as any[]).map((a: any) => (
                  <AnnouncementCard 
                    key={a.id}
                    id={a.id}
                    title={a.title} 
                    tag={a.tag} 
                    date={a.date} 
                    isAdmin={isAdmin || false}
                    isPinned={a.isPinned}
                    onDelete={(id) => handleDeleteItem('announcements', id)}
                    onEdit={() => setEditingAnnouncement(a)}
                    onClick={() => setViewingAnnouncement(a)}
                  />
                ))
              ) : (
                <div className="text-center py-20 opacity-30">
                  <Bell className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum aviso no momento</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'ai-chat':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="pb-24 max-w-2xl mx-auto px-4 pt-12 min-h-screen flex flex-col"
          >
            <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('home')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight italic text-primary">Tire sua dúvida</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Assistente Bíblico IA</p>
              </div>
            </div>

            <div className="flex-1 space-y-6 mb-32 overflow-y-auto pr-2 scrollbar-hide">
              <div className="bg-primary/10 border border-primary/20 p-6 rounded-[32px] text-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm text-primary">Igreja Conectada IA</span>
                  </div>
                  {(aiResponse || aiError) && (
                    <button 
                      onClick={() => { setAiResponse(''); setAiQuestion(''); setAiError(''); }}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  Olá! Sou seu assistente cristão. Como posso te ajudar hoje com dúvidas sobre a Bíblia, vida cristã ou conselhos espirituais?
                </p>
              </div>

              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-card text-slate-800"
                >
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Resposta do Assistente
                  </div>
                  <div className="prose prose-slate max-w-none text-sm font-medium leading-relaxed whitespace-pre-wrap">
                    {aiResponse}
                  </div>
                </motion.div>
              )}

              {aiError && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-xs font-bold text-center">
                  {aiError}
                </div>
              )}

              {isAiLoading && (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <Activity className="w-10 h-10 animate-pulse text-primary mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Consultando as escrituras...</p>
                </div>
              )}
            </div>

            <div className="fixed bottom-24 left-0 right-0 px-4 max-w-2xl mx-auto z-40 lg:left-80 lg:mx-0 lg:max-w-none lg:pr-8">
              <form 
                onSubmit={handleAiAsk}
                className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl p-4 rounded-[32px] flex items-center space-x-3"
              >
                <input 
                  type="text"
                  placeholder="Faça sua pergunta..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                  disabled={isAiLoading}
                />
                <button 
                  type="submit"
                  disabled={isAiLoading || !aiQuestion.trim()}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                    isAiLoading || !aiQuestion.trim() 
                    ? 'bg-slate-200 text-slate-400' 
                    : 'bg-primary text-white shadow-primary/20 hover:scale-105'
                  }`}
                >
                  <MessageSquare className="w-6 h-6" />
                </button>
              </form>
            </div>
          </motion.div>
        );

      case 'ministries':
        if (!isScaleUnlocked && !isAdminUnlocked) {
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[60vh] flex flex-col items-center justify-center px-4">
              <div className="bg-white p-10 rounded-[48px] shadow-2xl border border-slate-100 w-full max-w-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 italic">Acesso Restrito</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-8">
                  Digite a senha para ver as escalas
                </p>
                
                <form onSubmit={handleScaleLogin} className="space-y-4">
                  <div className="relative">
                    <input 
                      autoFocus
                      type={showScaleViewPassword ? "text" : "password"}
                      placeholder="Senha de Acesso"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pr-12 pl-6 text-center text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                      value={scalePasswordInput}
                      onChange={e => setScalePasswordInput(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowScaleViewPassword(!showScaleViewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                    >
                      {showScaleViewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all hover:bg-primary"
                  >
                    Ver Escalas
                  </button>
                </form>
              </div>
            </motion.div>
          );
        }

        if (selectedMinistry) {
          const ministryScales = (allScales as any[] || []).filter(s => s.ministry === selectedMinistry);
          const userMember = members.find(m => m.email === user?.email);
          
          return (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="pb-24 max-w-2xl mx-auto pt-12 px-4"
            >
              <div className="flex items-center space-x-4 mb-8">
                <button 
                  onClick={() => setSelectedMinistry(null)}
                  className="p-2.5 bg-white border border-slate-100 rounded-2xl shadow-card"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                  <h1 className="text-3xl font-black text-slate-900">{selectedMinistry}</h1>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest mt-1">Detalhes do Departamento</p>
                </div>
              </div>

              <SectionHeader title="Próximas Escalas" />
              <div className="space-y-4">
                {ministryScales.length > 0 ? (
                  ministryScales.map(s => {
                    const isMyScale = s.memberId === userMember?.id || s.replacementId === userMember?.id;
                    
                    return (
                      <div key={s.id} className={`p-5 bg-white rounded-[32px] border ${isMyScale ? 'border-primary shadow-lg shadow-primary/5' : 'border-slate-100'} flex flex-col space-y-4 shadow-sm hover:border-primary/20 transition-all`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-slate-100 bg-slate-50 flex-shrink-0">
                               <img src={s.memberAvatar || `https://picsum.photos/seed/${s.memberId}/100`} alt={s.memberName} referrerPolicy="no-referrer" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">{s.role}</p>
                               <h4 className="text-base font-black text-slate-800">{s.memberName}</h4>
                               <div className="flex items-center space-x-2 mt-1">
                                 <span className="text-[9px] font-bold text-primary flex items-center"><Calendar className="w-3 h-3 mr-1" /> {s.date}</span>
                                 {s.status === 'confirmed' && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase">Confirmado</span>}
                                 {s.status === 'needs_replacement' && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase animate-pulse">Solicitado Substituto</span>}
                               </div>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex space-x-1">
                              <button onClick={() => setEditingScale(s)} className="p-2 text-slate-300 hover:text-primary"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteItem('scales', s.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </div>

                        {isMyScale && s.status !== 'confirmed' && s.status !== 'needs_replacement' && (
                          <div className="flex space-x-2">
                             <button 
                               onClick={() => handleConfirmScale(s.id, s.status)}
                               className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                             >
                               Confirmar Presença
                             </button>
                             <button 
                               onClick={() => {
                                 const reason = prompt("Por que precisa de substituição?");
                                 if (reason) handleRequestReplacement(s.id, reason);
                               }}
                               className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100"
                             >
                               Pedir Troca
                             </button>
                          </div>
                        )}
                        
                        {isMyScale && s.status === 'confirmed' && (
                           <button 
                             onClick={() => handleConfirmScale(s.id, s.status)}
                             className="w-full py-3 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100"
                           >
                             Presença Confirmada
                           </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 opacity-40 bg-white rounded-[40px] border border-slate-100 border-dashed">
                    <Zap className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhuma escala encontrada</p>
                  </div>
                )}
              </div>

              <SectionHeader 
                title="Membros do Departamento" 
                onAdd={isAdmin ? () => {
                  setNewMember({ ...newMember, name: '', role: '', phone: '', email: '', ministry: selectedMinistry || '' });
                  setShowMemberForm(true);
                } : undefined}
              />

              <AnimatePresence>
                {showMemberForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      await handleCreateMember(e);
                      setShowMemberForm(false);
                    }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-bold italic">Vincular Novo Membro</h4>
                        <button type="button" onClick={() => setShowMemberForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                            value={newMember.name}
                            onChange={e => setNewMember({...newMember, name: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Função / Instrumento</label>
                            <input 
                              required
                              type="text" 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                              value={newMember.role}
                              onChange={e => setNewMember({...newMember, role: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ministério</label>
                            <select 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                              value={newMember.ministry}
                              onChange={e => setNewMember({...newMember, ministry: e.target.value})}
                            >
                              {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone</label>
                             <input 
                               type="text" 
                               placeholder="(00) 00000-0000"
                               className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                               value={newMember.phone}
                               onChange={e => setNewMember({...newMember, phone: e.target.value})}
                             />
                           </div>
                           <div>
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                             <input 
                               type="email" 
                               placeholder="email@exemplo.com"
                               className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                               value={newMember.email}
                               onChange={e => setNewMember({...newMember, email: e.target.value})}
                             />
                           </div>
                        </div>
                      </div>
                      <button type="submit" className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">Finalizar Vínculo</button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-3">
                {members && members.filter(m => m.ministry === selectedMinistry).length > 0 ? (
                  members.filter(m => m.ministry === selectedMinistry).map(member => (
                    <div key={member.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                           <img src={member.avatar || "https://picsum.photos/seed/church/100"} alt={member.name} referrerPolicy="no-referrer" />
                         </div>
                         <div>
                           <h4 className="text-sm font-bold text-slate-800">{member.name}</h4>
                           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{member.role}</p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-3">
                         <div className="flex items-center space-x-2">
                           <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              member.status === 'Líder' ? 'bg-indigo-50 text-indigo-600' :
                              member.status === 'Ativo' ? 'bg-green-50 text-green-600' :
                              'bg-orange-50 text-orange-600'
                            }`}>
                              {member.status}
                            </div>
                            {isAdmin && (
                              <div className="flex items-center space-x-1 ml-2 border-l border-slate-100 pl-2">
                                <button 
                                  onClick={() => setEditingMember(member)}
                                  className="p-1.5 text-slate-300 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteItem('members', member.id)}
                                  className="p-1.5 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhum membro vinculado</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="pb-24 max-w-2xl mx-auto"
          >
            <SectionHeader title="Ministérios" />
            <div className="px-4 space-y-4">
              {[
                { name: 'Louvor', icon: Music },
                { name: 'Mídia', icon: Video },
                { name: 'Recepção', icon: Users },
                { name: 'Crianças', icon: Heart },
                { name: 'Apoio', icon: Shield },
                { name: 'Corpo Diaconal', icon: Users }
              ].map((m) => (
                <div 
                  key={m.name} 
                  onClick={() => setSelectedMinistry(m.name)}
                  className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 group cursor-pointer hover:shadow-card hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
                      <m.icon className="w-6 h-6 text-slate-400 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{m.name}</h3>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.15em]">
                        {(allScales as any[] || []).filter(s => s.ministry === m.name).length} Escalas Montadas
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              ))}
            </div>

            <SectionHeader title="Minhas Escalas Confirmadas" />
            <div className="px-4 space-y-3">
              {allScales.filter(s => confirmedScales.includes(s.id)).length > 0 ? (
                allScales.filter(s => confirmedScales.includes(s.id)).map(s => (
                  <div key={s.id} className="p-5 bg-white rounded-[24px] border border-slate-100 flex items-start justify-between shadow-card hover:border-primary/20 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">{s.ministry}</p>
                      <h4 className="text-lg font-bold text-slate-800">{s.role}</h4>
                      <div className="flex items-center space-x-3 mt-2 text-xs font-medium text-slate-400">
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 opacity-60" /> {s.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">
                        CONFIRMADO
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 opacity-50 bg-white rounded-3xl border border-slate-50 border-dashed">
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhuma escala confirmada ainda</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'financial':
        const myTransactions = (financialData as any[])?.filter(t => t.userId === user?.uid) || [];
        const totalArrecadado = (financialData as any[])?.reduce((acc, t) => acc + (t.amount || 0), 0) || 0;
        const totalOfertasCount = (financialData as any[])?.length || 0;
        const progressTarget = 10000; // Meta configurável ou fixa

        return (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="pb-32 max-w-2xl mx-auto px-4 pt-10"
          >
            <div className="flex items-center justify-between mb-8 px-1">
              <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl w-fit border border-slate-100">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Finanças & Privacidade</span>
              </div>

              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest hidden md:block">Privacidade:</span>
                  <button 
                    onClick={handleTogglePrivacyMode}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all shadow-sm active:scale-95 ${
                      privacyMode === 'anonymous' 
                        ? 'bg-accent text-white border-accent' 
                        : 'bg-primary text-white border-primary'
                    }`}
                  >
                    {privacyMode === 'anonymous' ? (
                      <><ShieldCheck className="w-4 h-4" /> <span>Anônimo</span></>
                    ) : (
                      <><Users className="w-4 h-4" /> <span>Liderança</span></>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Fintech Card Header */}
            <div className="bg-primary rounded-[20px] p-8 text-white relative overflow-hidden mb-8 shadow-sm">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-80 mb-2">Total Consolidado (Mês)</p>
                    <h2 className="text-4xl font-bold tracking-tight">R$ {totalArrecadado.toLocaleString()}</h2>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                     <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-1">Meta Mensal</p>
                       <p className="text-lg font-bold">R$ {progressTarget.toLocaleString()}</p>
                     </div>
                     <span className="text-xs font-bold">{Math.round((totalArrecadado / progressTarget) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalArrecadado / progressTarget) * 100, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm text-center">
                  <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{totalOfertasCount}</h4>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Contribuições</p>
               </div>
               <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm text-center">
                  <div className="w-10 h-10 bg-accent/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-5 h-5 text-accent" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-800 tracking-tight">R$ {totalOfertasCount > 0 ? (totalArrecadado / totalOfertasCount).toFixed(0) : 0}</h4>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Média Geral</p>
               </div>
            </div>

            {/* Contribution Actions */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => { setTransactionType('Dízimo'); setShowTransactionForm(true); }}
                className="bg-primary text-white p-6 rounded-[20px] shadow-sm hover:scale-105 active:scale-95 transition-all text-center group"
              >
                <Plus className="w-6 h-6 mx-auto mb-3 group-hover:rotate-90 transition-transform" />
                <h3 className="font-bold text-lg">Dízimo</h3>
                <p className="text-[10px] font-semibold uppercase opacity-70 mt-1">Fidelidade</p>
              </button>
              <button 
                onClick={() => { setTransactionType('Oferta'); setShowTransactionForm(true); }}
                className="bg-accent text-white p-6 rounded-[20px] shadow-sm hover:scale-105 active:scale-95 transition-all text-center group"
              >
                <Heart className="w-6 h-6 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg">Oferta</h3>
                <p className="text-[10px] font-semibold uppercase opacity-70 mt-1">Generosidade</p>
              </button>
            </div>

            {/* Double Tab System */}
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
               <div className="flex p-1.5 bg-slate-50">
                  <button 
                    onClick={() => setActiveHomeTab('contributions')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeHomeTab === 'contributions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Mural Público
                  </button>
                  <button 
                    onClick={() => setActiveHomeTab('benevolence')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeHomeTab === 'benevolence' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Histórico Privado
                  </button>
               </div>

               <div className="p-8">
                  {activeHomeTab === 'contributions' ? (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-black text-slate-800 italic">Atividade Recente</h4>
                          <Shield className="w-5 h-5 text-emerald-500" />
                       </div>
                       {(financialData as any[])?.length > 0 ? (
                         (financialData as any[]).slice(0, 10).map((t, idx) => {
                           const level = getContributionLevel(t.amount || 0);
                           return (
                             <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                                <div className="flex items-center space-x-4">
                                   <div className={`w-12 h-12 ${level.bg} rounded-2xl flex items-center justify-center text-xl`}>
                                      <level.icon className={`w-6 h-6 ${level.color}`} />
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-slate-800">
                                        {privacyMode === 'anonymous' ? 'Nova contribuição' : (t.userName || 'Membro')}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${level.color}`}>{level.label}</span>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <span className="text-[9px] font-medium text-slate-400 italic">{t.date?.toDate().toLocaleDateString()}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-xl">{level.symbol}</p>
                                </div>
                             </div>
                           )
                         })
                       ) : (
                         <div className="text-center py-10 opacity-30">
                           <Activity className="w-10 h-10 mx-auto mb-2" />
                           <p className="text-xs font-black uppercase tracking-widest">Aguardando contribuições</p>
                         </div>
                       )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-black text-slate-800 italic">Suas Ofertas</h4>
                          <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">Privado</div>
                       </div>
                       {myTransactions.length > 0 ? (
                         myTransactions.map((t, idx) => {
                           const level = getContributionLevel(t.amount || 0);
                           return (
                             <div key={idx} className="flex items-center justify-between p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50">
                                <div className="flex items-center space-x-4">
                                   <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm`}>
                                      <level.icon className="w-6 h-6 text-indigo-600" />
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-900 italic">R$ {t.amount.toLocaleString()}</p>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{t.type}</span>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <span className="text-[9px] font-medium text-slate-400 italic">{t.date?.toDate().toLocaleDateString()}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="text-right px-4 py-2 bg-white rounded-2xl border border-indigo-100 shadow-sm">
                                   <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{level.label}</span>
                                </div>
                             </div>
                           )
                         })
                       ) : (
                         <div className="text-center py-10 opacity-30">
                           <Heart className="w-10 h-10 mx-auto mb-2" />
                           <p className="text-xs font-black uppercase tracking-widest">Você ainda não ofertou este mês</p>
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </div>

            {/* Admin Overview (Conditional) */}
            {isAdmin && isAdminUnlocked && (
              <div className="mt-12 space-y-6">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-black italic">Gestão Admin de Fluxo</h3>
                    </div>
                    {privacyMode === 'anonymous' && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-100">Visão Admin (Sigilo Ativo)</span>
                    )}
                 </div>
                 <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    {(financialData as any[]).length > 0 ? (
                      (financialData as any[]).map((t, idx) => (
                        <div key={idx} className="p-6 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-all">
                           <div className="flex items-center space-x-4">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.userId}`} className="w-10 h-10 rounded-xl bg-slate-100" alt="avatar" />
                              <div>
                                 <p className="text-sm font-bold text-slate-900">{t.userName || 'Anônimo'}</p>
                                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.type} • {t.date?.toDate().toLocaleDateString()}</p>
                              </div>
                           </div>
                           <p className="text-sm font-black text-slate-900">R$ {t.amount.toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center opacity-30">
                        <p className="text-xs font-black uppercase tracking-widest">Nenhuma transação registrada</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

          </motion.div>
        );

      case 'spiritual':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="pb-24 max-w-2xl mx-auto"
          >
            <SectionHeader title="Crescimento" />
            <div className="px-4 space-y-6">
              <div className="bg-white p-8 rounded-[40px] shadow-card border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-light rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="flex items-center space-x-5 mb-8 relative z-10">
                  <div className="w-20 h-20 rounded-[28px] overflow-hidden shadow-xl border-4 border-slate-50 ring-1 ring-slate-100">
                    <img src={user?.photoURL || "https://picsum.photos/seed/church/200"} alt="Me" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{user?.displayName || 'Minha Jornada'}</h3>
                    <span className="text-[10px] bg-primary-light text-primary px-3 py-1 rounded-full font-black uppercase tracking-widest mt-1 inline-block">Membro Ativo</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {[
                    { label: 'Novo na Igreja' },
                    { label: 'Batismo' },
                    { label: 'Trilha do Discipulado' },
                    { label: 'Liderança' }
                  ].map((s, idx) => {
                    const isDone = completedSteps.includes(s.label);
                    return (
                      <button 
                        key={idx} 
                        onClick={() => toggleStep(s.label)}
                        className={`flex items-center space-x-3 p-3 rounded-[20px] border transition-all ${isDone ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${isDone ? 'bg-primary text-white' : 'bg-white border-2 border-slate-200'}`}>
                          {isDone && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-tight ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setActiveView('devotionals')}
                  className="p-8 bg-white rounded-[40px] border border-slate-100 text-left hover:shadow-card hover:-translate-y-1 transition-all group"
                >
                  <div className="w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                    <BookOpen className="w-7 h-7 text-primary group-hover:text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 leading-tight">Materiais de Estudo</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-black mt-2 tracking-[0.15em]">Biblioteca</p>
                </button>
                <button 
                  onClick={() => setActiveView('prayers')}
                  className="p-8 bg-white rounded-[40px] border border-slate-100 text-left hover:shadow-card hover:-translate-y-1 transition-all group"
                >
                  <div className="w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                    <MessageCircle className="w-7 h-7 text-primary group-hover:text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 leading-tight">Mural de Oração</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-black mt-2 tracking-[0.15em]">Intercessão</p>
                </button>
              </div>

              <div className="p-8 bg-card border border-primary/10 rounded-[48px] text-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-y-1/2 translate-x-1/2 blur-[80px]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <h3 className="text-2xl font-black italic tracking-tighter">Dash Liderança</h3>
                  <div className="bg-primary/10 p-3 rounded-2xl px-4 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 relative z-10 mb-8">
                  <div className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 text-center">
                    <p className="text-3xl font-black text-primary">156</p>
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mt-1">Membros</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 text-center">
                    <p className="text-3xl font-black text-secondary">12</p>
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mt-1">Visitantes</p>
                  </div>
                <div className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 text-center">
                    <p className="text-3xl font-black text-slate-700">92%</p>
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mt-1">Presença</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveView('admin')}
                  className="w-full py-5 rounded-[24px] bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Painel Administrativo
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'agenda':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-32 max-w-2xl mx-auto px-6 pt-12">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic leading-none">Nossa Agenda</h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">Comunhão e Crescimento</p>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => { setActiveView('admin'); setAdminActiveTab('agenda'); setShowAgendaForm(true); }}
                  className="w-14 h-14 bg-indigo-600 text-white rounded-[22px] flex items-center justify-center shadow-xl shadow-indigo-200 hover:scale-105 transition-all"
                >
                  <Plus className="w-7 h-7" />
                </button>
              )}
            </div>
            
            <div className="flex flex-nowrap overflow-x-auto pb-6 scrollbar-hide mb-10 -mx-6 px-6">
              {[...Array(7)].map((_, i) => {
                const day = new Date();
                day.setDate(day.getDate() + i);
                const isToday = i === 0;
                return (
                  <div key={i} className={`inline-flex flex-col items-center justify-center min-w-[72px] h-[100px] rounded-[32px] mr-4 transition-all duration-500 shadow-sm ${isToday ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-110' : 'bg-white/40 backdrop-blur-md border border-white/40 text-slate-400'}`}>
                    <span className={`text-[10px] uppercase font-black mb-2 tracking-widest ${isToday ? 'text-white/60' : 'text-slate-300'}`}>{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.getDay()]}</span>
                    <span className="text-2xl font-black">{day.getDate()}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="space-y-10 relative">
              <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-slate-200/50" />
              
              {agendaItems && (agendaItems as any[]).length > 0 ? (
                (agendaItems as any[]).map((e, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative pl-24 group"
                  >
                    <div className={`absolute left-[31px] top-6 w-5 h-5 rounded-full border-4 border-background shadow-xl z-10 transition-all group-hover:scale-125 ${e.isFeatured ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                    
                    <div 
                      onClick={() => setSelectedAgendaItem(e)}
                      className={`p-10 rounded-[48px] transition-all hover:shadow-2xl relative cursor-pointer group/card border backdrop-blur-xl ${e.isFeatured ? 'bg-white/80 border-indigo-200 shadow-2xl shadow-indigo-100/50' : 'bg-white/40 border-white/40'}`}
                    >
                      {isAdmin && (
                        <div className="absolute top-8 right-8 flex items-center space-x-2">
                          <button onClick={(ev) => { ev.stopPropagation(); setEditingAgendaItem(e); }} className="p-3 bg-white/60 rounded-2xl hover:bg-indigo-50 transition-all shadow-sm">
                            <Pencil className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                          </button>
                          <button onClick={(ev) => { ev.stopPropagation(); handleDeleteItem('agenda', e.id); }} className="p-3 bg-white/60 rounded-2xl hover:bg-red-50 transition-all shadow-sm">
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3 mb-6">
                         <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${e.type === 'Educação' ? 'text-indigo-600 bg-indigo-50/50' : 'text-primary bg-primary-light/50'}`}>
                           {e.type || 'Evento'}
                         </span>
                         <div className="h-px flex-1 bg-slate-100" />
                         <span className="text-[10px] font-black text-slate-400 tracking-widest">{e.time}</span>
                      </div>
                      
                      <h4 className="text-2xl font-black text-slate-800 leading-tight mb-4 italic tracking-tight">{e.title}</h4>
                      
                      <div className="flex items-center text-xs font-bold text-slate-400">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{e.location || e.description}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-32 text-center bg-white/20 backdrop-blur-sm rounded-[48px] border border-dashed border-white/40 mx-4">
                  <Calendar className="w-16 h-16 mx-auto mb-6 text-slate-200" />
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-300 italic">Agenda em Atualização</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'prayers':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Mural de Orações</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Interceda por seus irmãos</p>
              </div>
              <button 
                onClick={() => setShowPrayerForm(!showPrayerForm)}
                className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                <Plus className={`w-6 h-6 transition-transform ${showPrayerForm ? 'rotate-45' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {showPrayerForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-8 overflow-hidden">
                  {!user ? (
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-card text-center space-y-4">
                      <LogIn className="w-10 h-10 text-primary mx-auto opacity-20" />
                      <p className="text-sm font-bold text-slate-600">Você precisa estar logado para publicar</p>
                      <button 
                        onClick={handleGoogleLogin}
                        className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                      >
                        Fazer Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreatePrayer} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-card space-y-6">
                      <textarea 
                        required
                        placeholder="Qual o seu pedido de oração?"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 min-h-[120px]"
                        value={newPrayer.content}
                        onChange={e => setNewPrayer({ ...newPrayer, content: e.target.value })}
                      />
                      
                      <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <input 
                          type="checkbox"
                          id="isAnonymous"
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={newPrayer.isAnonymous}
                          onChange={e => setNewPrayer({ ...newPrayer, isAnonymous: e.target.checked })}
                        />
                        <label htmlFor="isAnonymous" className="text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer">
                          Ocultar minha identidade (Anônimo)
                        </label>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmittingPrayer}
                        className={`w-full py-4 ${isSubmittingPrayer ? 'bg-slate-200' : 'bg-primary shadow-lg shadow-primary/20'} text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center space-x-2`}
                      >
                        {isSubmittingPrayer ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Publicando...</span>
                          </>
                        ) : (
                          <span>Publicar Pedido</span>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              {prayers && (prayers as any[]).map((prayer: any) => (
                <motion.div key={prayer.id} layout className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm group relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${prayer.isAnonymous ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'} rounded-xl flex items-center justify-center font-black text-xs`}>
                        {prayer.isAnonymous ? <UserX className="w-5 h-5" /> : (prayer.authorName?.charAt(0) || 'I')}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                          {prayer.isAnonymous ? 'Irmão Anônimo' : prayer.authorName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold">{prayer.createdAt?.toDate().toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    {(isAdmin || prayer.authorId === user?.uid) && (
                      <button 
                        onClick={() => handleDeleteItem('prayers', prayer.id)}
                        className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed mb-8">{prayer.content}</p>
                  
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <AnimatePresence mode="wait">
                        <motion.div 
                          key={prayer.prayerCount || 0}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center space-x-2"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userPrayedFor.includes(prayer.id) ? 'bg-primary/20 text-primary' : 'bg-slate-50 text-slate-400'}`}>
                            <Heart className={`w-4 h-4 ${userPrayedFor.includes(prayer.id) ? 'fill-primary' : ''}`} />
                          </div>
                          <span className="text-xs font-black text-slate-600">
                             <span className="font-black text-primary text-sm">{prayer.prayerCount || 0}</span> pessoas estão orando
                          </span>
                        </motion.div>
                       </AnimatePresence>
                    </div>

                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      disabled={userPrayedFor.includes(prayer.id)}
                      onClick={() => handleAddPrayerCount(prayer.id, prayer.prayerCount || 0)}
                      className={`w-full py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${
                        userPrayedFor.includes(prayer.id) 
                        ? 'bg-green-50 text-green-600 border border-green-100' 
                        : 'bg-primary text-white shadow-xl shadow-primary/20'
                      }`}
                    >
                       <Heart className={`w-4 h-4 ${userPrayedFor.includes(prayer.id) ? 'fill-green-600' : 'fill-white'}`} />
                       <span>{userPrayedFor.includes(prayer.id) ? 'Você está orando por isso' : 'Vou orar por este pedido'}</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'admin':
        if (isAdmin === null) {
          return (
            <div className="min-h-[60vh] flex items-center justify-center font-black text-slate-400">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] uppercase tracking-[0.2em] animate-pulse">Verificando Credenciais...</p>
              </div>
            </div>
          );
        }

        if (isAdmin === false) {
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
              <div className="bg-white p-12 rounded-[56px] shadow-2xl border border-red-100 w-full max-w-md">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl relative">
                  <Shield className="w-10 h-10 text-red-500/20 absolute" />
                  <X className="w-8 h-8 text-red-500 relative z-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 italic">Acesso Negado</h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                  Sua conta (<span className="text-primary font-bold">{user?.email}</span>) não possui privilégios administrativos. 
                  <br /><br />
                  Se você é um líder, solicite a inclusão do seu e-mail ao administrador principal.
                </p>
                <button 
                  onClick={() => setActiveView('home')}
                  className="w-full py-5 bg-primary text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  Voltar ao Início
                </button>
              </div>
            </motion.div>
          );
        }

        if (!isAdminUnlocked) {
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[60vh] flex flex-col items-center justify-center px-4">
              <div className="bg-white p-12 rounded-[56px] shadow-2xl border border-slate-100 w-full max-w-md text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                  {isAdminSetupMode ? <UserPlus className="w-10 h-10 text-primary" /> : <Shield className="w-10 h-10 text-primary" />}
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 italic">
                  {isAdminSetupMode ? 'Cadastrar Senha' : 'Acesso Restrito'}
                </h2>
                <p className="text-xs text-slate-400 font-medium mb-10 tracking-tight">
                  {isAdminSetupMode 
                    ? 'Defina uma nova senha para o acesso de liderança.' 
                    : 'Digite a senha de administrador para gerenciar a igreja.'}
                </p>
                
                <form onSubmit={isAdminSetupMode ? handleInitialPasswordSetup : handleAdminLogin} className="space-y-6">
                  <div className="relative group">
                    <input 
                      autoFocus
                      type={showAdminPassword ? "text" : "password"}
                      placeholder={isAdminSetupMode ? "Nova Senha Administrativa" : "Senha Administrativa"}
                      className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pr-14 pl-8 text-center text-lg font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                      value={adminPasswordInput}
                      onChange={e => setAdminPasswordInput(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                    >
                      {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-5 bg-primary text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all hover:bg-slate-800"
                  >
                    {isAdminSetupMode ? 'Cadastrar e Entrar' : 'Entrar no Painel'}
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-50">
                  <button 
                    onClick={() => {
                      setIsAdminSetupMode(!isAdminSetupMode);
                      setAdminPasswordInput('');
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-75 transition-all"
                  >
                    {isAdminSetupMode ? 'Voltar para o Login' : 'Primeiro Acesso? Cadastrar Senha'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Painel de Liderança</h1>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsAdminUnlocked(false)}
                  className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2"
                  title="Bloquear Painel"
                >
                  <Shield className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleDownloadMembersReport}
                  className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-600 hover:text-primary transition-all flex items-center space-x-2"
                  title="Baixar Relatório de Membros"
                >
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] font-black pointer-events-none">CSV</span>
                </button>
                <button 
                  onClick={handleDownloadFinancialReport}
                  className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-600 hover:text-emerald-500 transition-all flex items-center space-x-2"
                  title="Baixar Relatório Financeiro"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-[10px] font-black pointer-events-none">CSV</span>
                </button>
                <button 
                  onClick={handleResetApp}
                  disabled={isResetting}
                  className="p-3 bg-red-50 border border-red-100 rounded-2xl shadow-sm text-red-600 hover:bg-red-500 hover:text-white transition-all flex items-center space-x-2"
                  title="Reset de Dados - CUIDADO"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-hide no-wrap">
              {[
                { id: 'overview', label: 'Resumo', icon: TrendingUp },
                { id: 'members', label: 'Membros', icon: Users },
                { id: 'bulletins', label: 'Boletins', icon: FileText },
                { id: 'agenda', label: 'Agenda', icon: Calendar },
                { id: 'announcements', label: 'Mural', icon: Bell },
                { id: 'scales', label: 'Escalas', icon: Zap },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdminActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-2xl flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    adminActiveTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {adminActiveTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
               <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Membros</p>
                 <h4 className="text-2xl font-black text-slate-900">{members.length}</h4>
               </div>
               <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Eventos Ativos</p>
                 <h4 className="text-2xl font-black text-slate-900">{(agendaItems as any[])?.length || 0}</h4>
               </div>
               <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Dízimos (Mês)</p>
                 <h4 className="text-2xl font-black text-slate-900">R$ {(financialData as any[])?.filter(t => t.type === 'Dízimo').reduce((acc, t) => acc + t.amount, 0).toLocaleString() || 0}</h4>
               </div>
               <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mural</p>
                 <h4 className="text-2xl font-black text-slate-900">{(announcements as any[])?.length || 0}</h4>
               </div>
               <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm col-span-2 lg:col-span-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cursos</p>
                 <h4 className="text-2xl font-black text-slate-900">{courses.length}</h4>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <button 
                onClick={() => setShowAgendaForm(!showAgendaForm)}
                className="p-8 bg-white border border-slate-100 rounded-[40px] text-left hover:shadow-card transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary transition-all">
                  <Calendar className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 leading-tight">Novo Evento</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Agenda</p>
              </button>
              
              <button 
                onClick={() => {
                  setAdminActiveTab('members');
                  setShowMemberForm(true);
                }}
                className="p-8 bg-white border border-slate-100 rounded-[40px] text-left hover:shadow-card transition-all group"
              >
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary transition-all">
                  <UserPlus className="w-6 h-6 text-orange-500 group-hover:text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 leading-tight">Novo Membro</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cadastro</p>
              </button>

              <button 
                onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                className="p-8 bg-white border border-slate-100 rounded-[40px] text-left hover:shadow-card transition-all group"
              >
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary transition-all">
                  <Bell className="w-6 h-6 text-green-500 group-hover:text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 leading-tight">Novo Aviso</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Mural</p>
              </button>

              <button 
                onClick={() => setShowCourseForm(!showCourseForm)}
                className="p-8 bg-white border border-slate-100 rounded-[40px] text-left hover:shadow-card transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary transition-all">
                  <BookOpen className="w-6 h-6 text-blue-500 group-hover:text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 leading-tight">Novo Curso</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cursos & Trilhas</p>
              </button>

              <button 
                onClick={() => setShowBulletinForm(!showBulletinForm)}
                className="p-8 bg-primary border border-primary rounded-[40px] text-left hover:shadow-2xl hover:shadow-primary/20 transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-16 h-16 text-white" />
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white transition-all">
                  <FileText className={`w-6 h-6 text-white`} />
                </div>
                <h4 className="text-xl font-bold text-white leading-tight">Boletim Digital</h4>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">Gerador via IA</p>
              </button>
            </div>

            <AnimatePresence>
              {showBulletinForm && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-12">
                   <form onSubmit={handleGenerateBulletin} className="bg-card p-8 rounded-[40px] border border-slate-100 shadow-2xl space-y-4 text-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-black italic tracking-tighter">Gerador de Boletim IA</h3>
                          <p className="text-xs text-slate-400 mt-1 font-bold">Preencha os dados do culto para gerar o boletim</p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tema do Culto</label>
                          <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.tema} onChange={e => setBulletinInputs({...bulletinInputs, tema: e.target.value})} placeholder="Ex: O Poder da Oração" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pregador</label>
                          <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.pregador} onChange={e => setBulletinInputs({...bulletinInputs, pregador: e.target.value})} placeholder="Ex: Pr. Gilmar Brito" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Texto Bíblico Base</label>
                          <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.texto_biblico} onChange={e => setBulletinInputs({...bulletinInputs, texto_biblico: e.target.value})} placeholder="Ex: Filipenses 4:6-7" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data</label>
                          <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.data} onChange={e => setBulletinInputs({...bulletinInputs, data: e.target.value})} />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Resumo ou Transcrição da Pregação</label>
                        <textarea required className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-bold min-h-[150px] focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.pregacao_texto} onChange={e => setBulletinInputs({...bulletinInputs, pregacao_texto: e.target.value})} placeholder="Cole aqui as notas ou a transcrição da mensagem..." />
                      </div>

                      <button 
                        type="submit"
                        disabled={isGeneratingBulletin}
                        className="w-full py-5 bg-primary text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center space-x-3"
                      >
                         {isGeneratingBulletin ? (
                           <>
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             <span>Processando pela IA...</span>
                           </>
                         ) : (
                           <>
                             <Zap className="w-5 h-5" />
                             <span>Gerar Boletim Digital</span>
                           </>
                         )}
                      </button>
                   </form>
                </motion.div>
              )}
              {showAnnouncementForm && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-12">
                  <form onSubmit={handleCreateAnnouncement} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-4">
                    <h3 className="text-xl font-bold">Publicar Aviso</h3>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título</label>
                      <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tags (Eventos, Mudança, etc)</label>
                      <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newAnnouncement.tag} onChange={e => setNewAnnouncement({...newAnnouncement, tag: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Conteúdo do Aviso</label>
                      <textarea required className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold min-h-[100px]" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center space-x-3">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${newAnnouncement.isPinned ? 'bg-amber-500' : 'bg-slate-200'}`}>
                            <Pin className={`w-4 h-4 ${newAnnouncement.isPinned ? 'text-white' : 'text-slate-500'}`} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Destacar Aviso</p>
                            <p className="text-[9px] text-slate-400 font-bold">Fixar no topo e adicionar indicador visual</p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setNewAnnouncement({...newAnnouncement, isPinned: !newAnnouncement.isPinned})}
                        className={`w-12 h-6 rounded-full relative transition-colors ${newAnnouncement.isPinned ? 'bg-primary' : 'bg-slate-300'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newAnnouncement.isPinned ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    <button type="submit" className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">Publicar Agora</button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showAgendaForm && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-12">
                  <form onSubmit={handleCreateAgendaItem} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-4">
                    <h3 className="text-xl font-bold">Novo Evento</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Evento</label>
                        <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newAgendaItem.title} onChange={e => setNewAgendaItem({...newAgendaItem, title: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data</label>
                        <input required type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newAgendaItem.date} onChange={e => setNewAgendaItem({...newAgendaItem, date: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hora</label>
                        <input required type="time" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newAgendaItem.time} onChange={e => setNewAgendaItem({...newAgendaItem, time: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição/Local</label>
                        <textarea className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold min-h-[80px]" value={newAgendaItem.description} onChange={e => setNewAgendaItem({...newAgendaItem, description: e.target.value})} />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 mt-4">Publicar na Agenda</button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showCourseForm && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-12">
                  <form onSubmit={handleCreateCourse} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-4">
                    <h3 className="text-xl font-bold">Novo Curso / Trilha</h3>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título do Curso</label>
                      <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duração (Ex: 8 Aulas)</label>
                        <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold shadow-none outline-none focus:ring-0" value={newCourse.status} onChange={e => setNewCourse({...newCourse, status: e.target.value})}>
                          <option>Inscrições Abertas</option>
                          <option>Em breve</option>
                          <option>Encerrado</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Resumo / Info</label>
                      <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newCourse.info} onChange={e => setNewCourse({...newCourse, info: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição Detalhada</label>
                      <textarea className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold min-h-[100px]" value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">Criar Curso Agora</button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <SectionHeader title="Boletins Digitais" />
            <div className="bg-white rounded-[40px] border border-slate-100 divide-y divide-slate-50 overflow-hidden mb-12 shadow-sm">
              {bulletins.length > 0 ? (
                bulletins.map((b: any) => (
                  <div key={b.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group">
                    <div className="flex items-center space-x-4 cursor-pointer flex-1" onClick={() => setSelectedBulletin(b)}>
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-black text-slate-900 truncate italic">{b.theme}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.preacher} • {b.date}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteItem('bulletins', b.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="p-12 text-center text-xs font-bold text-slate-300 uppercase tracking-widest italic opacity-40">Nenhum boletim gerado ainda</p>
              )}
            </div>

            <SectionHeader title="Configurações da Igreja" />
            <div className="space-y-6 mb-12">
              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-slate-900/5 rounded-full blur-3xl opacity-50" />
                <form onSubmit={handleUpdateAdminPassword} className="space-y-6 relative z-10">
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Segurança do Painel</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha de Acesso à Liderança</label>
                      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <div className="relative flex-1 group">
                          <input 
                            required
                            type={showAdminPassword ? "text" : "password"} 
                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pr-14 pl-8 text-base font-bold focus:ring-2 focus:ring-slate-900/10 outline-none transition-all shadow-inner"
                            value={adminSecretState}
                            onChange={e => setAdminSecretState(e.target.value)}
                            placeholder="Digite a nova senha"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                          >
                            {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <button 
                          type="submit"
                          className="group px-10 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-primary py-5 md:py-0 flex items-center justify-center space-x-3"
                        >
                          <Pencil className="w-4 h-4 text-primary group-hover:text-white" />
                          <span>Salvar Nova Senha</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium px-4">
                        Esta senha é necessária para desbloquear o Painel de Liderança e ver relatórios sensíveis.
                      </p>
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                <form onSubmit={handleUpdatePixKey} className="space-y-6 relative z-10">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Dados de Pagamento (Pix)</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">CNPJ ou Chave Oficial para Recebimento</label>
                      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <input 
                          required
                          type="text" 
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl py-5 px-8 text-base font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-inner"
                          value={pixKey}
                          onChange={e => setPixKey(e.target.value)}
                          placeholder="Ex: 00.000.000/0001-00"
                        />
                        <button 
                          type="submit"
                          className="group px-10 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-primary py-5 md:py-0 flex items-center justify-center space-x-3"
                        >
                          <Zap className="w-4 h-4 text-primary group-hover:text-white" />
                          <span>Salvar Chave Pix</span>
                        </button>
                      </div>
                      <div className="flex items-start space-x-3 p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
                        <HelpCircle className="w-5 h-5 text-indigo-500 mt-0.5" />
                        <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                          A chave configurada aqui será exibida no QR Code e no "Copia e Cola" da tela principal para todos os membros que desejarem ofertar.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-50" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Privacidade de Ofertas</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Gestão de Dados Financeiros</p>
                      </div>
                    </div>
                    <div 
                      onClick={handleTogglePrivacyMode}
                      className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${privacyMode === 'anonymous' ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${privacyMode === 'anonymous' ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-6 rounded-3xl border transition-all ${privacyMode === 'leadership' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                      <Eye className="w-6 h-6 text-indigo-600 mb-3" />
                      <h4 className="text-sm font-bold text-slate-900">Modo Liderança</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">Administradores podem visualizar valores individuais para gestão direta.</p>
                    </div>
                    <div className={`p-6 rounded-3xl border transition-all ${privacyMode === 'anonymous' ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                      <EyeOff className="w-6 h-6 text-emerald-600 mb-3" />
                      <h4 className="text-sm font-bold text-slate-900">Anônimo Total</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">Ninguém (incluindo admin) vê valores nominais. Apenas estatísticas simbólicas.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-100/50 rounded-full blur-3xl opacity-50" />
                <form onSubmit={handleUpdateVerse} className="space-y-6 relative z-10">
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-violet-600" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Versículo da Tela de Início</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Mensagem do Banner</label>
                        <textarea 
                          required
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 px-8 text-base font-bold focus:ring-2 focus:ring-violet-500/10 outline-none transition-all shadow-inner resize-none"
                          value={verseTitle}
                          onChange={e => setVerseTitle(e.target.value)}
                          placeholder="Ex: Deixai vir a mim os pequeninos..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Referência Bíblica</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 px-8 text-base font-bold focus:ring-2 focus:ring-violet-500/10 outline-none transition-all shadow-inner"
                            value={verseRef}
                            onChange={e => setVerseRef(e.target.value)}
                            placeholder="Ex: Mateus 19:14"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="group h-[66px] bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-violet-600 flex items-center justify-center space-x-3"
                        >
                          <Pencil className="w-4 h-4 text-violet-400 group-hover:text-white" />
                          <span>Atualizar Versículo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

             <SectionHeader title="Gestão de Escalas" />
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-md mb-12">
              <form onSubmit={handleCreateScale} className="space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ministério</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary/10 outline-none"
                      value={newScale.ministry}
                      onChange={e => setNewScale({...newScale, ministry: e.target.value})}
                    >
                      <option>Louvor</option>
                      <option>Mídia</option>
                      <option>Recepção</option>
                      <option>Crianças</option>
                      <option>Apoio</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Função</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Ex: Guitarra, Som, Professor" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary/10 outline-none" 
                      value={newScale.role}
                      onChange={e => setNewScale({...newScale, role: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data e Hora</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Ex: Domingo, 19:00" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary/10 outline-none" 
                      value={newScale.date}
                      onChange={e => setNewScale({...newScale, date: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:bg-slate-800 transition-all mt-2">Gerar Nova Escala</button>
              </form>
            </div>

            <SectionHeader title="Cursos Ativos" />
            <div className="px-4 space-y-4 mb-12">
              {courses.length > 0 ? (
                courses.map((course: any) => (
                  <div key={course.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-card transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">{course.title}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{course.status} • {course.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                       <button 
                         onClick={() => setEditingCourse(course)}
                         className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all"
                       >
                         <Pencil className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDeleteItem('courses', course.id)}
                         className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-50">
                  <BookOpen className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhum curso cadastrado</p>
                </div>
              )}
            </div>

            <SectionHeader title="Alvo Missionário" />
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 mb-12">
               <div className="flex items-center justify-between mb-4">
                 <p className="text-[10px] font-black uppercase text-slate-400">Total Arrecadado (R$)</p>
                 <span className="text-primary font-black">R$ {currentCampaign.departments[0]?.collected.toLocaleString()}</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max={currentCampaign.totalGoal} 
                 step="100"
                 className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                 value={currentCampaign.departments[0]?.collected}
                 onChange={(e) => handleUpdateMission(parseInt(e.target.value))}
               />
               <p className="text-[9px] text-slate-300 mt-2 text-center uppercase tracking-widest">Deslize para atualizar o progresso da campanha</p>
            </div>

              </>
            )}

            {adminActiveTab === 'members' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold italic tracking-tight">Gestão de Membros</h3>
                  <button 
                    onClick={() => setShowMemberForm(!showMemberForm)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-primary transition-all flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{showMemberForm ? 'Fechar Form' : 'Cadastrar Novo'}</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showMemberForm && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                       <form onSubmit={handleCreateMember} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold">Novo Membro</h4>
                          <button type="button" onClick={() => setShowMemberForm(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                            <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Função / Cargo</label>
                            <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-xs">Ministério</label>
                            <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none" value={newMember.ministry} onChange={e => setNewMember({...newMember, ministry: e.target.value})}>
                               <option value="">Selecione...</option>
                               {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                          </div>
                          <div className="col-span-2 mt-4 pt-4 border-t border-slate-50 flex items-center space-x-2">
                            <div className="w-1 h-3 bg-primary rounded-full"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Informações de Contato</span>
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-xs">Telefone</label>
                            <input type="text" placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
                          </div>
                          <div className="col-span-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-xs">E-mail</label>
                             <input type="email" placeholder="email@exemplo.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
                          </div>
                        </div>
                        <button type="submit" className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg">Finalizar Cadastro</button>
                       </form>
                     </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou ministério..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.ministry.toLowerCase().includes(memberSearch.toLowerCase())).map(member => (
                    <div key={member.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group transition-all hover:border-primary/20 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={member.avatar || `https://picsum.photos/seed/${member.name}/100`} alt={member.name} referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">{member.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.role} • {member.ministry}</p>
                          {(member.phone || member.email) && (
                            <p className="text-[9px] text-slate-300 mt-1 flex items-center space-x-2">
                              {member.phone && <span>{member.phone}</span>}
                              {member.phone && member.email && <span>•</span>}
                              {member.email && <span className="truncate max-w-[120px]">{member.email}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setEditingMember(member)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('members', member.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminActiveTab === 'bulletins' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold italic tracking-tight">Boletins Digitais IA</h3>
                  <button 
                    onClick={() => setShowBulletinForm(true)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-primary transition-all flex items-center space-x-2"
                  >
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>Gerar via IA</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {bulletins.map((b: any) => (
                    <div key={b.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm group">
                      <div className="flex items-center space-x-4 cursor-pointer flex-1" onClick={() => setSelectedBulletin(b)}>
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-all group-hover:text-white">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 italic">{b.theme}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.date} • {b.preacher}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteItem('bulletins', b.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {bulletins.length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-100">
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Nenhum boletim histórico</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminActiveTab === 'agenda' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold italic tracking-tight">Agenda da Igreja</h3>
                  <button 
                    onClick={() => setShowAgendaForm(true)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-primary transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Evento</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(agendaItems as any[])?.map((event: any) => (
                    <div key={event.id} className="p-6 bg-white rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-black text-xs uppercase">
                          {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">{event.title}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{event.time} • {event.description || 'Sede Local'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setEditingAgendaItem(event)} className="p-2 text-slate-400 hover:text-primary transition-all"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteItem('agenda', event.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

        {adminActiveTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold italic tracking-tight">Mural de Avisos</h3>
              <button 
                onClick={() => setShowAnnouncementForm(true)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-primary transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Aviso</span>
              </button>
            </div>

            <AnimatePresence>
              {showAnnouncementForm && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                   <form onSubmit={handleCreateAnnouncement} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold">Novo Aviso no Mural</h4>
                      <button type="button" onClick={() => setShowAnnouncementForm(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título do Aviso</label>
                      <input required type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Conteúdo</label>
                      <textarea required className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold min-h-[100px]" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria (Tag)</label>
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none" value={newAnnouncement.tag} onChange={e => setNewAnnouncement({...newAnnouncement, tag: e.target.value})}>
                           <option value="Aviso">Aviso</option>
                           <option value="Evento">Evento</option>
                           <option value="Oração">Oração</option>
                           <option value="Urgente">Urgente</option>
                         </select>
                       </div>
                       <div className="flex items-center space-x-2 pt-6">
                          <input type="checkbox" id="pinned" className="w-4 h-4 text-primary" checked={newAnnouncement.isPinned} onChange={e => setNewAnnouncement({...newAnnouncement, isPinned: e.target.checked})} />
                          <label htmlFor="pinned" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fixar no topo</label>
                       </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg">Publicar Aviso</button>
                   </form>
                 </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {(announcements as any[])?.map((ann: any) => (
                <div key={ann.id} className="p-6 bg-white rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm group">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary px-2 py-0.5 rounded-full">{ann.tag}</span>
                      {ann.isPinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    </div>
                    <h4 className="text-sm font-black text-slate-800 italic">{ann.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{ann.content}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setEditingAnnouncement(ann)} className="p-2 text-slate-400 hover:text-primary transition-all"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteItem('announcements', ann.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminActiveTab === 'scales' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold italic tracking-tight text-slate-900">Escalas & Voluntariado</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Equipes e Serviços</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleAutoGenerateScale}
                  className="px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="hidden md:inline">Auto-Gerar</span>
                </button>
                <button 
                  onClick={() => setShowScaleForm(!showScaleForm)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-primary transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Novo Recrutamento</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showScaleForm && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                   <form onSubmit={handleCreateScale} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold">Escalar Voluntário</h4>
                        <p className="text-xs text-slate-400">Atribua um membro a uma função específica</p>
                      </div>
                      <button type="button" onClick={() => setShowScaleForm(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ministério</label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none" 
                          value={newScale.ministry} 
                          onChange={e => setNewScale({...newScale, ministry: e.target.value, memberId: '', memberName: ''})}
                        >
                           {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                         </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Função / Instrumento</label>
                        <input required type="text" placeholder="Ex: Guitarra, Recepcionista..." className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newScale.role} onChange={e => setNewScale({...newScale, role: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data do Serviço</label>
                        <input required type="text" placeholder="Ex: 12/05 - Manhã" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={newScale.date} onChange={e => setNewScale({...newScale, date: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Voluntário</label>
                        <select 
                          required
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none" 
                          value={newScale.memberId} 
                          onChange={e => {
                            const m = members.find(mem => mem.id === e.target.value);
                            if (m) setNewScale({...newScale, memberId: m.id, memberName: m.name, memberAvatar: m.avatar});
                          }}
                        >
                           <option value="">Selecione um membro...</option>
                           {members.sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                             <option key={m.id} value={m.id}>
                               {m.name} {m.ministry ? `(${m.ministry})` : ''}
                             </option>
                           ))}
                         </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg">Finalizar Escala</button>
                   </form>
                 </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {allScales.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(scale => (
                <div key={scale.id} className={`p-5 bg-white rounded-3xl border ${scale.status === 'needs_replacement' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'} flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-slate-100 bg-slate-50 flex-shrink-0">
                       <img src={scale.memberAvatar || `https://picsum.photos/seed/${scale.memberId}/100`} alt={scale.memberName} referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-black text-slate-800">{scale.memberName}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          scale.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                          scale.status === 'declined' ? 'bg-red-50 text-red-600' :
                          scale.status === 'needs_replacement' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {scale.status === 'confirmed' ? 'Confirmado' :
                           scale.status === 'declined' ? 'Recusado' :
                           scale.status === 'needs_replacement' ? 'Precisa Troca' : 'Pendente'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest line-clamp-1">{scale.ministry} • {scale.role}</p>
                      <p className="text-[10px] text-primary font-black mt-1">{scale.date}</p>
                      {scale.notes && <p className="text-[9px] text-amber-600 italic mt-1 bg-amber-50 px-2 py-1 rounded-lg">Obs: {scale.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {scale.status === 'needs_replacement' && (
                      <div className="flex space-x-1">
                        <select 
                          className="text-[9px] font-black uppercase bg-amber-50 border border-amber-100 rounded-lg py-2 px-2 outline-none focus:ring-2 focus:ring-amber-200"
                          onChange={(e) => {
                            const m = members.find(mem => mem.id === e.target.value);
                            if (m) handleAssignReplacement(scale.id, m);
                          }}
                        >
                           <option value="">Trocar por...</option>
                           {members.filter(m => m.ministry === scale.ministry && m.id !== scale.memberId).map(m => (
                             <option key={m.id} value={m.id}>{m.name}</option>
                           ))}
                        </select>
                      </div>
                    )}
                    <button onClick={() => setEditingScale(scale)} className="p-2 text-slate-300 hover:text-primary transition-all"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteItem('scales', scale.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {allScales.length === 0 && (
                <div className="text-center py-16 opacity-30">
                   <Zap className="w-12 h-12 mx-auto mb-4" />
                   <p className="text-[11px] font-black uppercase tracking-[0.2em]">Nenhuma escala ativa</p>
                </div>
              )}
            </div>
          </div>
        )}

            <div className="mt-12 h-px bg-slate-100" />
            <SectionHeader title="Log de Atividades Recentes" />
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden divide-y divide-slate-50 shadow-sm">
              {activityLogs && activityLogs.length > 0 ? (
                activityLogs.map((log: any, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                    <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                         <Settings className="w-4 h-4 text-slate-400" />
                       </div>
                       <div>
                         <p className="text-[11px] font-bold text-slate-900">{log.action}</p>
                         <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{log.details}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-300 uppercase">{log.userName}</p>
                       <p className="text-[8px] text-slate-300 font-bold">{log.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-10 opacity-40">Módulo de monitoramento em tempo real ativo</p>
              )}
            </div>
          </motion.div>
        );
 
       case 'devotionals':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900 italic">Semeando Vídeos</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Devocionais dos Membros</p>
              </div>
              <button 
                onClick={() => setShowDevotionalForm(!showDevotionalForm)}
                className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className={`w-6 h-6 transition-transform ${showDevotionalForm ? 'rotate-45' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {showDevotionalForm && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-8 overflow-hidden"
                >
                  <form onSubmit={handleCreateDevotional} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-card space-y-4">
                    <h3 className="text-xl font-bold mb-4">Compartilhar Palavra</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título do Vídeo</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Ex: Reflexão sobre o Salmo 23" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                          value={newDevotional.title}
                          onChange={e => setNewDevotional({...newDevotional, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                          value={newDevotional.category}
                          onChange={e => setNewDevotional({...newDevotional, category: e.target.value})}
                        >
                          <option value="devocionais">Devocionais</option>
                          <option value="semeando">Semeando</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link do Vídeo (YouTube/Vimeo)</label>
                        <input 
                          required
                          type="url" 
                          placeholder="https://youtube.com/..." 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                          value={newDevotional.videoUrl}
                          onChange={e => setNewDevotional({...newDevotional, videoUrl: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Breve Descrição</label>
                        <textarea 
                          placeholder="O que aprendemos com este vídeo?" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 min-h-[100px]"
                          value={newDevotional.description}
                          onChange={e => setNewDevotional({...newDevotional, description: e.target.value})}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Publicar Devocional
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-8">
              {devotionals && (devotionals as any).length > 0 ? (
                (devotionals as any).map((dev: any) => (
                  <div key={dev.id} className="bg-white rounded-[48px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-card transition-all group">
                    <div className="aspect-video bg-slate-900 relative cursor-pointer" onClick={() => setActiveVideo(dev)}>
                       <img 
                         src={dev.thumbnailUrl || `https://img.youtube.com/vi/${dev.videoId}/maxresdefault.jpg`} 
                         alt={dev.title} 
                         className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" 
                         referrerPolicy="no-referrer"
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-primary fill-primary ml-1" />
                         </div>
                       </div>
                    </div>
                    <div className="p-8">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary font-black uppercase text-xs">
                              {dev.authorName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary">{dev.authorName}</p>
                              <p className="text-[10px] font-medium text-slate-400">{dev.createdAt?.toDate().toLocaleDateString()}</p>
                            </div>
                          </div>
                    {(isAdmin || dev.authorId === user.uid) && (
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => setEditingDevotional(dev)}
                          className="p-2 text-slate-200 hover:text-primary transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('devotionals', dev.id)}
                          className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                       </div>
                       <h3 className="text-2xl font-black text-slate-800 leading-tight mb-3 group-hover:text-primary transition-colors">{dev.title}</h3>
                       <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">{dev.description}</p>
                       
                       <div className="border-t border-slate-50 pt-6">
                         <CommentSection contentId={dev.id} user={user} isAdmin={isAdmin} userRole={userRole} />
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-30">
                   <Video className="w-16 h-16 mx-auto mb-4" />
                   <p className="text-sm font-bold uppercase tracking-widest">Nenhum devocional ainda</p>
                   <p className="text-xs font-medium mt-2">Seja o primeiro a compartilhar uma palavra!</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'chat':
         return (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto h-screen flex flex-col pt-12">
             <div className="px-6 pb-6 border-b border-slate-100 flex items-center justify-between">
               <div>
                 <h2 className="text-3xl font-black italic">Comunicação</h2>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                   {activeRoomId ? 'Canal Ativo' : 'Mensagens Internas'}
                 </p>
               </div>
               {activeRoomId && (
                 <button 
                   onClick={() => setActiveRoomId(null)}
                   className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-primary transition-all"
                 >
                   <ChevronRight className="w-5 h-5 rotate-180" />
                 </button>
               )}
             </div>
 
             <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
               {!activeRoomId ? (
                 <div className="space-y-4">
                   {rooms && (rooms as any).length > 0 ? (
                     (rooms as any).map((room: any) => {
                       const otherIndex = room.participants.indexOf(user.uid) === 0 ? 1 : 0;
                       const otherName = room.type === 'direct' ? room.participantNames[otherIndex] : room.name;
                       return (
                         <button 
                           key={room.id}
                           onClick={() => setActiveRoomId(room.id)}
                           className="w-full p-6 bg-white rounded-3xl border border-slate-100 flex items-center space-x-4 hover:shadow-card transition-all group text-left"
                         >
                           <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-all overflow-hidden">
                             {room.type === 'direct' ? (
                               <img src={room.participantAvatars[otherIndex]} alt={otherName} referrerPolicy="no-referrer" />
                             ) : room.name?.charAt(0)}
                           </div>
                           <div className="flex-1">
                             <h4 className="font-bold text-slate-800">{otherName}</h4>
                             <p className="text-sm text-slate-400 truncate opacity-60">{room.lastMessage || 'Toque para conversar'}</p>
                           </div>
                           <div className="text-right">
                              <div className="w-2 h-2 bg-primary rounded-full ml-auto shadow-lg shadow-primary/20" />
                           </div>
                         </button>
                       );
                     })
                   ) : (
                     <div className="text-center py-20 opacity-40">
                       <MessageCircle className="w-12 h-12 mx-auto mb-4" />
                       <p className="text-sm font-bold uppercase tracking-widest">Nenhuma conversa ativa</p>
                       <button 
                         onClick={() => setActiveView('members')}
                         className="mt-6 text-primary font-black text-[10px] uppercase tracking-widest"
                       >
                          Iniciar com Líder
                       </button>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="space-y-6">
                   {messages && (messages as any).map((msg: any) => (
                     <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] p-5 rounded-[28px] shadow-sm ${
                         msg.senderId === user.uid 
                           ? 'bg-primary text-white rounded-br-none' 
                           : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                       }`}>
                          {msg.senderId !== user.uid && (
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{msg.senderName}</p>
                          )}
                          <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                       </div>
                     </div>
                   ))}
                   {(!messages || messages.length === 0) && (
                     <div className="text-center py-20 opacity-40">
                       <p className="text-xs font-bold uppercase tracking-widest">Inicie a conversa com este líder</p>
                     </div>
                   )}
                 </div>
               )}
             </div>
 
             {activeRoomId && (
               <div className="p-6 bg-white border-t border-slate-100 sticky bottom-0">
                 <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                   <input 
                     type="text"
                     placeholder="Escreva algo especial..."
                     className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                     value={chatMessage}
                     onChange={e => setChatMessage(e.target.value)}
                   />
                   <button 
                     type="submit"
                     className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
                   >
                     <Plus className="w-6 h-6 rotate-45" />
                   </button>
                 </form>
               </div>
             )}
           </motion.div>
         );

      case 'members':
        const filteredMembers = members.filter(m => {
          const matchesSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
                                m.ministry.toLowerCase().includes(memberSearch.toLowerCase());
          const matchesStatus = memberFilter === 'Todos' || m.status === memberFilter;
          const matchesMinistry = ministryFilter === 'Todos' || m.ministry === ministryFilter;
          return matchesSearch && matchesStatus && matchesMinistry;
        });

        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="pb-24 max-w-2xl mx-auto px-4 pt-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button onClick={() => setActiveView('more')} className="p-2 bg-white border border-slate-100 rounded-xl">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h1 className="text-3xl font-black text-slate-900">Membros</h1>
              </div>
              <button 
                onClick={() => setShowMemberForm(true)}
                className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <UserPlus className="w-6 h-6" />
              </button>
            </div>

            <AnimatePresence>
              {showMemberForm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 overflow-hidden"
                >
                  <form onSubmit={handleCreateMember} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-card space-y-4">
                    <h3 className="text-xl font-bold mb-4">Novo Membro</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Ex: João Silva" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                          value={newMember.name}
                          onChange={e => setNewMember({...newMember, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cargo/Papel</label>
                          <input 
                            required
                            type="text" 
                            placeholder="Ex: Membro, Músico" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                            value={newMember.role}
                            onChange={e => setNewMember({...newMember, role: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ministério</label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                            value={newMember.ministry}
                            onChange={e => setNewMember({...newMember, ministry: e.target.value})}
                          >
                            <option value="">Selecione...</option>
                            {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2 py-4 border-y border-slate-50">
                           <div className="w-1 h-4 bg-primary rounded-full"></div>
                           <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Informações de Contato</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone</label>
                            <input 
                              type="text" 
                              placeholder="(00) 00000-0000" 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                              value={newMember.phone}
                              onChange={e => setNewMember({...newMember, phone: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                            <input 
                              type="email" 
                              placeholder="email@exemplo.com" 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                              value={newMember.email}
                              onChange={e => setNewMember({...newMember, email: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-end">
                         <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-xs">Status</label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                            value={newMember.status}
                            onChange={e => setNewMember({...newMember, status: e.target.value as any})}
                          >
                            <option value="Ativo">Ativo</option>
                            <option value="Visitante">Visitante</option>
                            <option value="Líder">Líder</option>
                          </select>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            type="button" 
                            onClick={() => setShowMemberForm(false)}
                            className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            className="flex-[2] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou ministério..." 
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 mb-4 overflow-x-auto scrollbar-hide py-1">
              {['Todos', 'Líder', 'Ativo', 'Visitante'].map((f) => (
                <button 
                  key={f}
                  onClick={() => setMemberFilter(f as any)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    memberFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white border border-slate-100 text-slate-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 mb-8 overflow-x-auto scrollbar-hide py-1">
              {['Todos', ...MINISTRIES].map((m) => (
                <button 
                  key={m}
                  onClick={() => setMinistryFilter(m)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    ministryFilter === m ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white border border-slate-100 text-slate-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div key={member.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group hover:shadow-card transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                        <img src={member.avatar} alt={member.name} referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{member.name}</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary">{member.ministry}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{member.role}</span>
                        </div>
                        {isAdmin && (member.phone || member.email) && (
                          <div className="flex items-center space-x-3 mt-1.5 opacity-60">
                            {member.phone && (
                              <div className="flex items-center space-x-1">
                                <span className="text-[8px] font-bold">{member.phone}</span>
                              </div>
                            )}
                            {member.email && (
                              <div className="flex items-center space-x-1">
                                <span className="text-[8px] font-bold truncate max-w-[100px]">{member.email}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`hidden md:block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        member.status === 'Líder' ? 'bg-indigo-50 text-indigo-600' :
                        member.status === 'Ativo' ? 'bg-green-50 text-green-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {member.status}
                      </div>
                      {isAdmin && (
                        <div className="flex items-center space-x-1">
                           <button 
                             onClick={() => setEditingMember(member)}
                             className="p-2.5 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary-light rounded-xl transition-all border border-slate-100"
                             title="Editar"
                           >
                             <Pencil className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDeleteItem('members', member.id)}
                             className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-100"
                             title="Excluir"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      )}
                      <button 
                        onClick={() => handleStartChat(member)}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary-light rounded-xl transition-all border border-slate-100"
                        title="Enviar Mensagem"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-50">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-sm font-bold">Nenhum membro encontrado</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'missions':
        const totalCollected = currentCampaign.departments.reduce((acc, d) => acc + d.collected, 0);
        const percent = (totalCollected / currentCampaign.totalGoal) * 100;

        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="pb-24 max-w-2xl mx-auto px-4 pt-12"
          >
            <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('financial')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Missões</h1>
            </div>

            <div className="bg-primary p-8 rounded-[20px] text-white shadow-sm relative overflow-hidden mb-8">
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                     <Heart className="w-6 h-6 text-white" />
                   </div>
                   <div className="flex items-center space-x-2">
                     <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                       {currentCampaign.title}
                     </span>
                     {isAdmin && (
                       <button 
                         onClick={() => setEditingCampaign(currentCampaign)}
                         className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                       >
                         <Pencil className="w-3.5 h-3.5" />
                       </button>
                     )}
                   </div>
                 </div>
                 <p className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-80 mb-2">Alvo Geral da Igreja</p>
                 <div className="flex items-baseline space-x-2 mb-6">
                   <h2 className="text-4xl font-bold tracking-tight">R$ {totalCollected.toLocaleString()}</h2>
                   <span className="text-xs font-bold opacity-60">/ R$ {currentCampaign.totalGoal.toLocaleString()}</span>
                 </div>
                 <div className="w-full h-2.5 bg-white/20 rounded-full mb-2">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                   />
                 </div>
                 <p className="text-xs text-right font-black uppercase tracking-widest opacity-80">{percent.toFixed(1)}% Concluído</p>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            </div>

            <SectionHeader title="Alvos por Departamento" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCampaign.departments.map((dept) => {
                const dPercent = (dept.collected / dept.goal) * 100;
                return (
                  <div key={dept.id} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-card transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">{dept.department}</h4>
                        <p className="text-xl font-black text-slate-800">R$ {dept.collected.toLocaleString()}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${dPercent >= 100 ? 'bg-green-50 text-green-500' : 'bg-slate-50 text-slate-400'}`}>
                        {dPercent.toFixed(0)}%
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mb-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(dPercent, 100)}%` }}
                        className={`h-full rounded-full ${dPercent >= 100 ? 'bg-green-500' : 'bg-primary'}`} 
                      />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 text-right">Alvo: R$ {dept.goal.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-12 bg-slate-900 rounded-[40px] p-8 text-center text-white relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-2xl font-black mb-2 italic">Próximos Alvos</h3>
                 <div className="flex justify-center space-x-4 mt-6">
                    {currentCampaign.nextTargets?.map((target, idx) => (
                      <div key={idx} className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black uppercase">{target.label}</p>
                        <p className="text-lg font-black mt-1">{target.month}</p>
                      </div>
                    ))}
                    {(!currentCampaign.nextTargets || currentCampaign.nextTargets.length === 0) && (
                      <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 opacity-50">
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum evento futuro</p>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </motion.div>
        );

      case 'more':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="pb-24 max-w-2xl mx-auto px-4 pt-12"
          >
            <div className="flex items-center space-x-4 mb-4">
              <button 
                onClick={() => setActiveView('home')}
                className="p-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm lg:hidden"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-primary tracking-tight">Explorar</h1>
            </div>

            <div className="mb-12">
              <div className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-xl shadow-slate-200/50 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center space-x-5">
                      <div className="w-16 h-16 bg-primary-light rounded-[28px] flex items-center justify-center shadow-sm">
                        <Zap className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">Dízimos & Missões</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Contribuição Instantânea</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50/50 p-10 rounded-[40px] border border-slate-100/50 backdrop-blur-sm">
                    <div className="space-y-6">
                      <div>
                         <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Chave Pix Oficial</span>
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                         </div>
                         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group/key">
                           <p className="text-base font-mono text-slate-800 select-all font-bold tracking-tight break-all">
                             {pixKey}
                           </p>
                           <button onClick={handleCopyPix} className="p-3 bg-slate-50 rounded-xl hover:bg-primary hover:text-white transition-all ml-4 shrink-0">
                             <Copy className="w-5 h-5" />
                           </button>
                         </div>
                      </div>
                      <button 
                        onClick={handleCopyPix}
                        className="w-full bg-primary text-white py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 active:scale-95 transition-all hover:bg-slate-800 flex items-center justify-center space-x-3"
                      >
                        <Wallet className="w-5 h-5" />
                        <span>Copiar Pix</span>
                      </button>
                    </div>
                    <div className="space-y-6 text-center">
                      <div className="bg-white p-6 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center shadow-lg shadow-slate-100/50 group/qr relative group transition-all hover:border-primary/20">
                       <div className="w-32 h-32 bg-slate-50 rounded-3xl mb-4 flex items-center justify-center relative overflow-hidden ring-8 ring-slate-50/50">
                          <QrCode className="w-16 h-16 text-slate-900 opacity-80" />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed px-4">Aponte sua câmera para o <br/> QR Code e doe agora</p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { icon: Music, label: 'Notícias da Fé', info: 'Feed cristão atualizado', view: 'news' },
                { icon: Users, label: 'Lista de Membros', info: 'Busque e filtre contatos', view: 'members' },
                { icon: MessageSquare, label: 'Aconselhamento Cristão', info: 'Assistência Bíblica com IA', view: 'ai-chat' },
                { icon: Video, label: 'Vídeos Devocionais', info: 'Semeando a palavra', view: 'devotionals' },
                { icon: Heart, label: 'Mural de Oração', info: 'Interceda por seus irmãos', view: 'prayers' },
                { icon: Heart, label: 'Dashboard de Missões', info: 'Alvos mundiais e estaduais', view: 'missions' },
                { icon: Video, label: 'Pregações & Lives', info: 'Assista aos últimos cultos', view: 'lives' },
                { icon: UserPlus, label: 'Integrar Convidados', info: 'Novos visitantes', view: 'guests' },
                { icon: FileText, label: 'Cursos & trilhas', info: 'Crescimento cristão', view: 'courses' },
                { icon: MapPin, label: 'Encontrar Igreja/Grupo', info: 'Encontre sedes e pequenos grupos', view: 'locations' },
                (userRole === 'admin' || userRole === 'lider') ? { icon: Settings, label: 'Painel do Líder', info: 'Gestão ministerial', view: 'admin' } : null,
                { icon: UserPlus, label: 'Configurações', info: 'Perfil e notificações', view: 'profile' }
              ].filter(Boolean).map((item: any, idx) => (
                <button 
                  key={idx} 
                  onClick={() => item.view && setActiveView(item.view as View)}
                  className="w-full flex items-center p-6 bg-white rounded-3xl border border-slate-100 group hover:border-primary/20 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-primary transition-colors">
                    <item.icon className="w-6 h-6 text-slate-400 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-800">{item.label}</h4>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-black mt-0.5">{item.info}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              ))}
            </div>

            <div className="mt-12 bg-primary/5 rounded-[40px] p-8 text-center border border-primary/10">
              <h3 className="text-2xl font-black text-primary mb-2">Precisa de ajuda?</h3>
              <p className="text-sm text-slate-600 mb-6 font-medium">Nossa equipe de suporte e pastores estão aqui para você.</p>
              <button 
                onClick={() => alert("Sua solicitação foi enviada ao Pastor Gilmar. Ele entrará em contato em breve.")}
                className="bg-primary text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                Solicitar Contato Pastor
              </button>
            </div>
            
            <p className="text-center mt-12 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Igreja Conectada v1.0.5</p>
          </motion.div>
        );

      case 'news':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button onClick={() => setActiveView('home')} className="p-2 bg-white border border-slate-100 rounded-xl">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Notícias</h1>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFetchNews();
                }}
                className="p-3 bg-white border border-slate-100 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm focus:outline-none"
                disabled={isFetchingNews}
              >
                <Activity className={`w-5 h-5 ${isFetchingNews ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-6">
              {newsCacheSnap?.docs.map(doc => {
                const item = { id: doc.id, ...doc.data() } as NewsItem;
                return (
                  <motion.div 
                    key={item.id}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40 group cursor-pointer"
                    onClick={() => window.open(item.link, '_blank')}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      <div className="absolute top-4 left-4">
                         <span className="bg-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                           {item.source}
                         </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center space-x-2 text-slate-400 mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {new Date(item.pubDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight mb-3 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                      <div className="mt-4 flex items-center text-primary text-[10px] font-black uppercase tracking-widest space-x-2">
                        <span>Ler Notícia Completa</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {newsCacheSnap?.empty && !isFetchingNews && (
                <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                  <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-400 italic">Nenhum conteúdo no momento</p>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFetchNews();
                    }} className="mt-4 text-primary text-xs font-black uppercase tracking-widest focus:outline-none">Atualizar Agora</button>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'fake-news':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('home')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Detector de Fake News</h1>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black italic tracking-tighter mb-4">Verificação com IA Bíblica</h3>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed mb-6">
                    A desinformação pode prejudicar o corpo de Cristo. Use nossa IA para analisar notícias, áudios ou afirmações sob a ótica dos fatos e da sabedoria cristã.
                  </p>
                  
                  <form onSubmit={handleAnalyzeFakeNews} className="space-y-4">
                    <textarea 
                      value={fakeNewsInput}
                      onChange={(e) => setFakeNewsInput(e.target.value)}
                      placeholder="Cole aqui o título da notícia ou o texto que deseja verificar..."
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-sm font-medium text-white placeholder:text-white/30 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button 
                      type="submit"
                      disabled={isAnalyzingFakeNews || !fakeNewsInput.trim()}
                      className="w-full py-5 bg-indigo-600 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all active:scale-95"
                    >
                      {isAnalyzingFakeNews ? (
                        <>
                          <Activity className="w-5 h-5 animate-spin" />
                          <span>Analisando Veracidade...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          <span>Verificar Agora</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              <AnimatePresence>
                {fakeNewsAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl relative overflow-hidden">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className={`p-4 rounded-2xl ${
                          fakeNewsAnalysis.verdict === 'true' ? 'bg-green-100 text-green-600' :
                          fakeNewsAnalysis.verdict === 'false' ? 'bg-red-100 text-red-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {fakeNewsAnalysis.verdict === 'true' ? <CheckCircle2 className="w-8 h-8" /> : 
                           fakeNewsAnalysis.verdict === 'false' ? <X className="w-8 h-8" /> : 
                           <Activity className="w-8 h-8" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Veredito da Análise</p>
                          <h4 className={`text-2xl font-black italic tracking-tighter ${
                            fakeNewsAnalysis.verdict === 'true' ? 'text-green-600' :
                            fakeNewsAnalysis.verdict === 'false' ? 'text-red-600' :
                            'text-orange-600'
                          }`}>
                            {fakeNewsAnalysis.verdict === 'true' ? 'Informação Verídica' :
                             fakeNewsAnalysis.verdict === 'false' ? 'Fake News Detectada' :
                             fakeNewsAnalysis.verdict === 'misleading' ? 'Informação Enganosa' :
                             'Inconclusivo'}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Explicação Detalhada</h5>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            {fakeNewsAnalysis.explanation}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Perspectiva Bíblica</h5>
                          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 relative group">
                            <BookOpen className="absolute top-4 right-4 w-5 h-5 text-indigo-200 group-hover:text-indigo-400 transition-colors" />
                            <p className="text-sm text-indigo-900 font-serif italic leading-relaxed pr-8">
                              "{fakeNewsAnalysis.biblicalPerspective}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confiança da IA</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${
                                  fakeNewsAnalysis.confidence > 70 ? 'bg-green-500' :
                                  fakeNewsAnalysis.confidence > 40 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${fakeNewsAnalysis.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-black text-slate-800">{fakeNewsAnalysis.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-6 text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                         "Não aceitem notícias falsas nem se unam ao ímpio para serem testemunhas maldosas." — Êxodo 23:1
                       </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );

      case 'lives':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('more')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-slate-900">Pregações & Lives</h1>
            </div>
            <div className="space-y-6">
              {[
                { title: "Culto de Celebração - Unção e Poder", date: "19/04", duration: "1h 45min", type: "Gravado" },
                { title: "Escola Bíblica Dominical - Epístolas", date: "16/04", duration: "55min", type: "EBD" },
                { title: "Quarta de Clamor - Avivamento", date: "15/04", duration: "1h 20min", type: "Gravado" }
              ].map((live, i) => (
                <div key={i} className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm group hover:border-primary/20 transition-all">
                  <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
                    <Video className="w-12 h-12 text-white/20 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                       <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit mb-2">{live.type}</span>
                       <h4 className="text-white text-xl font-bold">{live.title}</h4>
                    </div>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">🗓️ {live.date} • {live.duration}</p>
                    <button 
                      onClick={() => alert("Simulando reprodução do vídeo: " + live.title)}
                      className="px-6 py-2 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                      Assistir agora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'guests':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
             <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('more')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-slate-900">Integrar Convidados</h1>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl">
              <h3 className="text-xl font-bold mb-6">Cadastro de Visitante</h3>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Convidado cadastrado com sucesso!"); setActiveView('more'); }}>
                <input required type="text" placeholder="Nome Completo" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" />
                <input required type="tel" placeholder="Telefone / WhatsApp" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" />
                <textarea placeholder="Observações (Como conheceu a igreja?)" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold min-h-[100px]" />
                <button type="submit" className="w-full py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-lg shadow-primary/20">Registrar Convidado</button>
              </form>
            </div>
          </motion.div>
        );

      case 'courses':
        const displayCourses = courses.length > 0 ? courses : [
          { id: '1', title: 'Maturidade Cristã', duration: '8 Aulas', info: 'Cresça na fé genuína.', status: 'Inscrições Abertas' },
          { id: '2', title: 'Primeiros Passos', duration: '6 Aulas', info: 'Para novos convertidos.', status: 'Inscrições Abertas' },
          { id: '3', title: 'Formação de Líderes', duration: '12 Aulas', info: 'Prepare-se para o serviço.', status: 'Inscrições Abertas' },
          { id: '4', title: 'Teologia Básica', duration: '15 Aulas', info: 'Entenda os fundamentos.', status: 'Inscrições Abertas' }
        ];

        const recommendedOnes = displayCourses.filter((c: any) => recommendedCourseIds.includes(c.id));
        const otherCourses = displayCourses.filter((c: any) => !recommendedCourseIds.includes(c.id));

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button onClick={() => setActiveView('more')} className="p-2 bg-white border border-slate-100 rounded-xl">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h1 className="text-3xl font-black text-slate-900">Cursos & Trilhas</h1>
              </div>
              {isRecommending && (
                <div className="flex items-center space-x-2 bg-primary/5 px-4 py-2 rounded-2xl">
                  <Zap className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-primary">IA Recomendando...</span>
                </div>
              )}
            </div>

            {recommendedOnes.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center space-x-2 mb-6">
                  <Zap className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-black text-slate-800 italic">Recomendados para você</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {recommendedOnes.map((c: any) => {
                    const enrollment = myEnrollments.find((e: any) => e.courseId === c.id);
                    return (
                      <div key={c.id} className="p-8 bg-primary rounded-[40px] text-white shadow-xl shadow-primary/20 group relative">
                        <div className="flex justify-between items-start">
                          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                            <Zap className="w-7 h-7 text-white" />
                          </div>
                          {enrollment && (
                             <span className="bg-white/20 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center">
                               <CheckCircle2 className="w-3 h-3 mr-1" /> Inscrito
                             </span>
                          )}
                        </div>
                        <h4 className="text-2xl font-black leading-tight italic">{c.title}</h4>
                        <p className="text-sm text-white/70 mt-2 font-medium">{c.info}</p>
                        <button 
                          onClick={() => handleEnrollCourse(c.id, c.title)}
                          disabled={!!enrollment}
                          className={`w-full mt-8 py-4 text-[9px] font-black uppercase tracking-widest rounded-2xl border transition-all active:scale-95 ${
                            enrollment 
                            ? 'bg-white/10 text-white/50 border-white/10 cursor-not-allowed'
                            : 'bg-white text-primary border-white hover:bg-slate-50'
                          }`}
                        >
                          {enrollment ? 'Inscrição Confirmada' : 'Fazer Inscrição'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <SectionHeader title="Todos os Cursos" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherCourses.map((c: any) => {
                const enrollment = myEnrollments.find((e: any) => e.courseId === c.id);
                return (
                  <div key={c.id} className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-card hover:-translate-y-1 transition-all group">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                      <BookOpen className="w-7 h-7 text-primary group-hover:text-white" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 leading-tight">{c.title}</h4>
                    <p className="text-sm text-slate-500 mt-2 font-medium">{c.info}</p>
                    <div className="flex items-center justify-between mt-4">
                       <p className="text-[10px] text-primary font-black uppercase tracking-widest">{c.duration} • {c.status}</p>
                       {enrollment && (
                         <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center">
                           <CheckCircle2 className="w-3 h-3 mr-1" /> Inscrito
                         </span>
                       )}
                    </div>
                    <button 
                      onClick={() => handleEnrollCourse(c.id, c.title)}
                      disabled={!!enrollment}
                      className={`w-full mt-8 py-4 text-[9px] font-black uppercase tracking-widest rounded-2xl border transition-all active:scale-95 ${
                        enrollment 
                        ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-900 border-slate-100 hover:bg-primary hover:text-white hover:border-primary shadow-lg shadow-transparent hover:shadow-primary/20'
                      }`}
                    >
                      {enrollment ? 'Inscrição Confirmada' : 'Fazer Inscrição'}
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteItem('courses', c.id)}
                        className="absolute top-4 right-4 p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );

      case 'locations':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 max-w-2xl mx-auto px-4 pt-12">
             <div className="flex items-center space-x-4 mb-10">
              <button onClick={() => setActiveView('home')} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter">Encontrar</h1>
            </div>

            <SectionHeader title="Nossas Sedes" />
            <div className="space-y-4 mb-12">
              {['Sede Central', 'Congregação Norte', 'Congregação Sul'].map((s, i) => (
                <div key={i} className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm flex items-start space-x-6 hover:border-primary/20 transition-all group">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800">{s}</h4>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">Rua Benjamin Constant, nº {100 + i*50}</p>
                    <button className="text-[10px] text-primary font-black uppercase tracking-widest mt-4 flex items-center group-hover:translate-x-1 transition-transform">
                      Ver no Mapa
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <SectionHeader title="Grupos Pequenos (Células)" />
            <p className="text-xs text-slate-400 font-medium px-2 mb-6 italic">Encontre um grupo de comunhão perto de você para crescer na fé e compartilhar a vida.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'GP Esperança', leader: 'João & Maria', location: 'Centro', day: 'Quarta-feira, 19:30' },
                { name: 'GP Vida', leader: 'Pedro Silva', location: 'Bairro Norte', day: 'Quinta-feira, 20:00' },
                { name: 'GP Fé', leader: 'Lucas Santos', location: 'Vila Sul', day: 'Terça-feira, 19:00' },
                { name: 'GP Shalom', leader: 'Ana Souza', location: 'Condomínio Leste', day: 'Sábado, 18:00' }
              ].map((gp, i) => (
                <div key={i} className="p-6 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-lg transition-all group border-b-4 border-b-emerald-100">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800 italic">{gp.name}</h4>
                  <div className="space-y-1 mt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Líder: {gp.leader}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">🕒 {gp.day}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                       <MapPin className="w-3 h-3" />
                       <span>{gp.location}</span>
                    </div>
                    <button className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'profile':
        if (profileSubView === 'notifications') {
          return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-32 max-w-2xl mx-auto px-6 pt-12">
               <div className="flex items-center space-x-4 mb-8">
                <button onClick={() => setProfileSubView('main')} className="p-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <ChevronLeft className="w-5 h-5 text-slate-800" />
                </button>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Notificações</h1>
              </div>
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden p-8 space-y-4">
                 {['Avisos', 'Eventos', 'Escalas', 'Mensagens', 'Devocionais'].map(pref => (
                   <button 
                    key={pref}
                    onClick={() => handleUpdateNotificationPrefs(pref)}
                    className="w-full flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-[24px] group transition-all"
                   >
                     <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${userNotificationPrefs.includes(pref) ? 'bg-primary' : 'bg-slate-200'}`}>
                           <Bell className={`w-5 h-5 ${userNotificationPrefs.includes(pref) ? 'text-white' : 'text-slate-500'}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{pref}</span>
                     </div>
                     <div className={`w-12 h-6 rounded-full relative transition-colors ${userNotificationPrefs.includes(pref) ? 'bg-primary' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userNotificationPrefs.includes(pref) ? 'left-7' : 'left-1'}`} />
                     </div>
                   </button>
                 ))}
              </div>
            </motion.div>
          );
        }

        if (profileSubView === 'donations') {
          const myDonations = financialData.filter((d: any) => d.userId === user?.uid);
          return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-32 max-w-2xl mx-auto px-6 pt-12">
               <div className="flex items-center space-x-4 mb-8">
                <button onClick={() => setProfileSubView('main')} className="p-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <ChevronLeft className="w-5 h-5 text-slate-800" />
                </button>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Minhas Doações</h1>
              </div>
              <div className="space-y-4">
                 {myDonations.length > 0 ? myDonations.map((d: any) => (
                   <div key={d.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                     <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                           <Heart className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d.type}</p>
                          <p className="text-sm font-bold text-slate-800">{new Date(d.date?.seconds * 1000).toLocaleDateString('pt-BR')}</p>
                        </div>
                     </div>
                     <p className="text-xl font-black text-slate-800 italic">R$ {d.amount?.toFixed(2)}</p>
                   </div>
                 )) : (
                   <div className="p-20 text-center bg-white rounded-[48px] border-4 border-dashed border-slate-50 italic text-slate-300 uppercase tracking-widest text-[10px] font-black">
                     Nenhuma doação registrada
                   </div>
                 )}
              </div>
            </motion.div>
          );
        }

        if (profileSubView === 'personal') {
          const userMember = members.find(m => m.email === user?.email);
          const initialFormData = {
            name: userMember?.name || user?.displayName || '',
            phone: userMember?.phone || '',
            email: userMember?.email || user?.email || '',
            privacyMode: privacyMode
          };

          return (
            <PersonalDataForm 
              initialData={initialFormData} 
              onSave={handleUpdatePersonalData} 
              onBack={() => setProfileSubView('main')} 
            />
          );
        }

        if (profileSubView === 'theme') {
          return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-32 max-w-2xl mx-auto px-6 pt-12 text-slate-800">
               <div className="flex items-center space-x-4 mb-8">
                <button onClick={() => setProfileSubView('main')} className="p-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-xl shadow-sm leading-none">
                  <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                </button>
                <h1 className="text-3xl font-black tracking-tighter italic">Personalização</h1>
              </div>

              <div className="bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/40 shadow-2xl overflow-hidden p-8 space-y-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-l-4 border-indigo-600 pl-4">Intensidade do Fundo</h3>
                    <div className="px-2">
                       <input 
                         type="range" 
                         min="0" 
                         max="100" 
                         value={bgIntensity}
                         onChange={(e) => setBgIntensity(parseInt(e.target.value))}
                         className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                       />
                       <div className="flex justify-between mt-4">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic font-mono">Suave</span>
                         <span className="text-xs font-black text-indigo-600 italic tracking-tighter font-mono">{bgIntensity}%</span>
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic font-mono">Vibrante</span>
                       </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/20">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-l-4 border-indigo-600 pl-4">Estilos Rápidos</h3>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { label: 'Minimalista', val: 0 },
                         { label: 'Padrão Profissional', val: 50 },
                         { label: 'Vibrante Premium', val: 100 }
                       ].map(preset => (
                         <button 
                           key={preset.val}
                           onClick={() => setBgIntensity(preset.val)}
                           className={`p-5 rounded-3xl border transition-all text-[10px] font-black uppercase tracking-widest ${bgIntensity === preset.val ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}
                         >
                           {preset.label}
                         </button>
                       ))}
                    </div>
                  </div>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 max-w-2xl mx-auto px-6 pt-12">
            <div className="flex items-center justify-between mb-12">
               <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Meu Perfil</h1>
               <button 
                 onClick={() => setProfileSubView('theme')}
                 className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-primary transition-colors"
               >
                 <Settings className="w-6 h-6" />
               </button>
            </div>
            
            <div className="flex flex-col items-center text-center mb-12">
               <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl shadow-primary/20 mb-6 relative group">
                 <img src={user?.photoURL || "https://picsum.photos/seed/person/200"} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                   <Pencil className="w-6 h-6 text-white" />
                 </div>
               </div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">{user?.displayName || 'Membro'}</h2>
               <div className="flex items-center space-x-2 mt-2 text-slate-400">
                 <MapPin className="w-3 h-3" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Membro desde 2024 • Congregação Central</span>
               </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: Users, label: 'Meus dados', subview: 'personal' },
                { icon: Zap, label: 'Temas e Cores', subview: 'theme' },
                { icon: Heart, label: 'Minhas doações', subview: 'donations' },
                { icon: Bell, label: 'Notificações', subview: 'notifications' },
                { icon: Shield, label: 'Privacidade', subview: 'personal' },
              ].map((opt: any, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setProfileSubView(opt.subview)}
                  className="w-full flex items-center p-6 bg-white border border-slate-100 rounded-[28px] group hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-primary/10 transition-colors">
                    <opt.icon className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                  </div>
                  <h4 className="flex-1 text-sm font-bold text-slate-700 tracking-tight">{opt.label}</h4>
                  <ChevronRight className="w-5 h-5 text-slate-200 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
              
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center p-6 bg-white border border-red-50 rounded-[28px] group hover:bg-red-50 transition-all text-left mt-6"
              >
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mr-5">
                  <LogOut className="w-6 h-6 text-red-500" />
                </div>
                <h4 className="flex-1 text-sm font-bold text-red-500 tracking-tight">Sair</h4>
                <ChevronRight className="w-5 h-5 text-red-200" />
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen relative selection:bg-primary selection:text-white lg:pl-80 overflow-x-hidden"
      style={getDynamicStyles()}
    >
      {/* Dynamic Overlay Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
      {/* Scrollable View Area */}
      <div className="relative z-0">
        <AnimatePresence mode="wait">
          <div key={activeView}>
            {renderView()}
          </div>
        </AnimatePresence>

        {/* Transaction Form Modal */}
        <AnimatePresence>
          {showTransactionForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTransactionForm(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-md rounded-[48px] shadow-2xl p-10 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">Registrar {transactionType}</h3>
                    <p className="text-xs text-slate-400 font-medium">Sua contribuição fortalece a obra de Deus.</p>
                  </div>
                  <button onClick={() => setShowTransactionForm(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <X className="w-6 h-6 text-slate-300" />
                  </button>
                </div>

                <form onSubmit={handleCreateTransaction} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor (R$)</label>
                    <div className="relative mt-2">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</span>
                       <input 
                         autoFocus
                         required
                         type="number"
                         step="0.01"
                         className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 pl-14 text-2xl font-black text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                         placeholder="0,00"
                         value={transactionAmount}
                         onChange={e => setTransactionAmount(e.target.value)}
                       />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Seguridade & Sigilo</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Todas as contribuições são processadas com criptografia. Atualmente operamos via **Pix Copia e Cola**. Confirme o valor após realizar a transferência.
                    </p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-6 bg-primary text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center space-x-3"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Envio</span>
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <EditModal 
          title="Editar Membro" 
          isOpen={!!editingMember} 
          onClose={() => setEditingMember(null)}
        >
          <form onSubmit={handleUpdateMember} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingMember?.name || ''} 
                  onChange={e => setEditingMember({...editingMember, name: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                    value={editingMember?.role || ''} 
                    onChange={e => setEditingMember({...editingMember, role: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                    value={editingMember?.status || 'Ativo'} 
                    onChange={e => setEditingMember({...editingMember, status: e.target.value as any})}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Líder">Líder</option>
                    <option value="Visitante">Visitante</option>
                  </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefone</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                     value={editingMember?.phone || ''} 
                     onChange={e => setEditingMember({...editingMember, phone: e.target.value})} 
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</label>
                   <input 
                     type="email" 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                     value={editingMember?.email || ''} 
                     onChange={e => setEditingMember({...editingMember, email: e.target.value})} 
                   />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20">Salvar Alterações</button>
            <button type="button" onClick={() => setEditingMember(null)} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          </form>
        </EditModal>

        <EditModal 
          title="Editar Aviso" 
          isOpen={!!editingAnnouncement} 
          onClose={() => setEditingAnnouncement(null)}
        >
          <form onSubmit={handleUpdateAnnouncement} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingAnnouncement?.title || ''} 
                  onChange={e => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conteúdo</label>
                <textarea 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold min-h-[120px]" 
                  value={editingAnnouncement?.content || ''} 
                  onChange={e => setEditingAnnouncement({...editingAnnouncement, content: e.target.value})} 
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center space-x-3">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${editingAnnouncement?.isPinned ? 'bg-amber-500' : 'bg-slate-200'}`}>
                      <Pin className={`w-4 h-4 ${editingAnnouncement?.isPinned ? 'text-white' : 'text-slate-500'}`} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Destacar Aviso</p>
                      <p className="text-[9px] text-slate-400 font-bold">Fixar no topo e adicionar indicador visual</p>
                   </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setEditingAnnouncement({...editingAnnouncement, isPinned: !editingAnnouncement.isPinned})}
                  className={`w-12 h-6 rounded-full relative transition-colors ${editingAnnouncement?.isPinned ? 'bg-primary' : 'bg-slate-300'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingAnnouncement?.isPinned ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20">Salvar Alterações</button>
            <button type="button" onClick={() => setEditingAnnouncement(null)} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          </form>
        </EditModal>

        <EditModal 
          title="Editar Evento" 
          isOpen={!!editingAgendaItem} 
          onClose={() => setEditingAgendaItem(null)}
        >
          <form onSubmit={handleUpdateAgendaItem} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Evento</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingAgendaItem?.title || ''} 
                  onChange={e => setEditingAgendaItem({...editingAgendaItem, title: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                    value={editingAgendaItem?.date || ''} 
                    onChange={e => setEditingAgendaItem({...editingAgendaItem, date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hora</label>
                  <input 
                    required 
                    type="time" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                    value={editingAgendaItem?.time || ''} 
                    onChange={e => setEditingAgendaItem({...editingAgendaItem, time: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20">Salvar Alterações</button>
            <button type="button" onClick={() => setEditingAgendaItem(null)} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          </form>
        </EditModal>

        <EditModal 
          title="Aviso" 
          isOpen={!!viewingAnnouncement} 
          onClose={() => setViewingAnnouncement(null)}
        >
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary-light px-3 py-1 rounded-full">{viewingAnnouncement?.tag}</span>
              <h2 className="text-3xl font-black text-slate-900 mt-4 leading-tight">{viewingAnnouncement?.title}</h2>
              <p className="text-xs text-slate-400 font-medium mt-2">{viewingAnnouncement?.date}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 italic text-slate-600 leading-relaxed mb-6">
              {viewingAnnouncement?.content || "Nenhum detalhe adicional informado."}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <CommentSection contentId={viewingAnnouncement?.id} user={user} isAdmin={isAdmin} userRole={userRole} />
            </div>

            <button 
              onClick={() => setViewingAnnouncement(null)}
              className="w-full mt-6 py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20 active:scale-95 transition-all outline-none"
            >
              Entendido
            </button>
          </div>
        </EditModal>

        <EditModal 
          title="Editar Escala" 
          isOpen={!!editingScale} 
          onClose={() => setEditingScale(null)}
        >
          <form onSubmit={handleUpdateScale} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ministério</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingScale?.ministry || 'Louvor'} 
                  onChange={e => setEditingScale({...editingScale, ministry: e.target.value})}
                >
                  {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Voluntário</label>
                <select 
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingScale?.memberId || ''} 
                  onChange={e => {
                    const m = members.find(mem => mem.id === e.target.value);
                    if (m) setEditingScale({...editingScale, memberId: m.id, memberName: m.name, memberAvatar: m.avatar});
                  }}
                >
                   <option value="">Selecione um membro...</option>
                   {members.sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                     <option key={m.id} value={m.id}>
                       {m.name} {m.ministry ? `(${m.ministry})` : ''}
                     </option>
                   ))}
                 </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Função</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingScale?.role || ''} 
                  onChange={e => setEditingScale({...editingScale, role: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data e Hora</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingScale?.date || ''} 
                  onChange={e => setEditingScale({...editingScale, date: e.target.value})} 
                />
              </div>
            </div>
            <button type="submit" className="w-full py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20">Salvar Alterações</button>
            <button type="button" onClick={() => setEditingScale(null)} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          </form>
        </EditModal>

        <EditModal 
          title="Editar Devocional" 
          isOpen={!!editingDevotional} 
          onClose={() => setEditingDevotional(null)}
        >
          <form onSubmit={handleUpdateDevotional} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingDevotional?.title || ''} 
                  onChange={e => setEditingDevotional({...editingDevotional, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Link do Vídeo</label>
                <input 
                  required 
                  type="url" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingDevotional?.videoUrl || ''} 
                  onChange={e => setEditingDevotional({...editingDevotional, videoUrl: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pequena Descrição</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold min-h-[100px]" 
                  value={editingDevotional?.description || ''} 
                  onChange={e => setEditingDevotional({...editingDevotional, description: e.target.value})} 
                />
              </div>
            </div>
            <button type="submit" className="w-full py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20">Salvar Alterações</button>
            <button type="button" onClick={() => setEditingDevotional(null)} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          </form>
        </EditModal>

        <EditModal 
          title="Metas de Construção" 
          isOpen={editingConstruction} 
          onClose={() => setEditingConstruction(false)}
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arrecadado Atualmente (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={constructionGoal.current} 
                  onChange={e => setConstructionGoal({...constructionGoal, current: parseInt(e.target.value)})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Final (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={constructionGoal.target} 
                  onChange={e => setConstructionGoal({...constructionGoal, target: parseInt(e.target.value)})} 
                />
              </div>
            </div>
            <button 
              onClick={() => setEditingConstruction(false)}
              className="w-full py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl"
            >
              Confirmar Visualização Local
            </button>
            <p className="text-[9px] text-slate-400 text-center uppercase font-bold px-4">Nota: Esta meta é global e as mudanças serão refletidas para todos os usuários logados nesta sessão.</p>
          </div>
        </EditModal>

        <EditModal 
          title="Editar Campanha Missionária" 
          isOpen={!!editingCampaign} 
          onClose={() => setEditingCampaign(null)}
        >
          <form onSubmit={handleSaveCampaign} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título da Campanha</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingCampaign?.title || ''} 
                  onChange={e => setEditingCampaign(prev => prev ? {...prev, title: e.target.value} : null)} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Alvo Total (R$)</label>
                <input 
                  required
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold" 
                  value={editingCampaign?.totalGoal || 0} 
                  onChange={e => setEditingCampaign(prev => prev ? {...prev, totalGoal: parseInt(e.target.value)} : null)} 
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-widest mb-4">Próximos Alvos</h4>
                <div className="space-y-3">
                  {editingCampaign?.nextTargets?.map((target, tIdx) => (
                    <div key={tIdx} className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400">Etapa</label>
                        <input 
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold"
                          value={target.label}
                          onChange={e => {
                            const newTargets = [...(editingCampaign.nextTargets || [])];
                            newTargets[tIdx] = { ...newTargets[tIdx], label: e.target.value };
                            setEditingCampaign({ ...editingCampaign, nextTargets: newTargets });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400">Data/Mês</label>
                        <input 
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold"
                          value={target.month}
                          onChange={e => {
                            const newTargets = [...(editingCampaign.nextTargets || [])];
                            newTargets[tIdx] = { ...newTargets[tIdx], month: e.target.value };
                            setEditingCampaign({ ...editingCampaign, nextTargets: newTargets });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-widest mb-4">Alvos por Departamento</h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide pb-20">
                  {editingCampaign?.departments.map((dept, idx) => (
                    <div key={dept.id} className="p-4 bg-slate-50 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black uppercase text-primary">{dept.department}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Objetivo (R$)</label>
                          <input 
                            type="number"
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold"
                            value={dept.goal}
                            onChange={e => {
                              const newDepts = [...(editingCampaign.departments)];
                              newDepts[idx] = { ...newDepts[idx], goal: parseInt(e.target.value) };
                              setEditingCampaign({ ...editingCampaign, departments: newDepts });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Coletado (R$)</label>
                          <input 
                            type="number"
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold"
                            value={dept.collected}
                            onChange={e => {
                              const newDepts = [...(editingCampaign.departments)];
                              newDepts[idx] = { ...newDepts[idx], collected: parseInt(e.target.value) };
                              setEditingCampaign({ ...editingCampaign, departments: newDepts });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20">Salvar Tudo</button>
            <button type="button" onClick={() => setEditingCampaign(null)} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Cancelar Edição</button>
          </form>
        </EditModal>
        
        <EditModal 
          title="Editar Curso" 
          isOpen={!!editingCourse} 
          onClose={() => setEditingCourse(null)}
        >
          <form onSubmit={handleUpdateCourse} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título do Curso</label>
              <input 
                required 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold" 
                value={editingCourse?.title || ''} 
                onChange={e => setEditingCourse({...(editingCourse || {}), title: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duração</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold" 
                  value={editingCourse?.duration || ''} 
                  onChange={e => setEditingCourse({...(editingCourse || {}), duration: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold" 
                  value={editingCourse?.status || ''} 
                  onChange={e => setEditingCourse({...(editingCourse || {}), status: e.target.value})}
                >
                  <option>Inscrições Abertas</option>
                  <option>Em breve</option>
                  <option>Encerrado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Resumo (Info)</label>
              <input 
                required 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold" 
                value={editingCourse?.info || ''} 
                onChange={e => setEditingCourse({...(editingCourse || {}), info: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição Detalhada</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold min-h-[120px]" 
                value={editingCourse?.description || ''} 
                onChange={e => setEditingCourse({...(editingCourse || {}), description: e.target.value})} 
              />
            </div>
            <div className="flex space-x-3 pt-6">
              <button 
                type="submit" 
                className="flex-1 py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20"
              >
                Salvar Alterações
              </button>
              <button 
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-8 py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </form>
        </EditModal>

        <EditModal 
          title="Confirmar Exclusão" 
          isOpen={!!itemToDelete} 
          onClose={() => setItemToDelete(null)}
        >
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto">
              <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Tem certeza?</h3>
              <p className="text-sm text-slate-500 font-medium mt-2">Esta ação não pode ser desfeita. O item será removido permanentemente de {itemToDelete?.collection}.</p>
            </div>
            <div className="space-y-3 pt-4">
              <button 
                onClick={confirmDelete}
                className="w-full py-4.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-red-200"
              >
                Sim, Excluir Item
              </button>
              <button 
                onClick={() => setItemToDelete(null)}
                className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest"
              >
                Não, Manter Item
              </button>
            </div>
          </div>
        </EditModal>

        <EditModal 
          title="Assistir Vídeo" 
          isOpen={!!activeVideo} 
          onClose={() => setActiveVideo(null)}
        >
          <div className="space-y-6">
            <div className="aspect-video w-full rounded-[32px] overflow-hidden bg-slate-900 shadow-2xl">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${activeVideo?.videoId || extractYouTubeId(activeVideo?.videoUrl)}?autoplay=1`}
                title={activeVideo?.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="px-2">
              <h2 className="text-3xl font-black text-slate-900 leading-tight italic">{activeVideo?.title}</h2>
              <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed mb-6">
                {activeVideo?.description}
              </p>
              
              <div className="border-t border-slate-100 pt-6">
                <CommentSection contentId={activeVideo?.id} user={user} isAdmin={isAdmin} userRole={userRole} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void registrarAtividadeEden('estudo_biblico', {
                estudo_id: String(activeVideo?.id || `ESTUDO-${edenDataReferencia()}`),
                titulo: String(activeVideo?.title || 'Estudo bíblico do dia'),
                data_referencia: edenDataReferencia(),
                concluido: true,
              })}
              disabled={edenRegistroEmAndamento !== null}
              className="w-full mt-6 rounded-3xl bg-indigo-600 py-4.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {edenRegistroEmAndamento === 'estudo_biblico'
                ? 'Registrando estudo...'
                : 'Marcar estudo bíblico como concluído'}
            </button>
            <button 
              onClick={() => setActiveVideo(null)}
              className="w-full mt-6 py-4.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl"
            >
              Fechar Vídeo
            </button>
          </div>
        </EditModal>

        <EditModal 
          title="Evento / Culto" 
          isOpen={!!selectedAgendaItem} 
          onClose={() => setSelectedAgendaItem(null)}
        >
          <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedAgendaItem?.type === 'Educação' ? 'text-primary bg-primary/10' : selectedAgendaItem?.type === 'Exclusivo' ? 'text-accent bg-accent/10' : 'text-primary bg-primary/10'} px-3 py-1 rounded-full`}>
                  {selectedAgendaItem?.type || 'Evento'}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{selectedAgendaItem?.time}</span>
              </div>
            
            <h2 className="text-3xl font-black text-slate-900 leading-tight italic">{selectedAgendaItem?.title}</h2>
            
            <div className="flex flex-col space-y-3">
              <div className="flex items-center text-sm font-bold text-slate-600">
                <Calendar className="w-5 h-5 mr-3 text-primary" />
                <span>{selectedAgendaItem?.date} às {selectedAgendaItem?.time}</span>
              </div>
              <div className="flex items-center text-sm font-bold text-slate-600">
                <MapPin className="w-5 h-5 mr-3 text-primary" />
                <span>{selectedAgendaItem?.location || selectedAgendaItem?.description || 'Templo Sede'}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-6">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {selectedAgendaItem?.description || "Junte-se a nós para este momento especial de comunhão e adoração."}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <CommentSection contentId={selectedAgendaItem?.id} user={user} isAdmin={isAdmin} userRole={userRole} />
            </div>


            <button
              type="button"
              onClick={async () => {
                const dataEvento = edenDataReferencia(selectedAgendaItem?.date);
                const registrado = await registrarAtividadeEden('presenca', {
                  evento_id: String(selectedAgendaItem?.id || `CULTO-${dataEvento}`),
                  evento_nome: String(selectedAgendaItem?.title || 'Culto da igreja'),
                  data_referencia: dataEvento,
                  data_evento: dataEvento,
                });
                if (registrado) setSelectedAgendaItem(null);
              }}
              disabled={edenRegistroEmAndamento !== null}
              className="w-full mt-6 py-4.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              {edenRegistroEmAndamento === 'presenca'
                ? 'Registrando presença...'
                : 'Confirmar Presença'}
            </button>
          </div>
        </EditModal>

        <BulletinViewModal 
          bulletin={selectedBulletin} 
          onClose={() => setSelectedBulletin(null)} 
        />
      </div>

      {/* Bottom Nav Bar - Updated Mockup Style */}
      <div className={`fixed bottom-0 left-0 right-0 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex items-center justify-between safe-bottom z-50 rounded-t-[32px] md:max-w-md md:mx-auto shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 ${(isInputFocused || editingCampaign || editingMember || editingAnnouncement || editingAgendaItem || editingScale || editingConstruction || editingDevotional || editingCourse || itemToDelete) ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <NavItem active={activeView === 'home'} icon={Home} label="Início" onClick={() => setActiveView('home')} />
        <NavItem active={activeView === 'devotionals'} icon={Video} label="Pregações" onClick={() => setActiveView('devotionals')} />
        <NavItem active={activeView === 'agenda'} icon={CalendarDays} label="Agenda" onClick={() => setActiveView('agenda')} />
        <NavItem active={activeView === 'donations'} icon={Heart} label="Doações" onClick={() => setActiveView('donations')} />
        <NavItem active={activeView === 'profile' || activeView === 'admin'} icon={MoreHorizontal} label="Mais" onClick={() => setActiveView('profile')} />
      </div>

      {/* Header for Desktop or bigger screens */}
      <div className="hidden lg:flex fixed top-0 left-0 bottom-0 w-72 bg-card border-r border-slate-100 flex-col p-8 z-50 shadow-sm">
        <div className="mb-12 flex items-center space-x-4">
          <Logo size="sm" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Igreja</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">CONECTADA</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem active={activeView === 'home'} icon={Home} label="Dashboard" onClick={() => setActiveView('home')} />
          <SidebarItem active={activeView === 'news'} icon={BookOpen} label="Notícias" onClick={() => setActiveView('news')} />
          {(userRole === 'admin' || userRole === 'lider') && <SidebarItem active={activeView === 'admin'} icon={Settings} label="Painel do Líder" onClick={() => setActiveView('admin')} />}
          <div className="pt-4 border-t border-slate-50 space-y-2">
            <SidebarItem active={activeView === 'members'} icon={Users} label="Membros" onClick={() => setActiveView('members')} />
            <SidebarItem active={activeView === 'devotionals'} icon={Video} label="Devocionais" onClick={() => setActiveView('devotionals')} />
            <SidebarItem active={activeView === 'prayers'} icon={Heart} label="Mural de Orações" onClick={() => setActiveView('prayers')} />
            <SidebarItem active={activeView === 'chat'} icon={MessageCircle} label="Mensagens Líderes" onClick={() => setActiveView('chat')} />
            <SidebarItem active={activeView === 'fake-news'} icon={ShieldCheck} label="Detector Fake News" onClick={() => setActiveView('fake-news')} />
          </div>
          <div className="pt-4 border-t border-slate-50 space-y-2">
            <SidebarItem active={activeView === 'missions'} icon={Heart} label="Missões" onClick={() => setActiveView('missions')} />
            <SidebarItem active={activeView === 'ministries'} icon={Music} label="Escalas & Ministérios" onClick={() => setActiveView('ministries')} />
            <SidebarItem active={activeView === 'agenda'} icon={Calendar} label="Agenda & Reservas" onClick={() => setActiveView('agenda')} />
            <SidebarItem active={activeView === 'financial'} icon={Wallet} label="Dízimos & Ofertas" onClick={() => setActiveView('financial')} />
          </div>
        </nav>
        
        <div className="mt-auto space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-background border border-slate-100 rounded-[20px] shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xs">
               LS
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.displayName?.split(' ')[0] || 'Irmão'}</p>
              <p className="text-[9px] text-slate-500 truncate uppercase mt-0.5 tracking-widest font-bold">Líder</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SidebarItem = ({ active, icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-4 w-full p-3.5 rounded-[16px] transition-all group ${active ? 'bg-primary/10 text-primary shadow-sm border border-primary/10' : 'text-slate-400 hover:bg-slate-50 hover:text-primary'}`}
  >
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
      <Icon className="w-4 h-4" />
    </div>
    <span className="font-bold text-[11px] uppercase tracking-widest leading-none">{label}</span>
  </button>
);

const BulletinViewModal = ({ bulletin, onClose }: { bulletin: DigitalBulletin | null, onClose: () => void }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  if (!bulletin) return null;
  const content = bulletin.jsonContent;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('bulletin-pdf-export');
    if (!element) return;
    
    setIsDownloading(true);
    const opt = {
      margin: 10,
      filename: `boletim-${bulletin.theme.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-2xl h-[92vh] sm:h-[85vh] bg-white rounded-t-[48px] sm:rounded-[48px] overflow-hidden flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-8 bg-primary text-white shrink-0">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                         <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary-light">Boletim Digital Elite</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <button 
                        onClick={handleDownloadPDF} 
                        disabled={isDownloading}
                        className="p-3 bg-white/10 rounded-2xl hover:bg-primary transition-all flex items-center space-x-2 disabled:opacity-50"
                        title="Baixar em PDF"
                      >
                        {isDownloading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Download className="w-5 h-5 text-white" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">PDF</span>
                     </button>
                     <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                        <X className="w-5 h-5 text-white" />
                     </button>
                   </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-black italic tracking-tighter leading-tight">{bulletin.theme}</h1>
                    <div className="flex items-center space-x-4 text-xs font-bold text-white/50 mt-2">
                      <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5" /> {bulletin.date}</span>
                      <span className="flex items-center bg-white/10 px-3 py-1 rounded-full text-white tracking-widest uppercase text-[8px] font-black">{bulletin.preacher}</span>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Edição Digital</p>
                     <p className="text-xs font-bold text-primary">Igreja Conectada</p>
                  </div>
                </div>
             </div>
          </div>

          {/* Bulletin Content for Screen & PDF */}
          <div className="flex-1 overflow-y-auto bg-slate-50 relative">
            <div id="bulletin-pdf-export" className="p-8 space-y-12 bg-white min-h-full">
              {/* Cover/Intro Quote */}
              <div className="text-center py-12 px-6 border-y-2 border-slate-50 relative overflow-hidden bg-slate-50/30 rounded-[40px]">
                 <div className="absolute top-4 left-10 text-6xl text-primary/10 font-serif leading-none">“</div>
                 <p className="text-xl md:text-2xl font-serif italic text-slate-800 leading-relaxed px-8 relative z-10 leading-snug">
                   {content.capa.versiculo_destaque}
                 </p>
              </div>

              {/* Message Summary */}
              <section className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-px flex-1 bg-slate-100" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Resumo da Mensagem</h2>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap first-letter:text-4xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-primary">
                  {content.resumo_pregacao}
                </div>
              </section>

              {/* Lessons Grid */}
              <section className="space-y-6">
                <h3 className="text-lg font-black italic tracking-tight flex items-center space-x-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <span>Lições Práticas</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {content.licoes.map((l: string, i: number) => (
                     <div key={i} className="flex flex-col p-6 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-card">
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-3">Ponto 0{i+1}</span>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed">{l}</p>
                     </div>
                   ))}
                </div>
              </section>

              {/* Bible Deep Dive */}
              <section className="space-y-6">
                <h3 className="text-lg font-black italic tracking-tight flex items-center space-x-3">
                   <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                   <span>Fundamentação Bíblica</span>
                </h3>
                <div className="space-y-4">
                   {content.versiculos_relacionados.map((v: any, i: number) => (
                     <div key={i} className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <BookOpen className="w-12 h-12 text-slate-900" />
                        </div>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">{v.referencia}</h4>
                        <p className="text-sm text-slate-600 italic leading-relaxed relative z-10">"{v.trecho}"</p>
                     </div>
                   ))}
                </div>
              </section>

              {/* Application Section */}
              <section className="bg-primary/5 p-10 rounded-[48px] border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Zap className="w-32 h-32 text-primary" />
                </div>
                <div className="relative z-10">
                   <h3 className="text-2xl font-black italic tracking-tighter mb-8 text-slate-800">Colocando em Prática</h3>
                   <div className="grid grid-cols-1 gap-3">
                      {content.aplicacao.map((a: string, i: number) => (
                        <div key={i} className="flex items-center space-x-4 bg-white p-5 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all shadow-sm">
                           <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                             <CheckCircle2 className="w-4 h-4" />
                           </div>
                           <span className="text-xs font-bold tracking-tight text-slate-600">{a}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </section>

              {/* Week Plan */}
              <section className="space-y-6">
                <h3 className="text-lg font-black italic tracking-tight flex items-center space-x-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <span>Jornada Espiritual da Semana</span>
                </h3>
                <div className="grid grid-cols-1 gap-2 bg-slate-50/50 p-2 rounded-[40px] border border-slate-100">
                   {content.semana_espiritual.map((d: any, i: number) => (
                     <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm hover:shadow-card transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center">
                              <span className="text-[10px] font-black text-primary">{i+1}</span>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{d.dia}</span>
                          </div>
                          <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                            <span className="mr-2 opacity-50">📖</span>
                            {d.versiculo}
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-widest shrink-0 mt-0.5">{d.foco}</div>
                          <p className="text-sm text-slate-600 font-bold leading-snug">{d.acao}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </section>

              {/* Final Conclusion */}
              <div className="text-center py-20 px-8 rounded-[56px] bg-gradient-to-br from-primary to-blue-600 text-white relative overflow-hidden shadow-xl shadow-primary/20">
                 <div className="absolute inset-0 bg-white/5 opacity-40" />
                 <div className="relative z-10 space-y-6">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                     <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                   </div>
                   <p className="text-2xl md:text-3xl font-black italic tracking-tighter leading-tight drop-shadow-lg">
                     "{content.frase_final}"
                   </p>
                   <div className="pt-8 opacity-60">
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Deus te abençoe</p>
                   </div>
                 </div>
              </div>
              
              {/* Print Only Info */}
              <div className="hidden print:block text-center pt-8 border-t border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Boletim Digital © Igreja Conectada • Gerado em {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

