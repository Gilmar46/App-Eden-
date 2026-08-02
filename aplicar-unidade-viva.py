from pathlib import Path
import base64
import re

APP_PATH = Path('src/App.tsx')
if not APP_PATH.exists():
    raise SystemExit('ERRO: src/App.tsx não foi encontrado.')

text = APP_PATH.read_text(encoding='utf-8')

LOGO_BASE64 = "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"
public_dir = Path('public')
public_dir.mkdir(parents=True, exist_ok=True)
(public_dir / 'unidade-viva-logo.png').write_bytes(base64.b64decode(LOGO_BASE64))


# 1) Ícones adicionais usados nos quadrinhos.
lucide_pattern = re.compile(
    r"import\s*\{(?P<body>.*?)\}\s*from\s*['\"]lucide-react['\"]\s*;",
    re.DOTALL,
)
match = lucide_pattern.search(text)
if not match:
    raise SystemExit('ERRO: import de lucide-react não encontrado.')

body = match.group('body')
for icon_name in ('HandHeart', 'Phone', 'Globe2'):
    if re.search(rf'\b{icon_name}\b', body):
        continue
    stripped = body.rstrip()
    if stripped and not stripped.endswith(','):
        stripped += ','
    body = stripped + f'\n  {icon_name}'

new_lucide_import = "import {" + body + "\n} from 'lucide-react';"
text = text[:match.start()] + new_lucide_import + text[match.end():]

# 2) Marca e componente acessível dos quadrinhos.
components_marker = 'const NavItem = ('
if components_marker not in text:
    raise SystemExit('ERRO: ponto de inserção dos componentes não encontrado.')

brand_components = r'''
const UnidadeVivaMark = ({ className = '' }: { className?: string }) => (
  <img
    src="/unidade-viva-logo.png"
    className={`object-contain ${className}`}
    alt="Logotipo Unidade Viva"
  />
);

const UnidadeVivaTile = ({
  icon: Icon,
  label,
  onClick,
  background,
  iconColor
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  background: string;
  iconColor: string;
}) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`min-h-[142px] sm:min-h-[160px] rounded-[26px] sm:rounded-[30px] border border-white/80 shadow-[0_8px_24px_rgba(19,47,78,0.07)] flex flex-col items-center justify-center gap-3 px-3 py-5 text-center outline-none focus-visible:ring-4 focus-visible:ring-[#F4C95D]/70 active:shadow-inner ${background}`}
    aria-label={`Abrir ${label}`}
  >
    <Icon
      className={`w-14 h-14 sm:w-16 sm:h-16 ${iconColor}`}
      strokeWidth={1.9}
      aria-hidden="true"
    />
    <span className="text-[clamp(1rem,4.4vw,1.35rem)] leading-tight font-extrabold text-[#12345A]">
      {label}
    </span>
  </motion.button>
);

'''

if 'const UnidadeVivaMark' not in text:
    text = text.replace(components_marker, brand_components + components_marker, 1)

# 3) Zoom persistente para todo o aplicativo.
active_view_state = "  const [activeView, setActiveView] = useState<View>('home');"
if active_view_state not in text:
    raise SystemExit('ERRO: estado activeView não encontrado.')

zoom_state = r'''
  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = Number(localStorage.getItem('unidade-viva-font-scale'));
    return [1, 1.15, 1.3].includes(saved) ? saved : 1;
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    localStorage.setItem('unidade-viva-font-scale', String(fontScale));
  }, [fontScale]);

  const cycleFontScale = () => {
    setFontScale(current => current === 1 ? 1.15 : current === 1.15 ? 1.3 : 1);
  };
'''

if 'unidade-viva-font-scale' not in text:
    text = text.replace(active_view_state, active_view_state + zoom_state, 1)

# 4) Marca da tela de carregamento.
text = text.replace(
    '<Logo size="lg" glow />',
    '''<div className="w-36 h-36 rounded-[36px] bg-[#0B2B50] flex items-center justify-center shadow-2xl shadow-[#0B2B50]/30">
          <UnidadeVivaMark className="w-24 h-24" />
        </div>''',
    1,
)
text = text.replace(
    '>Igreja Conectada</h2>',
    '>Unidade Viva</h2>',
    1,
)

