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
  Trash2,
  Church,
  Zap,
  Copy,
  QrCode,
  HelpCircle,
  MessageSquare,
  Shield,
  X,
  Eye,
  EyeOff,
  Activity,
  TrendingUp,
  Droplets,
  Sprout,
  TreePine,
  Flame,
  Volume2
} from 'lucide-react';
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

// --- Types ---
type View = 'home' | 'ministries' | 'agenda' | 'financial' | 'spiritual' | 'more' | 'members' | 'missions' | 'chat' | 'devotionals' | 'admin' | 'prayers' | 'lives' | 'guests' | 'courses' | 'locations' | 'profile';

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
  ministry: string;
  status: 'Ativo' | 'Visitante' | 'Líder';
  email?: string;
}

interface DevotionalVideo {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  videoUrl: string;
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
  status: 'confirmed' | 'pending' | 'declined';
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
        whileHover={{ scale: 1.05, rotate: 0 }}
        whileTap={{ scale: 0.95 }}
        className={`${sizes[size]} bg-gradient-to-tr from-slate-900 via-indigo-950 to-primary rounded-[32%] rotate-3 shadow-[0_20px_50px_rgba(79,70,229,0.3)] flex items-center justify-center relative overflow-hidden transition-all duration-500 ring-1 ring-white/10`}
      >
        {/* Modern Glass Reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rotate-45 pointer-events-none" />
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="-rotate-3 flex items-center justify-center relative z-10"
        >
          <Church className={`${iconSizes[size]} text-white drop-shadow-2xl`} strokeWidth={1.5} />
          
          {/* Minimal Connection Nodes */}
          <div className="absolute inset-0 w-full h-full">
            {[0, 90, 180, 270].map((rot, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                className="absolute w-1 h-1 bg-white rounded-full"
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
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className={`absolute -top-2 -right-2 ${size === 'sm' ? 'w-5 h-5' : (size === 'md' ? 'w-10 h-10' : 'w-14 h-14')} bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/50 z-20`}
      >
        <Zap className={`${size === 'sm' ? 'w-2.5 h-2.5' : (size === 'md' ? 'w-5 h-5' : 'w-7 h-7')} text-primary fill-primary/10`} />
      </motion.div>
    </motion.div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-300 relative py-2 ${active ? 'text-primary scale-110' : 'text-slate-400'}`}
  >
    <div className="relative flex items-center justify-center">
      {active && <Icon className="w-6 h-6 fill-current opacity-20 absolute animate-pulse translate-y-[-1px]" />}
      <Icon className={`w-6 h-6 relative z-10 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
    </div>
    <span className="text-[10px] font-bold tracking-tight uppercase">{label}</span>
    {active && <motion.div layoutId="nav-glow" className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.6)]" />}
  </button>
);

const SectionHeader = ({ title, action, onAction, onAdd }: { title: string, action?: string, onAction?: () => void, onAdd?: () => void }) => (
  <div className="flex items-center justify-between px-6 mb-8 pt-6">
    <div className="flex items-center space-x-3">
      <div className="h-6 w-1 w-1 bg-primary rounded-full" />
      <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">{title}</h2>
    </div>
    <div className="flex items-center space-x-2">
      {onAdd && (
        <button 
          onClick={onAdd}
          className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg ring-4 ring-slate-100 hover:bg-primary transition-all active:scale-90"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
      {action && onAction && (
        <button 
          onClick={onAction} 
          className="px-6 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
        >
          {action}
        </button>
      )}
    </div>
  </div>
);

const Banner = ({ onAction, title, reference }: { onAction?: () => void, title: string, reference: string }) => (
  <div className="mx-4 mb-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
    <div className="relative z-10 flex flex-col space-y-6">
      <div className="w-16 h-1.5 bg-white/20 rounded-full mb-2" />
      <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight italic">"{title}"</h1>
      <div className="flex items-center space-x-3">
        <div className="h-[1px] w-8 bg-white/40" />
        <p className="text-xs font-black uppercase tracking-[0.4em] opacity-60">{reference}</p>
      </div>
      <div className="pt-6">
        <button 
          onClick={onAction}
          className="bg-white text-indigo-600 px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10 active:scale-95"
        >
          Explorar Devocional →
        </button>
      </div>
    </div>
    <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
  </div>
);

const AnnouncementCard = ({ id, title, tag, date, isAdmin, onDelete, onEdit, onClick }: { id?: string, title: string, tag: string, date: string, isAdmin?: boolean, onDelete?: (id: string) => void, onEdit?: (id: string) => void, onClick?: () => void }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    onClick={onClick}
    className="flex flex-col space-y-3 p-8 bg-white rounded-[40px] border border-slate-100/80 hover:border-primary/30 transition-all group cursor-pointer shadow-xl shadow-slate-200/40 relative active:scale-[0.98]"
  >
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary bg-primary/5 px-3 py-1.5 rounded-full ring-1 ring-primary/10">{tag}</span>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{date}</span>
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
    <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors text-slate-900 tracking-tight italic">{title}</h3>
    <div className="flex items-center space-x-2 pt-3 border-t border-slate-50">
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-[48px] p-12 shadow-2xl shadow-indigo-200/50 border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          
          <Logo size="md" className="mx-auto mb-10" glow />
          
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Igreja Conectada</h1>
          <p className="text-sm font-medium text-slate-400 mb-10 leading-relaxed">Sua jornada de fé e gestão <br/> ministerial em um só lugar.</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-slate-900 text-white py-4.5 rounded-2xl flex items-center justify-center space-x-3 shadow-xl transition-all hover:scale-105 active:scale-95 group"
          >
            <LogIn className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Entrar com Google</span>
          </button>
          
          <p className="mt-8 text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">Eco-Sistema Ministerial v1.1.0</p>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [splash, setSplash] = useState(true);
  const [activeView, setActiveView] = useState<View>('home');
  const [confirmedScales, setConfirmedScales] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'Todos' | 'Ativo' | 'Visitante' | 'Líder'>('Todos');
  const [ministryFilter, setMinistryFilter] = useState('Todos');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '', ministry: '', status: 'Ativo' as any });
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'Dízimo' | 'Oferta' | 'Missões'>('Dízimo');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [selectedBulletin, setSelectedBulletin] = useState<DigitalBulletin | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showDevotionalForm, setShowDevotionalForm] = useState(false);
  const [newDevotional, setNewDevotional] = useState({ title: '', videoUrl: '', description: '' });
  const [userPrayedFor, setUserPrayedFor] = useState<string[]>([]);
  const [currentScaleIndex, setCurrentScaleIndex] = useState(0);
  const [activeHomeTab, setActiveHomeTab] = useState<'contributions' | 'benevolence'>('contributions');

  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [newPrayer, setNewPrayer] = useState({ content: '' });
  const [showAgendaForm, setShowAgendaForm] = useState(false);
  const [newAgendaItem, setNewAgendaItem] = useState({ title: '', time: '', date: '', description: '' });
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', tag: 'Aviso' });
  const [newScale, setNewScale] = useState({ ministry: 'Louvor', role: '', date: '' });
  const [completedSteps, setCompletedSteps] = useState<string[]>(['Novo na Igreja', 'Batismo']);

  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [editingAgendaItem, setEditingAgendaItem] = useState<any | null>(null);
  const [editingScale, setEditingScale] = useState<any | null>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<string | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<any | null>(null);
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
  const [isAdminSetupMode, setIsAdminSetupMode] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminSecretState, setAdminSecretState] = useState("pastor2026");
  const [lastAnnouncementId, setLastAnnouncementId] = useState<string | null>(null);

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
  const membersRef = collection(db, 'members');
  const [membersSnap] = useCollection(
    user ? query(membersRef, orderBy('name', 'asc')) : null
  );
  
