from pathlib import Path
import re
import shutil
import sys

APP_PATH = Path("src/App.tsx")
PUBLIC_DIR = Path("public")
CONFIG_PATH = Path("capacitor.config.ts")
INDEX_PATH = Path("index.html")
STRINGS_PATH = Path("android/app/src/main/res/values/strings.xml")
LOGO_SOURCE = Path("igreja-batista-eden-logo.png")


def copy_logo_assets():
    if not LOGO_SOURCE.exists():
        raise SystemExit(
            "ERRO: coloque o arquivo igreja-batista-eden-logo.png na raiz do projeto."
        )

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(LOGO_SOURCE, PUBLIC_DIR / "igreja-batista-eden-logo.png")
    shutil.copyfile(LOGO_SOURCE, PUBLIC_DIR / "favicon.png")
    shutil.copyfile(LOGO_SOURCE, PUBLIC_DIR / "apple-touch-icon.png")
    print("Logo público atualizado.")


def patch_android_assets_only():
    if not LOGO_SOURCE.exists():
        raise SystemExit(
            "ERRO: coloque o arquivo igreja-batista-eden-logo.png na raiz do projeto."
        )

    icon_paths = [
        "android/app/src/main/res/mipmap-mdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-hdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png",
    ]

    for relative_path in icon_paths:
        path = Path(relative_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(LOGO_SOURCE, path)

    # Remove os ícones adaptativos padrão do Capacitor para o Android
    # usar diretamente o logotipo da Igreja Batista Éden.
    adaptive_icons = [
        Path("android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml"),
        Path("android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml"),
    ]
    for adaptive_icon in adaptive_icons:
        if adaptive_icon.exists():
            adaptive_icon.unlink()

    if STRINGS_PATH.exists():
        strings = STRINGS_PATH.read_text(encoding="utf-8")
        strings = re.sub(
            r"(<string name=\"app_name\">)([^<]+)(</string>)",
            r"\1Igreja Batista Éden\3",
            strings,
            count=1,
        )
        STRINGS_PATH.write_text(strings, encoding="utf-8")

    print("Ícone e nome Android atualizados.")


def safe_replace(text: str, old: str, new: str) -> str:
    return text.replace(old, new) if old in text else text


def ensure_visible_names(text: str) -> str:
    replacements = [
        ("'Comunidade Vida'", "'Igreja Batista Éden'"),
        ('"Comunidade Vida"', '"Igreja Batista Éden"'),
        (">Comunidade Vida<", ">Igreja Batista Éden<"),
        ("'Unidade Viva'", "'Igreja Batista Éden'"),
        ('"Unidade Viva"', '"Igreja Batista Éden"'),
        (">Unidade Viva<", ">Igreja Batista Éden<"),
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    return text


def ensure_logo_fill(text: str) -> str:
    text = text.replace("object-contain", "object-cover scale-[1.18]")
    text = text.replace(
        "<UnidadeVivaMark className=\"w-20 h-20 sm:w-24 sm:h-24 drop-shadow-md\" />",
        "<UnidadeVivaMark className=\"w-28 h-28 sm:w-32 sm:h-32 drop-shadow-md\" />",
    )
    text = text.replace(
        "<UnidadeVivaMark className=\"w-20 h-20\" />",
        "<UnidadeVivaMark className=\"w-28 h-28\" />",
    )
    text = text.replace(
        "<UnidadeVivaMark className=\"w-24 h-24\" />",
        "<UnidadeVivaMark className=\"w-28 h-28\" />",
    )
    return text


def ensure_view_type(text: str) -> str:
    view_match = re.search(r"type View = (?P<views>[^;]+);", text)
    if not view_match:
        raise SystemExit("ERRO: tipo View não encontrado em src/App.tsx.")

    views = view_match.group("views")
    if "'bulletin-program'" not in views:
        views += " | 'bulletin-program'"
        text = text[:view_match.start("views")] + views + text[view_match.end("views"):]
    return text


def ensure_bulletin_state(text: str) -> str:
    if "const [bulletinPrelude" in text:
        return text

    marker = "  const [activeView, setActiveView] = useState<View>('home');"
    if marker not in text:
        raise SystemExit("ERRO: estado activeView não encontrado.")

    insertion = """
  const [bulletinPrelude, setBulletinPrelude] = useState(() => localStorage.getItem('eden-bulletin-prelude') || '');
  const [bulletinGreeting, setBulletinGreeting] = useState(() => localStorage.getItem('eden-bulletin-greeting') || '');
  const [bulletinHymn, setBulletinHymn] = useState(() => localStorage.getItem('eden-bulletin-hymn') || '');
  const [bulletinReading, setBulletinReading] = useState(() => localStorage.getItem('eden-bulletin-reading') || '');
  const [bulletinPraise, setBulletinPraise] = useState(() => localStorage.getItem('eden-bulletin-praise') || '');
  const [bulletinOffering, setBulletinOffering] = useState(() => localStorage.getItem('eden-bulletin-offering') || '');
  const [bulletinMessage, setBulletinMessage] = useState(() => localStorage.getItem('eden-bulletin-message') || '');
  const [bulletinBlessing, setBulletinBlessing] = useState(() => localStorage.getItem('eden-bulletin-blessing') || '');

  const saveBulletinProgram = () => {
    localStorage.setItem('eden-bulletin-prelude', bulletinPrelude);
    localStorage.setItem('eden-bulletin-greeting', bulletinGreeting);
    localStorage.setItem('eden-bulletin-hymn', bulletinHymn);
    localStorage.setItem('eden-bulletin-reading', bulletinReading);
    localStorage.setItem('eden-bulletin-praise', bulletinPraise);
    localStorage.setItem('eden-bulletin-offering', bulletinOffering);
    localStorage.setItem('eden-bulletin-message', bulletinMessage);
    localStorage.setItem('eden-bulletin-blessing', bulletinBlessing);
    window.alert('Programação do culto salva com sucesso.');
  };
"""

    return text.replace(marker, marker + insertion, 1)


def ensure_bulletin_tile(text: str) -> str:
    old_snippet = """          {
            label: 'Boletim',
            icon: FileText,
            background:
              'bg-gradient-to-br from-[#EDF5FD] to-[#DFECF8]',
            iconColor: 'text-[#163D68]',
            onClick: () => {
              if (bulletins[0]) {
                setSelectedBulletin(bulletins[0]);
              } else {
                window.alert(
                  'Ainda não há boletim publicado.'
                );
              }
            }
          },"""

    new_snippet = """          {
            label: 'Boletim',
            icon: FileText,
            background:
              'bg-gradient-to-br from-[#EDF5FD] to-[#DFECF8]',
            iconColor: 'text-[#163D68]',
            onClick: () => setActiveView('bulletin-program')
          },"""

    text = safe_replace(text, old_snippet, new_snippet)
    text = safe_replace(
        text,
        "window.alert(\n                  'Ainda não há boletim publicado.'\n                );",
        "setActiveView('bulletin-program');",
    )
    return text


def ensure_bulletin_case(text: str) -> str:
    if "case 'bulletin-program':" in text:
        return text

    marker = "      case 'attendance':"
    if marker not in text:
        raise SystemExit("ERRO: ponto de inserção da tela do boletim não encontrado.")

    bulletin_case = """
      case 'bulletin-program':
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-28 max-w-3xl mx-auto px-4 pt-8"
          >
            <div className="flex items-center space-x-4 mb-7">
              <button
                onClick={() => setActiveView('home')}
                className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm"
                aria-label="Voltar ao início"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-[#0A3158]">
                  Programação do Culto
                </h1>
                <p className="text-xs font-semibold text-slate-500">
                  Preencha os campos do boletim conforme a ordem do culto.
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#D9E8F3] bg-white shadow-xl shadow-blue-900/5 overflow-hidden">
              <div className="bg-[#0A3158] px-5 py-5 text-center border-b-4 border-[#DAB45B]">
                <h2 className="text-[clamp(1.5rem,5vw,2.2rem)] font-black tracking-wide text-white uppercase">
                  Programação do Culto
                </h2>
              </div>

              <div className="p-5 sm:p-7 space-y-4 bg-[#FFFEFB]">
                <label className="block">
                  <span className="block text-sm font-black text-[#0A3158] mb-2">Prelúdio</span>
                  <input value={bulletinPrelude} onChange={e => setBulletinPrelude(e.target.value)} className="w-full rounded-2xl border border-[#D8E5F0] bg-white px-4 py-3 text-sm font-semibold text-slate-700" placeholder="Digite aqui" />
                </label>
                <label className="block">
                  <span className="block text-sm font-black text-[#0A3158] mb-2">Saudação e Oração</span>
                  <input value={bulletinGreeting} onChange={e => setBulletinGreeting(e.target.value)} className="w-full rounded-2xl border border-[#D8E5F0] bg-white px-4 py-3 text-sm font-semibold text-slate-700" placeholder="Digite aqui" />
                </label>
                <label className="block">
                  <span className="block text-sm font-black text-[#0A3158] mb-2">Hino Congregacional</span>
                  <input value={bulletinHymn} onChange={e => setBulletinHymn(e.target.value)} className="w-full rounded-2xl border border-[#D8E5F0] bg-white px-4 py-3 text-sm font-semibold text-slate-700" placeholder="Digite aqui" />
                </label>
                <label className="block">
                  <span className="block text-sm font-black text-[#0A3158] mb-2">Leitura Bíblica</span>
                  <input value={bulletinReading} onChange={e => setBulletinReading(e.target.value)} className="w-full rounded-2xl border border-[#D8E5F0] bg-white px-4 py-3 text-sm font-semibold text-slate-700" placeholder="Digite aqui" />
                </label>
                <label className="block">
                  <span className="block text-sm font-black text-[#0A3158] mb-2">Momento de Louvor</span>
                  <input value={bulletinPraise} onChange={e => setBulletinPraise(e.target.value)} className="w-full rounded-2xl border border-[#D8E5F0] bg-white px-4 py-3 text-sm font-semibold text-slate-700" placeholder="Digite aqui" />
                </label>
                <label className="block">
                  <span className="block text-sm font-black text-[#0A3158] mb-2">Dízimos e Ofertas</span>
                  <input value={bulletinOffering} onChange={e => setBulletinOffering(e.target.value)} className="w-full rounded-2xl border border-[#D8E5F0] bg-white px-4 py-3 text-sm font-semibold text-slate-700" placeholder="Digite aqui" />
                </label>
                <label className="block">
                  <span className="block text-sm font-black text-[#0A3158] mb-2">Mensagem Bíblica</span>
                  <input value={bulletinMessage} onChange={e => setBulletinMessage(e.target.value)} className="w-full rounded-2xl border border-[#D8E5F0] bg-white px-4 py-3 text-sm font-semibold text-slate-700" placeholder="Digite aqui" />
                </label>
                <label className="block">
                  <span className="block text-sm font-black text-[#0A3158] mb-2">Bênção Final</span>
                  <input value={bulletinBlessing} onChange={e => setBulletinBlessing(e.target.value)} className="w-full rounded-2xl border border-[#D8E5F0] bg-white px-4 py-3 text-sm font-semibold text-slate-700" placeholder="Digite aqui" />
                </label>
                <button
                  type="button"
                  onClick={saveBulletinProgram}
                  className="w-full min-h-[56px] rounded-2xl bg-[#0C5A9D] text-white text-sm font-black tracking-wide"
                >
                  SALVAR PROGRAMAÇÃO
                </button>
              </div>
            </div>
          </motion.div>
        );

"""

    return text.replace(marker, bulletin_case + marker, 1)


def patch_files():
    copy_logo_assets()

    if not APP_PATH.exists():
        raise SystemExit("ERRO: src/App.tsx não foi encontrado.")

    text = APP_PATH.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    text = ensure_visible_names(text)
    text = safe_replace(text, "/unidade-viva-logo.png", "/igreja-batista-eden-logo.png")
    text = safe_replace(text, "Logotipo Unidade Viva", "Logotipo Igreja Batista Éden")
    text = ensure_logo_fill(text)
    text = ensure_view_type(text)
    text = ensure_bulletin_state(text)
    text = ensure_bulletin_tile(text)
    text = ensure_bulletin_case(text)
    APP_PATH.write_text(text, encoding="utf-8")

    if CONFIG_PATH.exists():
        config_text = CONFIG_PATH.read_text(encoding="utf-8")
        config_text = re.sub(
            r"appName:\s*['\"][^'\"]+['\"]",
            "appName: 'Igreja Batista Éden'",
            config_text,
            count=1,
        )
        CONFIG_PATH.write_text(config_text, encoding="utf-8")

    if INDEX_PATH.exists():
        index_text = INDEX_PATH.read_text(encoding="utf-8")
        index_text = re.sub(
            r"<title>.*?</title>",
            "<title>Igreja Batista Éden</title>",
            index_text,
            flags=re.DOTALL,
        )
        INDEX_PATH.write_text(index_text, encoding="utf-8")

    print("Nome do aplicativo atualizado para Igreja Batista Éden.")
    print("Boletim configurado com os campos desejados, sem AVISOS.")
    print("Logotipo ampliado para reduzir os espaços em branco.")


if __name__ == "__main__":
    if "--android-only" in sys.argv:
        patch_android_assets_only()
    else:
        patch_files()