# 5) Marca da tela de login, preservando o botão Google.
text = text.replace(
    '<Logo size="md" className="mx-auto mb-10" glow />',
    '''<div className="w-28 h-28 mx-auto mb-8 rounded-[30px] bg-[#0B2B50] flex items-center justify-center shadow-xl shadow-[#0B2B50]/25">
            <UnidadeVivaMark className="w-20 h-20" />
          </div>''',
    1,
)
text = text.replace(
    '>Nova Aliança</h1>',
    '>Unidade Viva</h1>',
    1,
)
text = text.replace(
    'Conectando vidas e ministérios <br/> em um só lugar.',
    'Uma igreja que acolhe, <br/> ama e serve.',
    1,
)

# 6) Nova tela inicial. Todas as funções ficam visíveis em quadrinhos.
home_pattern = re.compile(
    r"\n\s*case 'home':\s*.*?\n\s*case 'bible':",
    re.DOTALL,
)

home_replacement = r'''
      case 'home': {
        const homeTiles = [
          {
            label: 'Boletim',
            icon: FileText,
            background: 'bg-gradient-to-br from-[#EDF5FD] to-[#E5EFFA]',
            iconColor: 'text-[#163D68]',
            onClick: () => {
              if (bulletins[0]) {
                setSelectedBulletin(bulletins[0]);
              } else {
                window.alert('Ainda não há boletim publicado.');
              }
            }
          },
          {
            label: 'Notícias de Fé',
            icon: BookOpen,
            background: 'bg-gradient-to-br from-[#EDF9F2] to-[#E1F3EA]',
            iconColor: 'text-[#18785C]',
            onClick: () => setActiveView('news')
          },
          {
            label: 'Doações',
            icon: HandHeart,
            background: 'bg-gradient-to-br from-[#FFF8E9] to-[#FBF0D8]',
            iconColor: 'text-[#B98512]',
            onClick: () => setActiveView('donations')
          },
          {
            label: 'Pedidos de Oração',
            icon: Heart,
            background: 'bg-gradient-to-br from-[#F7F0FC] to-[#EEE5F8]',
            iconColor: 'text-[#6336A7]',
            onClick: () => setActiveView('prayers')
          },
          {
            label: 'Cultos',
            icon: Church,
            background: 'bg-gradient-to-br from-[#EDF5FD] to-[#E5EFFA]',
            iconColor: 'text-[#163D68]',
            onClick: () => setActiveView('lives')
          },
          {
            label: 'Agenda',
            icon: CalendarDays,
            background: 'bg-gradient-to-br from-[#FFF2E8] to-[#FAE7D8]',
            iconColor: 'text-[#C65D0B]',
            onClick: () => setActiveView('agenda')
          },
          {
            label: 'Avisos',
            icon: Bell,
            background: 'bg-gradient-to-br from-[#EDF9F2] to-[#E1F3EA]',
            iconColor: 'text-[#268654]',
            onClick: () => setActiveView('announcements')
          },
          {
            label: 'Contato',
            icon: Phone,
            background: 'bg-gradient-to-br from-[#EDF5FD] to-[#E5EFFA]',
            iconColor: 'text-[#1963A4]',
            onClick: () => setActiveView('locations')
          },
          {
            label: 'Missões',
            icon: Globe2,
            background: 'bg-gradient-to-br from-[#FFF8E9] to-[#FBF0D8]',
            iconColor: 'text-[#C6910C]',
            onClick: () => setActiveView('missions')
          },
          {
            label: 'Bíblia',
            icon: BookOpen,
            background: 'bg-gradient-to-br from-[#ECF9F7] to-[#DCF3F0]',
            iconColor: 'text-[#087A78]',
            onClick: () => setActiveView('bible')
          }
        ];

        return (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#FFFDF8] max-w-2xl mx-auto overflow-hidden shadow-2xl shadow-slate-900/10"
          >
            <header className="bg-gradient-to-br from-[#0A294B] via-[#0D335C] to-[#102F52] text-white px-5 sm:px-8 pb-7 pt-[max(1.25rem,env(safe-area-inset-top))] relative overflow-hidden">
              <div className="absolute -right-20 -top-24 w-64 h-64 bg-[#245783]/30 rounded-full blur-3xl" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveView('profile')}
                  className="flex min-w-0 items-center gap-3 text-left rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F4C95D]/60"
                  aria-label="Abrir perfil"
                >
                  <UnidadeVivaMark className="w-[78px] h-[86px] sm:w-[92px] sm:h-[100px] shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[clamp(1.65rem,7vw,2.6rem)] font-extrabold leading-none tracking-tight whitespace-nowrap">
                      Unidade Viva
                    </span>
                    <span className="block mt-2 text-[clamp(.86rem,3.5vw,1.15rem)] italic leading-snug text-[#F5D47A]">
                      Uma igreja que acolhe,<br />ama e serve
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={cycleFontScale}
                  className="shrink-0 min-w-[88px] sm:min-w-[104px] min-h-[112px] rounded-[25px] bg-gradient-to-b from-[#FFD66B] to-[#F5C44B] text-[#12345A] shadow-[0_8px_20px_rgba(0,0,0,.22)] border border-[#FFE7A4] flex flex-col items-center justify-center active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                  aria-label="Aumentar tamanho das letras"
                >
                  <span className="text-[2.35rem] sm:text-[2.7rem] font-black leading-none">A+</span>
                  <span className="text-lg sm:text-xl font-extrabold leading-none mt-1">Zoom</span>
                </button>
              </div>
            </header>

            <section className="px-4 sm:px-7 pt-5 pb-2 bg-[#FFFDF8]">
              <div className="flex items-center justify-center gap-3 text-[#12345A] mb-5">
                <HandMetal className="w-7 h-7" strokeWidth={1.8} aria-hidden="true" />
                <p className="text-[clamp(.98rem,3.8vw,1.2rem)] font-semibold text-center">
                  Toque em um quadro para entrar
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {homeTiles.map(tile => (
                  <UnidadeVivaTile
                    key={tile.label}
                    icon={tile.icon}
                    label={tile.label}
                    background={tile.background}
                    iconColor={tile.iconColor}
                    onClick={tile.onClick}
                  />
                ))}
              </div>
            </section>

            <div className="relative h-36 sm:h-44 mt-2 overflow-hidden bg-gradient-to-b from-[#FFFDF8] to-[#F7E9BC]" aria-hidden="true">
              <div className="absolute inset-x-0 bottom-0 h-24 bg-[#D7D9B7] [clip-path:polygon(0_48%,13%_35%,26%_51%,41%_30%,58%_52%,72%_34%,86%_48%,100%_31%,100%_100%,0_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-17 bg-[#AEB98F] [clip-path:polygon(0_55%,18%_32%,32%_61%,49%_38%,65%_58%,82%_29%,100%_57%,100%_100%,0_100%)]" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-20 h-28 bg-[#F6E3A3] [clip-path:polygon(45%_100%,49%_38%,40%_17%,55%_4%,61%_22%,52%_40%,57%_100%)] opacity-90" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[74px] w-2 h-9 bg-[#F2C64E] rounded-full" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[91px] w-7 h-2 bg-[#F2C64E] rounded-full" />
            </div>
          </motion.main>
        );
      }
      case 'bible':
'''