  const announcementsRef = collection(db, 'announcements');
  const [announcementsSnap] = useCollection(
    query(announcementsRef, orderBy('createdAt', 'desc'), limit(10))
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
    query(agendaRef, orderBy('date', 'asc'))
  );

  const logsRef = collection(db, 'activityLogs');
  const [activityLogs] = useCollectionData(query(logsRef, orderBy('createdAt', 'desc'), limit(10)));

  const financialRef = collection(db, 'financial');
  const [financialSnap] = useCollection(
    user ? query(financialRef, orderBy('date', 'desc')) : null
  );

  const missionRef = doc(db, 'missions', 'missao-2026');
  const [campaignSnap] = useCollection(
    collection(db, 'missions')
  );

  const coursesRef = collection(db, 'courses');
  const [coursesSnap] = useCollection(query(coursesRef, orderBy('createdAt', 'desc')));

  const enrollmentsRef = collection(db, 'enrollments');
  const [enrollmentsSnap] = useCollection(user ? query(enrollmentsRef, where('userId', '==', user.uid)) : null);

  const bulletinsRef = collection(db, 'bulletins');
  const [bulletinsSnap] = useCollection(query(bulletinsRef, orderBy('createdAt', 'desc'), limit(1)));

  const userProfileRef = user ? doc(db, 'userProfiles', user.uid) : null;
  
  // Derived Data
  const members = membersSnap?.docs.map(d => ({ id: d.id, ...d.data() } as Member)) || [];
  const allScales = scalesSnap?.docs.map(d => ({ id: d.id, ...d.data() } as Scale)) || [];
  const announcements = announcementsSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const prayers = prayersSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const agendaItems = agendaSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const financialData = financialSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const campaignData = campaignSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
  const devotionals = devotionalsSnap?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
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