text, home_count = home_pattern.subn(home_replacement, text, count=1)
if home_count != 1:
    raise SystemExit('ERRO: não foi possível substituir a tela inicial.')

# 7) Ocultar a barra inferior na tela inicial para manter todos os acessos nos quadrinhos.
bottom_pattern = re.compile(
    r"(\s*\{\/\* Bottom Nav Bar - Updated Mockup Style \*\/\}\s*)"
    r"(<div className=\{`fixed bottom-0.*?</div>)"
    r"(\s*\{\/\* Header for Desktop or bigger screens \*\/\})",
    re.DOTALL,
)

bottom_match = bottom_pattern.search(text)
if not bottom_match:
    raise SystemExit('ERRO: barra inferior não encontrada.')

wrapped_bottom = (
    bottom_match.group(1)
    + "{activeView !== 'home' && (\n        "
    + bottom_match.group(2)
    + "\n      )}"
    + bottom_match.group(3)
)
text = text[:bottom_match.start()] + wrapped_bottom + text[bottom_match.end():]

APP_PATH.write_text(text, encoding='utf-8')

# 8) Nome público do aplicativo Android.
config_path = Path('capacitor.config.ts')
if config_path.exists():
    config_text = config_path.read_text(encoding='utf-8')
    config_text = re.sub(
        r"appName:\s*['\"][^'\"]+['\"]",
        "appName: 'Unidade Viva'",
        config_text,
        count=1,
    )
    config_path.write_text(config_text, encoding='utf-8')

# 9) Título da página web.
index_path = Path('index.html')
if index_path.exists():
    index_text = index_path.read_text(encoding='utf-8')
    index_text = re.sub(
        r'<title>.*?</title>',
        '<title>Unidade Viva</title>',
        index_text,
        count=1,
        flags=re.DOTALL,
    )
    index_path.write_text(index_text, encoding='utf-8')

print('Layout Unidade Viva aplicado com sucesso.')
print('Tela inicial substituída:', home_count)
print('A+ Zoom ativado em três níveis: 100%, 115% e 130%.')
print('Barra inferior oculta na tela inicial.')