  // Persist local user data
  useEffect(() => {
    const fetchConfig = async () => {
      const configSnap = await getDoc(doc(db, 'config', 'church'));
      if (configSnap.exists()) {
        const data = configSnap.data();
        if (data.pixKey) setPixKey(data.pixKey);
        if (data.verseTitle) setVerseTitle(data.verseTitle);
        if (data.verseRef) setVerseRef(data.verseRef);
        if (data.privacyMode) setPrivacyMode(data.privacyMode);
        if (data.adminSecret) setAdminSecretState(data.adminSecret);
      }
    };
    if (user) fetchConfig();
    
    // Restore admin unlock state from session
    const isUnlocked = localStorage.getItem('admin_unlocked');
    if (isUnlocked === 'true') {
      setIsAdminUnlocked(true);
    }
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
        if (snap.exists()) {
          const data = snap.data();
          if (data.completedSteps) setCompletedSteps(data.completedSteps);
          if (data.confirmedScales) setConfirmedScales(data.confirmedScales);
        } else {
          await setDoc(userProfileRef, { 
            email: user.email, 
            displayName: user.displayName,
            completedSteps: ['Novo na Igreja', 'Batismo'],
            confirmedScales: []
          });
        }
      };
      syncProfile();
    }
  }, [user]);

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
        avatar: `https://picsum.photos/seed/${newMember.name}/100`,
        createdAt: Timestamp.now(),
      });
      await addActivityLog("Membro Cadastrado", `Novo membro: ${newMember.name}`);
      setShowMemberForm(false);
      setNewMember({ name: '', role: '', ministry: '', status: 'Ativo' });
    } catch (err) {
      console.error("Erro ao salvar membro:", err);
    }
  };

  const handleConfirmScale = async (id: string, currentStatus: string) => {
    if (!user) return;
    const scaleRef = doc(db, 'scales', id);
    const newStatus = currentStatus === 'confirmed' ? 'pending' : 'confirmed';
    try {
      await updateDoc(scaleRef, { status: newStatus });
      
      const newConfirmed = newStatus === 'confirmed' 
        ? [...confirmedScales, id] 
        : confirmedScales.filter(s => s !== id);
      
      setConfirmedScales(newConfirmed);
      if (userProfileRef) {
        await updateDoc(userProfileRef, { confirmedScales: newConfirmed });
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
      await addDoc(collection(db, 'devotionals'), {
        title: newDevotional.title,
        videoUrl: newDevotional.videoUrl,
        description: newDevotional.description,
        authorName: user.displayName,
        authorId: user.uid,
        createdAt: Timestamp.now()
      });
      setShowDevotionalForm(false);
      setNewDevotional({ title: '', videoUrl: '', description: '' });
    } catch (err) {
      console.error("Erro ao salvar devocional:", err);
    }
  };

  const handleCreatePrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'prayers'), {
        content: newPrayer.content,
        authorName: user.displayName,
        authorId: user.uid,
        prayerCount: 0,
        createdAt: Timestamp.now()
      });
      setShowPrayerForm(false);
      setNewPrayer({ content: '' });
    } catch (err) {
      console.error("Erro ao publicar oração:", err);
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
      setNewAnnouncement({ title: '', content: '', tag: 'Aviso' });
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
      await addActivityLog("Escala Criada", `${newScale.ministry}: ${newScale.role}`);
      setNewScale({ ministry: 'Louvor', role: '', date: '' });
      alert("Escala criada com sucesso!");
    } catch (err) {
      console.error("Erro ao criar escala:", err);
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
        status: editingMember.status
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
        content: editingAnnouncement.content
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
        date: editingScale.date
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const promptText = `
        Você é um assistente inteligente especializado em conteúdo cristão, teologia básica e organização de cultos.
        Sua função é gerar automaticamente um BOLETIM DIGITAL DE CULTO para um aplicativo mobile.
        O boletim deve ser organizado, claro, envolvente e espiritualmente edificante.
        Nome do boletim: "Boletim Digital"

        ENTRADAS:
        - Tema do culto: ${bulletinInputs.tema}
        - Nome do pregador: ${bulletinInputs.pregador}
        - Texto bíblico base: ${bulletinInputs.texto_biblico}
        - Transcrição ou resumo da pregação: ${bulletinInputs.pregacao_texto}
        - Data do culto: ${bulletinInputs.data}

        SAÍDA ESPERADA (FORMATO ESTRUTURADO):
        JSON estruturado rigorosamente com os campos: capa(nome, tema, data, versiculo_destaque), resumo_pregacao, licoes(array), versiculos_relacionados(array de objetos com referencia e trecho), aplicacao(array), semana_espiritual(array de objetos com dia, foco, versiculo, acao), frase_final.
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

      const result = JSON.parse(response.text || '{}');

      await addDoc(collection(db, 'bulletins'), {
        theme: bulletinInputs.tema,
        preacher: bulletinInputs.pregador,
        date: bulletinInputs.data || new Date().toLocaleDateString('pt-BR'),
        jsonContent: result,
        createdAt: Timestamp.now()
      });

      await addActivityLog("Boletim Gerado", `Novo boletim: ${bulletinInputs.tema}`);
      setShowBulletinForm(false);
      setBulletinInputs({ tema: '', pregador: '', texto_biblico: '', pregacao_texto: '', data: new Date().toLocaleDateString('pt-BR') });
      alert("Boletim Digital gerado com tecnologia IA e publicado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar boletim:", err);
      alert("Erro ao falar com a IA. Tente novamente em instantes.");
    } finally {
      setIsGeneratingBulletin(false);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0c10] overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
        <Logo size="lg" glow />
        <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="mt-12 text-center"
        >
          <h2 className="text-xl font-black text-white/90 tracking-[0.3em] uppercase italic">Igreja Conectada</h2>
          <div className="mt-4 w-48 h-1 bg-white/10 rounded-full mx-auto relative overflow-hidden">
             <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: '100%' }}
               transition={{ duration: 0.5, ease: "easeInOut", repeat: Infinity }}
               className="absolute inset-0 bg-primary shadow-[0_0_10px_rgba(79,70,229,0.8)]"
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
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="pb-24 max-w-2xl mx-auto"
          >
            <div className="px-6 pt-10 pb-6">
              <div className="flex items-center space-x-4 mb-8 bg-gradient-to-r from-slate-900 to-slate-800 p-3 pr-6 rounded-[24px] w-fit border border-slate-700/50 shadow-xl shadow-slate-200/50 group">
                <div className="w-12 h-12 bg-primary rounded-[18px] flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-500">
                  <Church className="w-7 h-7 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase tracking-[0.4em] text-white italic drop-shadow-sm">Igreja Conectada</span>
                  <div className="w-full h-0.5 bg-primary/30 mt-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Bom dia, {user?.displayName?.split(' ')[0] || 'Irmão'}</p>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mt-1">Graça e Paz</h1>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleSignOut}
                    className="p-3 bg-white border border-slate-100 rounded-2xl shadow-card text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white z-10 animate-bounce" />
                    <button 
                      onClick={() => {
                        playNotificationSound();
                        alert('Você tem novas atualizações da comunidade!');
                      }}
                      className="p-3 bg-white border border-slate-100 rounded-2xl shadow-card text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      <Bell className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Banner 
              title={verseTitle} 
              reference={verseRef} 
              onAction={() => setActiveView('devotionals')} 
            />

            <div className="px-4 mb-12">
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
                        className="w-full bg-slate-900 text-white py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all hover:bg-primary flex items-center justify-center space-x-3"
                      >
                        <Wallet className="w-5 h-5" />
                        <span>Copiar Chave Pix</span>
                      </button>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center shadow-lg shadow-slate-100/50 group/qr relative group transition-all hover:border-primary/20">
                       <div className="w-32 h-32 bg-slate-50 rounded-3xl mb-4 flex items-center justify-center relative overflow-hidden ring-8 ring-slate-50/50">
                          <QrCode className="w-16 h-16 text-slate-900 opacity-80" />
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-10 italic">Escanear</span>
                          </div>
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed px-4">Aponte sua câmera para o <br/> QR Code e doe agora</p>
                       <div className="absolute -top-3 -right-3 w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center shadow-sm">
                          <Plus className="w-5 h-5 text-indigo-600 rotate-45" />
                       </div>
                    </div>
                  </div>
                  
                  <div className="mt-10 flex items-center justify-center">
                    <button 
                      onClick={() => setActiveView('financial')}
                      className="group flex items-center space-x-3 text-primary text-[11px] font-black uppercase tracking-[0.3em] hover:opacity-80 transition-all"
                    >
                      <span>Relatório de Transparência</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {bulletins.length > 0 && (
              <div className="px-4 mb-12">
                <div onClick={() => setSelectedBulletin(bulletins[0])} className="bg-slate-900 border border-slate-800 rounded-[48px] p-8 shadow-2xl shadow-indigo-100 cursor-pointer overflow-hidden relative group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                      <FileText className="w-24 h-24 text-white" />
                   </div>
                   <div className="relative z-10">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Boletim Digital de Culto</p>
                          <h3 className="text-xl font-black text-white italic tracking-tight">{bulletins[0].theme}</h3>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-6">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Pregador</span>
                               <span className="text-xs font-bold text-white">{bulletins[0].preacher}</span>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Data</span>
                               <span className="text-xs font-bold text-white">{bulletins[0].date}</span>
                            </div>
                         </div>
                         <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                           Abrir Boletim
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            )}

            <SectionHeader 
              title="Avisos Importantes" 
              action="Ver Todos" 
              onAction={() => setActiveView('more')}
              onAdd={isAdmin ? () => { setShowAnnouncementForm(true); setActiveView('more'); } : undefined}
            />
            <div className="px-4 space-y-4">
              {announcements && announcements.length > 0 ? (
                announcements.slice(0, 3).map((a: any) => (
                  <div key={a.id}>
                    <AnnouncementCard 
                      id={a.id}
                      title={a.title} 
                      tag={a.tag} 
                      date={a.date} 
                      isAdmin={isAdmin}
                      onDelete={(id) => handleDeleteItem('announcements', id)}
                      onEdit={(id) => setEditingAnnouncement(a)}
                      onClick={() => setViewingAnnouncement(a)}
                    />
                  </div>
                ))
              ) : (
                <>
                  <AnnouncementCard 
                    title="Conferência de Jovens: Despertar 2026" 
                    tag="Eventos" 
                    date="25 Abr" 
                    onClick={() => setViewingAnnouncement({
                      title: "Conferência de Jovens: Despertar 2026",
                      tag: "Eventos",
                      date: "25 Abr",
                      content: "Uma conferência dedicada ao despertamento espiritual da nossa juventude. Teremos convidados especiais e muita adoração. Não perca!"
                    })}
                  />
                  <AnnouncementCard 
                    title="Novo horário do culto de oração (Quarta-feira)" 
                    tag="Mudança" 
                    date="Ontem" 
                    onClick={() => setViewingAnnouncement({
                      title: "Novo horário do culto de oração (Quarta-feira)",
                      tag: "Mudança",
                      date: "Ontem",
                      content: "A partir desta semana, nosso culto de oração das quartas-feiras começará às 19:30 em vez das 20:00. Esperamos todos vocês para este momento de clamor."
                    })}
                  />
                </>
              )}
            </div>

            <SectionHeader 
              title="Minha Agenda" 
              action="Ver Detalhes"
              onAction={() => setActiveView('ministries')}
            />
            <div className="px-4">
              <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform" />
                <div className="relative z-10">
                  {allScales.length > 0 ? (
                    <div className="relative">
                      <AnimatePresence mode="wait">
                        {allScales.map((s, idx) => {
                          if (idx !== (currentScaleIndex % (allScales.length || 1))) return null;
                          const isConfirmed = confirmedScales.includes(s.id);
                          return (
                            <motion.div 
                              key={s.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 1.05 }}
                              transition={{ duration: 0.5, ease: "anticipate" }}
                            >
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                  <div className={`w-12 h-12 ${isConfirmed ? 'bg-primary' : 'bg-slate-800'} rounded-2xl flex items-center justify-center shadow-lg shadow-primary/40`}>
                                    <Music className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                      {isConfirmed ? 'Próximo Serviço' : 'Escala Pendente'}
                                    </p>
                                    <h3 className="text-xl font-black italic">{s.ministry}</h3>
                                  </div>
                                </div>
                                {isAdmin && (
                                  <button 
                                    onClick={() => setEditingScale(s)}
                                    className="p-2 text-white/40 hover:text-white transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center space-x-2 text-white/80">
                                  <Calendar className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-bold">{s.date}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-primary font-black uppercase">
                                  <span className="text-[10px] tracking-widest">{s.role}</span>
                                </div>
                              </div>
                            <button 
                              onClick={() => handleConfirmScale(s.id, s.status)}
                              className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                isConfirmed 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                : 'bg-primary text-white hover:bg-opacity-90 shadow-xl shadow-primary/20 active:scale-[0.98]'
                              }`}
                            >
                              {isConfirmed ? '✓ Presença Confirmada' : 'Confirmar Disponibilidade'}
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    {allScales.length > 1 && (
                      <div className="flex justify-center space-x-1.5 mt-8">
                        {allScales.map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1 rounded-full transition-all duration-300 ${i === (currentScaleIndex % allScales.length) ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'}`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  ) : (
                    <div className="py-6 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/10 border-dashed">
                        <Calendar className="w-6 h-6 text-white/20" />
                      </div>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Sem escalas em breve</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'ministries':
        if (selectedMinistry) {
          const ministryScales = (allScales as any[] || []).filter(s => s.ministry === selectedMinistry);
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
              <div className="space-y-3">
                {ministryScales.length > 0 ? (
                  ministryScales.map(s => (
                    <div key={s.id} className="p-5 bg-white rounded-[24px] border border-slate-100 flex items-start justify-between shadow-card hover:border-primary/20 transition-all">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">{s.ministry}</p>
                        <h4 className="text-lg font-bold text-slate-800">{s.role}</h4>
                        <div className="flex items-center space-x-3 mt-2 text-xs font-medium text-slate-400">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 opacity-60" /> {s.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isAdmin && (
                          <div className="flex items-center space-x-1 mr-2 border-r border-slate-100 pr-2">
                             <button 
                               onClick={() => setEditingScale(s)}
                               className="p-2 text-slate-300 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                             >
                               <Pencil className="w-3.5 h-3.5" />
                             </button>
                             <button 
                               onClick={() => handleDeleteItem('scales', s.id)}
                               className="p-2 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        )}
                        <button 
                          onClick={() => handleConfirmScale(s.id, s.status)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          s.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {s.status === 'confirmed' ? 'OK' : 'CONFIRMAR'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 opacity-40 bg-white rounded-[32px] border border-slate-100 border-dashed">
                    <Users className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhuma escala encontrada</p>
                  </div>
                )}
              </div>

              <SectionHeader title="Membros do Departamento" />
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
              {['Louvor', 'Mídia', 'Recepção', 'Crianças', 'Apoio', 'Corpo Diaconal'].map((m) => (
                <div 
                  key={m} 
                  onClick={() => setSelectedMinistry(m)}
                  className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 group cursor-pointer hover:shadow-card hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Users className="w-6 h-6 text-slate-400 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{m}</h3>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.15em]">
                        {(allScales as any[] || []).filter(s => s.ministry === m).length} Escalas Ativas
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              ))}
            </div>

            <SectionHeader title="Minhas Escalas" />
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
                      {isAdmin && (
                        <div className="flex items-center space-x-1 mr-2 border-r border-slate-100 pr-2">
                           <button 
                             onClick={() => setEditingScale(s)}
                             className="p-2 text-slate-300 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                           >
                             <Pencil className="w-3.5 h-3.5" />
                           </button>
                           <button 
                             onClick={() => handleDeleteItem('scales', s.id)}
                             className="p-2 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      )}
                      <button 
                        onClick={() => handleConfirmScale(s.id, s.status)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      s.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {s.status === 'confirmed' ? 'OK' : 'CONFIRMAR'}
                    </button>
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-12 opacity-50 bg-white rounded-3xl border border-slate-50 border-dashed">
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhuma escala pendente</p>
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
            <div className="flex items-center space-x-3 mb-8 bg-slate-900/5 p-2 rounded-2xl w-fit border border-slate-100">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 italic">Finanças & Privacidade</span>
            </div>

            {/* Fintech Card Header */}
            <div className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden mb-12 shadow-2xl shadow-indigo-200">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 mb-2">Total Consolidado (Mês)</p>
                    <h2 className="text-5xl font-black tracking-tighter italic">R$ {totalArrecadado.toLocaleString()}</h2>
                  </div>
                  <div className="w-14 h-14 bg-white/10 rounded-3xl backdrop-blur-xl flex items-center justify-center border border-white/10">
                     <TrendingUp className="w-7 h-7 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Meta Mensal</p>
                       <p className="text-xl font-bold">R$ {progressTarget.toLocaleString()}</p>
                     </div>
                     <span className="text-sm font-black italic">{Math.round((totalArrecadado / progressTarget) * 100)}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalArrecadado / progressTarget) * 100, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-indigo-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-12">
               <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">{totalOfertasCount}</h4>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Contribuições</p>
               </div>
               <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">R$ {totalOfertasCount > 0 ? (totalArrecadado / totalOfertasCount).toFixed(0) : 0}</h4>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Média Geral</p>
               </div>
            </div>

            {/* Contribution Actions */}
            <div className="grid grid-cols-2 gap-4 mb-12">
              <button 
                onClick={() => { setTransactionType('Dízimo'); setShowTransactionForm(true); }}
                className="bg-primary text-white p-8 rounded-[40px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center group"
              >
                <Plus className="w-8 h-8 mx-auto mb-4 group-hover:rotate-90 transition-transform" />
                <h3 className="font-black italic text-xl">Dízimo</h3>
                <p className="text-[10px] font-black uppercase opacity-60 mt-1">Fidelidade</p>
              </button>
              <button 
                onClick={() => { setTransactionType('Oferta'); setShowTransactionForm(true); }}
                className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all text-center group"
              >
                <Heart className="w-8 h-8 mx-auto mb-4 group-hover:scale-125 transition-transform" />
                <h3 className="font-black italic text-xl">Oferta</h3>
                <p className="text-[10px] font-black uppercase opacity-60 mt-1">Generosidade</p>
              </button>
            </div>

            {/* Double Tab System */}
            <div className="bg-white rounded-[48px] border border-slate-100 shadow-lg overflow-hidden">
               <div className="flex p-2 bg-slate-50">
                  <button 
                    onClick={() => setActiveHomeTab('contributions')}
                    className={`flex-1 py-4 rounded-[32px] text-[10px] font-black uppercase tracking-widest transition-all ${activeHomeTab === 'contributions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Feed Público (Anônimo)
                  </button>
                  <button 
                    onClick={() => setActiveHomeTab('benevolence')}
                    className={`flex-1 py-4 rounded-[32px] text-[10px] font-black uppercase tracking-widest transition-all ${activeHomeTab === 'benevolence' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Meu Histórico Privado
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
            {isAdmin && isAdminUnlocked && privacyMode === 'leadership' && (
              <div className="mt-12 space-y-6">
                 <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-black italic">Gestão Admin de Fluxo</h3>
                 </div>
                 <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    {(financialData as any[]).map((t, idx) => (
                      <div key={idx} className="p-6 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-all">
                         <div className="flex items-center space-x-4">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.userId}`} className="w-10 h-10 rounded-xl bg-slate-100" alt="avatar" />
                            <div>
                               <p className="text-sm font-bold text-slate-900">{t.userName}</p>
                               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.type} • {t.date?.toDate().toLocaleDateString()}</p>
                            </div>
                         </div>
                         <p className="text-sm font-black text-slate-900">R$ {t.amount.toLocaleString()}</p>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Admin Anonymity Notice */}
            {isAdmin && privacyMode === 'anonymous' && (
              <div className="mt-12 p-8 bg-emerald-50 rounded-[40px] border border-emerald-100 text-center">
                 <Shield className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                 <h4 className="text-lg font-black text-emerald-900 italic">Sigilo Absoluto Ativo</h4>
                 <p className="text-xs text-emerald-700 font-medium leading-relaxed mt-2 p-4">
                    Neste modo, nem mesmo administradores podem acessar a identidade dos ofertantes vinculada aos valores. O sistema garante privacidade total para a paz da congregação.
                 </p>
                 <button 
                  onClick={handleTogglePrivacyMode}
                  className="mt-6 px-8 py-3 bg-white text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
                 >
                   Alternar para Modo Liderança
                 </button>
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

              <div className="p-8 bg-slate-900 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full translate-y-1/2 translate-x-1/2 blur-[80px]" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <h3 className="text-2xl font-black">Dash Liderança</h3>
                  <div className="bg-primary/20 p-3 rounded-2xl backdrop-blur-sm px-4">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 relative z-10 mb-8">
                  <div className="bg-white/5 p-5 rounded-[28px] border border-white/5 text-center">
                    <p className="text-3xl font-black">156</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold opacity-50 mt-1">Membros</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-[28px] border border-white/5 text-center">
                    <p className="text-3xl font-black">12</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold opacity-50 mt-1">Visitantes</p>
                  </div>
                <div className="bg-white/5 p-5 rounded-[28px] border border-white/5 text-center">
                    <p className="text-3xl font-black">92%</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold opacity-50 mt-1">Presença</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveView('admin')}
                  className="w-full py-4.5 rounded-[24px] bg-white text-slate-900 text-xs font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Painel Administrativo
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'agenda':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <SectionHeader 
              title="Nossa Agenda" 
              onAdd={isAdmin ? () => { setShowAgendaForm(true); setActiveView('more'); } : undefined}
            />
            
            <div className="flex flex-nowrap overflow-x-auto pb-4 scrollbar-hide mb-8">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`inline-flex flex-col items-center justify-center w-16 h-24 rounded-[28px] mr-3 transition-all ${i === 0 ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-105' : 'bg-white border border-slate-100 text-slate-400 shadow-sm'}`}>
                  <span className="text-[9px] uppercase font-black mb-1 opacity-70">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i]}</span>
                  <span className="text-2xl font-black">{19 + i}</span>
                  {i === 2 && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1" />}
                </div>
              ))}
            </div>
            
            <div className="px-4 space-y-6">
              <div className="relative pl-8 border-l-2 border-slate-100 space-y-10">
                {agendaItems && (agendaItems as any[]).length > 0 ? (
                  (agendaItems as any[]).map((e, idx) => (
                    <div key={idx} className="relative group">
                      <div className={`absolute -left-[41px] w-5 h-5 rounded-full border-4 border-background shadow-sm mt-1 flex items-center justify-center ${e.isFeatured ? 'bg-primary' : 'bg-slate-200'}`} />
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{e.time}</p>
                      <div className={`p-6 rounded-[32px] transition-all hover:shadow-card relative ${e.isFeatured ? 'bg-white border-2 border-primary/10 shadow-xl shadow-primary/5' : 'bg-white border border-slate-100 shadow-sm'}`}>
                        {isAdmin && (
                          <div className="absolute top-4 right-4 flex items-center space-x-1">
                            <button 
                               onClick={() => setEditingAgendaItem(e)}
                               className="p-2 text-slate-300 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                               onClick={() => handleDeleteItem('agenda', e.id)}
                               className="p-2 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${e.type === 'Educação' ? 'text-indigo-600 bg-indigo-50' : e.type === 'Exclusivo' ? 'text-orange-600 bg-orange-50' : 'text-primary bg-primary-light'} px-3 py-1 rounded-full`}>{e.type || 'Evento'}</span>
                        <h4 className="text-xl font-bold mt-3 leading-tight text-slate-800">{e.title}</h4>
                        <div className="flex items-center text-xs font-medium text-slate-400 mt-2">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                          <span>{e.location || e.description}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-30">
                    <Calendar className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum evento agendado</p>
                  </div>
                )}
              </div>
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
                  <form onSubmit={handleCreatePrayer} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-card space-y-4">
                    <textarea 
                      required
                      placeholder="Qual o seu pedido de oração?"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 min-h-[120px]"
                      value={newPrayer.content}
                      onChange={e => setNewPrayer({ content: e.target.value })}
                    />
                    <button type="submit" className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">Publicar Pedido</button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              {prayers && (prayers as any[]).map((prayer: any) => (
                <motion.div key={prayer.id} layout className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm group relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-primary font-black text-xs">
                        {prayer.authorName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{prayer.authorName}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{prayer.createdAt?.toDate().toLocaleDateString()}</p>
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
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
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
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
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
                    className="w-full py-5 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-all hover:bg-primary"
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
              </div>
            </div>
            
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
                onClick={() => setShowMemberForm(true)}
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
                className="p-8 bg-slate-900 border border-slate-900 rounded-[40px] text-left hover:shadow-2xl hover:shadow-primary/20 transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-16 h-16 text-white" />
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary transition-all">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white leading-tight">Boletim Digital</h4>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Gerador via IA</p>
              </button>
            </div>

            <AnimatePresence>
              {showBulletinForm && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-12">
                   <form onSubmit={handleGenerateBulletin} className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl space-y-4 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold">Gerador de Boletim IA</h3>
                          <p className="text-xs text-slate-400 mt-1">Preencha os dados do culto para gerar o boletim</p>
                        </div>
                        <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tema do Culto</label>
                          <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.tema} onChange={e => setBulletinInputs({...bulletinInputs, tema: e.target.value})} placeholder="Ex: O Poder da Oração" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Pregador</label>
                          <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.pregador} onChange={e => setBulletinInputs({...bulletinInputs, pregador: e.target.value})} placeholder="Ex: Pr. Gilmar Brito" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Texto Bíblico Base</label>
                          <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.texto_biblico} onChange={e => setBulletinInputs({...bulletinInputs, texto_biblico: e.target.value})} placeholder="Ex: Filipenses 4:6-7" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data</label>
                          <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.data} onChange={e => setBulletinInputs({...bulletinInputs, data: e.target.value})} />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Resumo ou Transcrição da Pregação</label>
                        <textarea required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs font-bold min-h-[150px] focus:ring-2 focus:ring-primary outline-none" value={bulletinInputs.pregacao_texto} onChange={e => setBulletinInputs({...bulletinInputs, pregacao_texto: e.target.value})} placeholder="Cole aqui as notas ou a transcrição da mensagem..." />
                      </div>

                      <button 
                        disabled={isGeneratingBulletin}
                        type="submit" 
                        className="w-full py-5 bg-primary text-white text-[12px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/30 flex items-center justify-center space-x-3 disabled:opacity-50"
                      >
                        {isGeneratingBulletin ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Gerando Boletim...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-yellow-400" />
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
                <button type="submit" className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-primary transition-all mt-2">Gerar Nova Escala</button>
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
                    <div className="aspect-video bg-slate-900 relative">
                       <div className="absolute inset-0 flex items-center justify-center">
                         <Video className="w-16 h-16 text-white opacity-20" />
                       </div>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                         <a 
                           href={dev.videoUrl} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                         >
                           Assistir Agora
                         </a>
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
                       <p className="text-sm text-slate-400 font-medium leading-relaxed">{dev.description}</p>
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
                          <input 
                            required
                            type="text" 
                            placeholder="Ex: Louvor" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                            value={newMember.ministry}
                            onChange={e => setNewMember({...newMember, ministry: e.target.value})}
                          />
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
              {['Todos', 'Louvor', 'Mídia', 'Recepção', 'Crianças', 'Apoio'].map((m) => (
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
              <h1 className="text-3xl font-black text-slate-900">Missões</h1>
            </div>

            <div className="bg-primary p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden mb-12">
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
                 <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-70 mb-2">Alvo Geral da Igreja</p>
                 <div className="flex items-baseline space-x-2 mb-6">
                   <h2 className="text-5xl font-black">R$ {totalCollected.toLocaleString()}</h2>
                   <span className="text-sm font-bold opacity-60">/ R$ {currentCampaign.totalGoal.toLocaleString()}</span>
                 </div>
                 <div className="w-full h-4 bg-white/20 rounded-full mb-2">
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
              <h1 className="text-5xl font-black text-primary tracking-tighter italic">Explorar</h1>
            </div>
            
            <div className="space-y-3">
              {[
                { icon: Users, label: 'Lista de Membros', info: 'Busque e filtre contatos', view: 'members' },
                { icon: Video, label: 'Vídeos Devocionais', info: 'Semeando a palavra', view: 'devotionals' },
                { icon: Heart, label: 'Mural de Oração', info: 'Interceda por seus irmãos', view: 'prayers' },
                { icon: Heart, label: 'Dashboard de Missões', info: 'Alvos mundiais e estaduais', view: 'missions' },
                { icon: Video, label: 'Pregações & Lives', info: 'Assista aos últimos cultos', view: 'lives' },
                { icon: UserPlus, label: 'Integrar Convidados', info: 'Novos visitantes', view: 'guests' },
                { icon: FileText, label: 'Cursos & trilhas', info: 'Crescimento cristão', view: 'courses' },
                { icon: MapPin, label: 'Nossas Sedes', info: 'Encontre uma igreja próxima', view: 'locations' },
                { icon: Settings, label: 'Painel Admin', info: 'Exclusivo para líderes', view: 'admin' },
                { icon: UserPlus, label: 'Configurações', info: 'Perfil e notificações', view: 'profile' }
              ].map((item, idx) => (
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

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('more')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-slate-900">Cursos & Trilhas</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayCourses.map((c: any) => {
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
             <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('more')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-slate-900">Nossas Sedes</h1>
            </div>
            <div className="space-y-4">
              {['Sede Central', 'Congregação Norte', 'Congregação Sul'].map((s, i) => (
                <div key={i} className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm flex items-start space-x-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800">{s}</h4>
                    <p className="text-sm text-slate-500 mt-1">Rua Benjamin Constant, nº {100 + i*50}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-4">Ver no Mapa</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('more')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-slate-900">Configurações e Perfil</h1>
            </div>
            
            <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl mb-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
               <div className="flex flex-col items-center text-center relative z-10">
                 <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-xl mb-6 ring-1 ring-slate-100">
                   <img src={user?.photoURL || "https://picsum.photos/seed/person/200"} alt="Avatar" referrerPolicy="no-referrer" />
                 </div>
                 <h2 className="text-3xl font-black text-slate-800 italic">{user?.displayName || 'Membro'}</h2>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{user?.email}</p>
                 <div className="mt-4 flex items-center space-x-2">
                   <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                     {isAdmin ? 'Líder / Admin' : 'Membro Digital'}
                   </span>
                 </div>
               </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: Bell, label: 'Notificações', info: 'Gerenciar alertas push' },
                { icon: Heart, label: 'Minhas Doações', info: 'Histórico financeiro' },
                { icon: Users, label: 'Dados Cadastrais', info: 'Atualizar informações' },
                { icon: Settings, label: 'Tema & Estilo', info: 'Personalizar visual' }
              ].map((opt, idx) => (
                <button key={idx} className="w-full flex items-center p-6 bg-white rounded-3xl border border-slate-100 group hover:border-primary/20 transition-all text-left">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-primary/10 transition-colors">
                    <opt.icon className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest line-clamp-1">{opt.info}</p>
                    <h4 className="text-lg font-bold text-slate-800">{opt.label}</h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-200" />
                </button>
              ))}
              
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center p-6 bg-red-50 rounded-3xl border border-red-100 group hover:bg-red-500 transition-all text-left mt-6"
              >
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-white/20 transition-colors">
                  <LogOut className="w-5 h-5 text-red-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-red-300 font-black uppercase tracking-widest group-hover:text-white/60">Encerrar Sessão</p>
                  <h4 className="text-lg font-bold text-red-600 group-hover:text-white">Sair do Aplicativo</h4>
                </div>
              </button>
            </div>
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="flex items-center space-x-4 mb-8">
              <button onClick={() => setActiveView('more')} className="p-2 bg-white border border-slate-100 rounded-xl">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-black text-slate-900">Configurações</h1>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden">
                <img src={user?.photoURL || "https://picsum.photos/seed/user/200"} alt="Avatar" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">{user?.displayName}</h3>
              <p className="text-sm text-slate-400 font-medium mb-8">{user?.email}</p>
              
              <div className="space-y-3">
                <button className="w-full p-4 bg-slate-50 rounded-2xl text-left flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Editar Perfil</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button className="w-full p-4 bg-slate-50 rounded-2xl text-left flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Privacidade</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <button 
                onClick={() => signOut(auth)}
                className="mt-12 w-full py-4.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-3xl"
              >
                Sair da Conta
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary selection:text-white lg:pl-80">
      {/* Scrollable View Area */}
      <div className="relative z-0">
        <AnimatePresence mode="wait">
          <div key={activeView}>
            {renderView()}
          </div>
        </AnimatePresence>

        {/* Modais de Edição */}
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
              <div className="grid grid-cols-2 gap-4">
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
                    onChange={e => setEditingMember({...editingMember, status: e.target.value})}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Líder">Líder</option>
                    <option value="Visitante">Visitante</option>
                  </select>
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
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 italic text-slate-600 leading-relaxed">
              {viewingAnnouncement?.content || "Nenhum detalhe adicional informado."}
            </div>
            <button 
              onClick={() => setViewingAnnouncement(null)}
              className="w-full py-4.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl"
            >
              Fechar
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
                  <option>Louvor</option>
                  <option>Mídia</option>
                  <option>Recepção</option>
                  <option>Crianças</option>
                  <option>Apoio</option>
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

        <BulletinViewModal 
          bulletin={selectedBulletin} 
          onClose={() => setSelectedBulletin(null)} 
        />
      </div>

      {/* Bottom Nav Bar - Hidden on desktop since sidebar is used */}
      <div className={`fixed bottom-0 left-0 right-0 lg:hidden bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex items-center justify-between safe-bottom z-50 rounded-t-[32px] md:max-w-xl md:mx-auto md:mb-4 md:rounded-[32px] md:shadow-2xl transition-transform duration-500 ${(isInputFocused || editingCampaign || editingMember || editingAnnouncement || editingAgendaItem || editingScale || editingConstruction || editingDevotional || editingCourse || itemToDelete) ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <NavItem active={activeView === 'home'} icon={Home} label="Início" onClick={() => setActiveView('home')} />
        <NavItem active={activeView === 'ministries'} icon={Users} label="Escalas" onClick={() => setActiveView('ministries')} />
        <NavItem active={activeView === 'devotionals'} icon={Video} label="Devocionais" onClick={() => setActiveView('devotionals')} />
        <NavItem active={activeView === 'chat'} icon={MessageCircle} label="Chat" onClick={() => setActiveView('chat')} />
        <NavItem active={activeView === 'more'} icon={MoreHorizontal} label="Mais" onClick={() => setActiveView('more')} />
      </div>

      {/* Header for Desktop or bigger screens */}
      <div className="hidden lg:flex fixed top-0 left-0 bottom-0 w-80 bg-white border-r border-slate-100 flex-col p-10 z-50 shadow-sm">
        <div className="mb-12 flex items-center space-x-6">
          <Logo size="sm" />
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-primary">Nova Aliança</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">CONECTADA</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-3">
          <SidebarItem active={activeView === 'home'} icon={Home} label="Dashboard" onClick={() => setActiveView('home')} />
          {isAdmin && <SidebarItem active={activeView === 'admin'} icon={Settings} label="Painel Admin" onClick={() => setActiveView('admin')} />}
          <SidebarItem active={activeView === 'members'} icon={Users} label="Membros" onClick={() => setActiveView('members')} />
          <SidebarItem active={activeView === 'devotionals'} icon={Video} label="Devocionais" onClick={() => setActiveView('devotionals')} />
          <SidebarItem active={activeView === 'prayers'} icon={Heart} label="Mural de Orações" onClick={() => setActiveView('prayers')} />
          <SidebarItem active={activeView === 'chat'} icon={MessageCircle} label="Mensagens Líderes" onClick={() => setActiveView('chat')} />
          <SidebarItem active={activeView === 'missions'} icon={Heart} label="Missões" onClick={() => setActiveView('missions')} />
          <SidebarItem active={activeView === 'ministries'} icon={Music} label="Escalas & Ministérios" onClick={() => setActiveView('ministries')} />
          <SidebarItem active={activeView === 'agenda'} icon={Calendar} label="Agenda & Reservas" onClick={() => setActiveView('agenda')} />
          <SidebarItem active={activeView === 'financial'} icon={Wallet} label="Dízimos & Ofertas" onClick={() => setActiveView('financial')} />
          <SidebarItem active={activeView === 'more'} icon={MoreHorizontal} label="Mais" onClick={() => setActiveView('more')} />
        </nav>
        
        <div className="mt-auto">
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">Modo Líder Ativo</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">Acesso total aos relatórios e escalas dos departamentos.</p>
          </div>
          <div className="flex items-center space-x-4 p-5 bg-slate-100/50 rounded-[28px] border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/30">
               LS
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-slate-800 truncate">Lucas Silveira</p>
              <p className="text-[9px] text-slate-400 truncate uppercase mt-0.5 tracking-widest font-bold">Líder de Louvor</p>
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
    className={`flex items-center space-x-4 w-full p-4 rounded-[20px] transition-all group ${active ? 'bg-primary-light text-primary' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'}`} />
    <span className="font-bold text-sm uppercase tracking-tight">{label}</span>
  </button>
);

const BulletinViewModal = ({ bulletin, onClose }: { bulletin: DigitalBulletin | null, onClose: () => void }) => {
  if (!bulletin) return null;
  const content = bulletin.jsonContent;
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[85vh] bg-white rounded-t-[48px] sm:rounded-[48px] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative p-8 bg-slate-900 text-white overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                         <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary-light">Boletim Digital</span>
                   </div>
                   <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                      <X className="w-5 h-5 text-white" />
                   </button>
                </div>
                <h1 className="text-4xl font-black italic tracking-tighter mb-2">{content.capa.tema}</h1>
                <div className="flex items-center space-x-4 text-xs font-bold text-white/50">
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5" /> {content.capa.data}</span>
                  <span className="flex items-center bg-white/10 px-3 py-1 rounded-full text-white tracking-widest uppercase text-[8px]">{bulletin.preacher}</span>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-slate-50/50 pb-20">
             <div className="text-center italic font-medium text-slate-500 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative">
                <div className="text-4xl absolute -top-4 left-6 text-primary/10">"</div>
                <p className="text-lg leading-relaxed text-slate-700">“{content.capa.versiculo_destaque}”</p>
             </div>

             <section>
               <SectionHeader title="Resumo da Mensagem" />
               <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm leading-relaxed text-slate-600 text-sm whitespace-pre-wrap">
                  {content.resumo_pregacao}
               </div>
             </section>

             <section>
               <SectionHeader title="Principais Lições" />
               <div className="grid grid-cols-1 gap-3">
                  {content.licoes.map((l: string, i: number) => (
                    <div key={i} className="flex items-start space-x-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                       <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-orange-500">0{i+1}</span>
                       </div>
                       <p className="text-sm font-bold text-slate-700 leading-tight pt-1">{l}</p>
                    </div>
                  ))}
               </div>
             </section>

             <section>
               <SectionHeader title="Aprofundamento Bíblico" />
               <div className="space-y-4">
                  {content.versiculos_relacionados.map((v: any, i: number) => (
                    <div key={i} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                       <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2">{v.referencia}</h4>
                       <p className="text-sm text-slate-500 italic leading-relaxed">{v.trecho}</p>
                    </div>
                  ))}
               </div>
             </section>

             <section>
               <div className="bg-primary p-10 rounded-[48px] text-white overflow-hidden relative shadow-2xl shadow-primary/20">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <Zap className="w-32 h-32 text-white" />
                  </div>
                  <div className="relative z-10">
                     <h3 className="text-2xl font-black italic tracking-tighter mb-8 text-white">Colocando em Prática</h3>
                     <div className="space-y-4">
                        {content.aplicacao.map((a: string, i: number) => (
                          <div key={i} className="flex items-center space-x-4 bg-white/10 p-4 rounded-2xl border border-white/5">
                             <CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" />
                             <span className="text-xs font-bold tracking-tight">{a}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
             </section>

             <section>
               <SectionHeader title="Plano da Semana" />
               <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {content.semana_espiritual.map((d: any, i: number) => (
                    <div key={i} className="p-6">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary">{d.dia} • {d.foco}</span>
                         <span className="text-[10px] font-bold text-slate-400 italic">{d.versiculo}</span>
                       </div>
                       <p className="text-xs text-slate-600 font-medium">🎯 {d.acao}</p>
                    </div>
                  ))}
               </div>
             </section>

             <div className="bg-slate-900 p-12 rounded-[56px] text-center text-white shadow-2xl relative overflow-hidden mb-8">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-indigo-500/20" />
                <div className="relative z-10">
                  <Flame className="w-8 h-8 text-orange-500 mx-auto mb-6 animate-pulse" />
                  <p className="text-2xl font-black italic tracking-tighter leading-tight">
                    "{content.frase_final}"
                  </p>
                </div>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

