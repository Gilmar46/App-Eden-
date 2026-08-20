#!/usr/bin/env python3
"""Revisao V68 do App Eden: interface enxuta, Biblia original e oracoes.

Uso pelo proprietario do projeto, a partir da raiz do repositorio:

    python ~/storage/downloads/ATUALIZAR-APP-EDEN-MASTER-WEB-V68.py

O instalador grava uma copia propria no repositorio para que as revisoes sejam
reaplicadas depois dos scripts de identidade executados pelo GitHub Actions.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path


VERSAO = "1.0.68"
CODIGO_VERSAO = 1068
NOME_SCRIPT_PROJETO = "aplicar-revisao-master-web-v68.py"
MARCADOR_BUILD = "// EDEN_REVISAO_MASTER_WEB_V68"
MARCADOR_CSS = "/* EDEN_REVISAO_MOBILE_E_MENU_V68 */"


class RevisaoEdenError(RuntimeError):
    """Interrompe a atualizacao quando a estrutura esperada mudou."""


def substituir_uma_vez(texto: str, antigo: str, novo: str, descricao: str) -> str:
    quantidade = texto.count(antigo)
    if quantidade != 1:
        raise RevisaoEdenError(
            f"Nao foi possivel localizar exatamente uma ocorrencia de: "
            f"{descricao}. Encontradas: {quantidade}."
        )
    return texto.replace(antigo, novo, 1)


def substituir_trecho(
    texto: str,
    inicio: str,
    fim: str,
    substituto: str,
    descricao: str,
) -> str:
    primeiro = texto.find(inicio)
    if primeiro < 0 or texto.find(inicio, primeiro + len(inicio)) >= 0:
        raise RevisaoEdenError(f"Inicio exclusivo nao localizado: {descricao}.")
    ultimo = texto.find(fim, primeiro + len(inicio))
    if ultimo < 0:
        raise RevisaoEdenError(f"Final nao localizado: {descricao}.")
    return texto[:primeiro] + substituto + texto[ultimo:]


def substituir_em_secao(
    texto: str,
    inicio: str,
    fim: str,
    antigo: str,
    novo: str,
    descricao: str,
) -> str:
    indice_inicial = texto.find(inicio)
    if indice_inicial < 0:
        raise RevisaoEdenError(f"Secao inicial nao localizada: {descricao}.")
    indice_final = texto.find(fim, indice_inicial + len(inicio))
    if indice_final < 0:
        raise RevisaoEdenError(f"Secao final nao localizada: {descricao}.")
    secao = texto[indice_inicial:indice_final]
    secao = substituir_uma_vez(secao, antigo, novo, descricao)
    return texto[:indice_inicial] + secao + texto[indice_final:]


def atualizar_app_transformado(raiz: Path) -> None:
    caminho = raiz / "src" / "App.tsx"
    if not caminho.is_file():
        raise RevisaoEdenError("src/App.tsx nao foi localizado.")

    texto = caminho.read_text(encoding="utf-8")
    if MARCADOR_BUILD in texto:
        print("A revisao V68 ja esta presente nesta compilacao.")
        atualizar_metadados_gerados(raiz)
        return

    if "EDEN_N8N_WEBHOOK_URL" not in texto:
        raise RevisaoEdenError("A integracao existente com o n8n nao foi localizada.")

    texto = substituir_uma_vez(
        texto,
        "import { auth, db } from './lib/firebase';",
        "import { auth, db } from './lib/firebase';\n"
        "import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';\n"
        "import { Share } from '@capacitor/share';\n\n"
        + MARCADOR_BUILD,
        "importacoes do compartilhamento CSV",
    )

    texto = substituir_uma_vez(
        texto,
        "  deleteDoc\n} from 'firebase/firestore';",
        "  deleteDoc,\n  writeBatch\n} from 'firebase/firestore';",
        "importacao de exclusao em lote do Firebase",
    )

    texto = substituir_uma_vez(
        texto,
        '    src="/igreja-batista-eden-logo.png"',
        "    src={`${import.meta.env.BASE_URL}igreja-batista-eden-logo.png`}",
        "endereco do logotipo no GitHub Pages",
    )

    texto = substituir_uma_vez(
        texto,
        "  const [showNewsTicker, setShowNewsTicker] = useState(false);\n",
        "",
        "estado obsoleto que redesenha a tela",
    )

    texto = substituir_uma_vez(
        texto,
        "  useEffect(() => {\n"
        "    const interval = setInterval(() => {\n"
        "      setShowNewsTicker(prev => !prev);\n"
        "    }, 5000);\n"
        "    return () => clearInterval(interval);\n"
        "  }, []);\n\n",
        "",
        "temporizador que provocava oscilacao no celular",
    )

    texto = substituir_uma_vez(
        texto,
        "  const [activityLogBusy, setActivityLogBusy] = useState(false);",
        "  const [activityLogBusy, setActivityLogBusy] = useState(false);\n"
        "  const [memberPermissionBusy, setMemberPermissionBusy] =\n"
        "    useState<string | null>(null);",
        "estado de promocao de administradores",
    )

    efeito_admin_antigo = """  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        const normalizedEmail = user.email?.toLowerCase().trim();
        if (normalizedEmail === MASTER_EMAIL) {
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
"""

    efeito_admin_novo = """  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    if (user.email?.toLowerCase().trim() === MASTER_EMAIL) {
      setIsAdmin(true);
      setUserRole('master');
      return;
    }

    return onSnapshot(
      doc(db, 'admins', user.uid),
      snapshot => {
        const autorizado = snapshot.exists();
        setIsAdmin(autorizado);
        if (autorizado) {
          setUserRole('admin');
          setIsAdminUnlocked(true);
        }
      },
      error => {
        console.error('Erro ao acompanhar acesso administrativo:', error);
        setIsAdmin(false);
      }
    );
  }, [user?.uid, user?.email]);
"""
    texto = substituir_uma_vez(
        texto,
        efeito_admin_antigo,
        efeito_admin_novo,
        "autorizacao administrativa em tempo real",
    )

    handler_admin = """  const handleToggleMemberAdministrator = async (member: Member) => {
    if (!isMaster || !user || memberPermissionBusy) return;

    const email = (member.email || '').trim().toLowerCase();

    if (!email) {
      window.alert('Informe um e-mail para este membro antes de autorizar o acesso.');
      return;
    }

    if (email === MASTER_EMAIL) {
      window.alert('A conta Master principal nao pode ser alterada.');
      return;
    }

    const account = getMemberAccount(member);

    if (!account?.uid) {
      window.alert(
        'Este membro precisa acessar o aplicativo com a conta Google pelo ' +
        'menos uma vez antes de receber permissao administrativa.'
      );
      return;
    }

    const remover = member.userType === 'admin';
    const pergunta = remover
      ? `Remover o acesso administrativo de ${member.name}?`
      : `Autorizar ${member.name} a acessar o painel administrativo completo?`;

    if (!window.confirm(pergunta)) return;

    setMemberPermissionBusy(member.id);

    try {
      const adminRef = doc(db, 'admins', account.uid);
      const memberRef = doc(db, 'members', member.id);

      if (remover) {
        await updateDoc(memberRef, {
          userType: member.status === 'Líder' ? 'lider' : 'membro',
        });
        await deleteDoc(adminRef);
      } else {
        await setDoc(
          adminRef,
          {
            uid: account.uid,
            email,
            memberId: member.id,
            memberName: member.name,
            grantedBy: user.uid,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
        await updateDoc(memberRef, { userType: 'admin' });
      }

      await addActivityLog(
        remover ? 'Administrador removido' : 'Administrador autorizado',
        `${member.name} (${email})`
      );

      window.alert(
        remover
          ? `Acesso administrativo removido de ${member.name}.`
          : `${member.name} agora possui acesso administrativo completo.`
      );
    } catch (error) {
      console.error('Erro ao alterar acesso administrativo:', error);
      const detalhe = error instanceof Error ? error.message : String(error);
      window.alert('Nao foi possivel alterar o acesso administrativo: ' + detalhe);
    } finally {
      setMemberPermissionBusy(null);
    }
  };

"""

    texto = substituir_uma_vez(
        texto,
        "  const hasGrantedMessagePermission = (\n",
        handler_admin + "  const hasGrantedMessagePermission = (\n",
        "acao Master para promover administradores",
    )

    limpar_atividades = """  const handleClearActivityLogs = async () => {
    if (!isAdmin || activityLogBusy) return;

    if (!window.confirm('Excluir definitivamente todas as atividades recentes?')) {
      return;
    }

    setActivityLogBusy(true);

    try {
      let excluidos = 0;

      for (let loteNumero = 0; loteNumero < 50; loteNumero += 1) {
        const snapshot = await getDocs(query(logsRef, limit(400)));

        if (snapshot.empty) break;

        const lote = writeBatch(db);
        snapshot.docs.forEach(registro => lote.delete(registro.ref));
        await lote.commit();
        excluidos += snapshot.size;
      }

      const restantes = await getDocs(query(logsRef, limit(1)));

      if (!restantes.empty) {
        throw new Error('Ainda existem atividades pendentes no Firebase.');
      }

      setHiddenActivityLogIds([]);
      localStorage.removeItem('hiddenActivityLogIds');

      window.alert(
        excluidos
          ? `${excluidos} atividade(s) removida(s) definitivamente do Firebase.`
          : 'Nao existem atividades para limpar.'
      );
    } catch (error) {
      console.error('Erro ao limpar atividades definitivamente:', error);
      const detalhe = error instanceof Error ? error.message : String(error);
      window.alert('Nao foi possivel limpar as atividades: ' + detalhe);
    } finally {
      setActivityLogBusy(false);
    }
  };

"""

    texto = substituir_trecho(
        texto,
        "  const handleClearActivityLogs = async () => {\n",
        "  const handleCreateAgendaItem = async",
        limpar_atividades,
        "limpeza definitiva das atividades no Firebase",
    )

    funcao_csv = r'''  const downloadCSV = async (
    data: any[],
    filename: string,
    headers: string[]
  ) => {
    try {
      const escapeCell = (value: unknown) =>
        `"${String(value ?? '').replace(/"/g, '""')}"`;

      const rows = [headers.map(escapeCell).join(';')];

      data.forEach(item => {
        const values = headers.map(header => {
          const normalizedKey = header
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');

          const aliases: Record<string, string[]> = {
            nome: ['name', 'memberName', 'userName'],
            name: ['name', 'memberName', 'userName'],
            funcao: ['role'],
            role: ['role'],
            ministerio: ['ministry'],
            ministry: ['ministry'],
            situacao: ['status'],
            status: ['status'],
            data: ['date'],
            date: ['date'],
            tipo: ['type'],
            type: ['type'],
            valor: ['amount'],
            amount: ['amount'],
            usuario: ['user', 'userName'],
            user: ['user', 'userName'],
            email: ['email'],
          };

          const itemKey = Object.keys(item).find(key =>
            key
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]/g, '') === normalizedKey
          ) || (aliases[normalizedKey] || []).find(alias => alias in item);

          return escapeCell(itemKey ? item[itemKey] : item[header]);
        });

        rows.push(values.join(';'));
      });

      const csv = '\uFEFF' + rows.join('\r\n');
      const nomeArquivo = `${filename.replace(/\.csv$/i, '')}.csv`;
      const ambienteNativo = (window as any).Capacitor?.isNativePlatform?.();

      if (ambienteNativo) {
        const arquivo = await Filesystem.writeFile({
          path: `relatorios-eden/${nomeArquivo}`,
          data: csv,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
          recursive: true,
        });

        await Share.share({
          title: 'Relatorio Igreja Batista Eden',
          files: [arquivo.uri],
          dialogTitle: 'Salvar ou compartilhar relatorio CSV',
        });

        return;
      }

      const arquivoWeb = new File([csv], nomeArquivo, {
        type: 'text/csv;charset=utf-8',
      });
      const celular = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (
        celular &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [arquivoWeb] })
      ) {
        await navigator.share({
          title: 'Relatorio Igreja Batista Eden',
          files: [arquivoWeb],
        });
        return;
      }

      const url = URL.createObjectURL(arquivoWeb);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Erro ao salvar ou compartilhar CSV:', error);
      const detalhe = error instanceof Error ? error.message : String(error);
      window.alert('Nao foi possivel acessar o CSV: ' + detalhe);
    }
  };
'''

    texto = substituir_trecho(
        texto,
        "  const downloadCSV = (data: any[], filename: string, headers: string[]) => {\n",
        "  const handleScaleLogin = async",
        funcao_csv,
        "exportacao CSV para Android, iPhone e computador",
    )

    texto = substituir_uma_vez(
        texto,
        "        if (!isAdminUnlocked && !isMaster) {",
        "        if (!isAdminUnlocked && !isMaster && !isAdmin) {",
        "acesso integral dos administradores autorizados",
    )

    inicio_admin = "      case 'admin':"
    fim_admin = "      case 'members':"
    if fim_admin not in texto[texto.find(inicio_admin) :]:
        fim_admin = "      case 'profile':"

    texto = substituir_em_secao(
        texto,
        inicio_admin,
        fim_admin,
        '            <div className="flex items-center justify-between mb-10">',
        '            <div className="flex flex-col gap-4 md:flex-row '
        'md:items-center md:justify-between mb-10">',
        "cabecalho administrativo acessivel em telas pequenas",
    )

    texto = substituir_em_secao(
        texto,
        inicio_admin,
        fim_admin,
        '              <div className="flex space-x-2">',
        '              <div className="flex flex-wrap gap-2">',
        "botoes CSV visiveis no celular",
    )

    inicio_membros = "            {adminActiveTab === 'members' && ("
    fim_membros = "            {adminActiveTab === 'bulletins' && ("

    texto = substituir_em_secao(
        texto,
        inicio_membros,
        fim_membros,
        '                          <h4 className="text-sm font-black '
        'text-slate-800">{member.name}</h4>',
        '                          <h4 className="text-sm font-black '
        'text-slate-800 flex flex-wrap items-center gap-2">\n'
        '                            {member.name}\n'
        "                            {member.userType === 'admin' && (\n"
        '                              <span className="px-2 py-1 '
        'rounded-full bg-indigo-50 text-indigo-600 text-[8px] '
        'font-black uppercase tracking-widest">ADMIN</span>\n'
        '                            )}\n'
        '                          </h4>',
        "identificacao dos administradores na lista",
    )

    botao_admin = """                      <div className="flex items-center space-x-2">
                        {isMaster &&
                          member.email?.toLowerCase().trim() !== MASTER_EMAIL && (
                            <button
                              type="button"
                              onClick={() => handleToggleMemberAdministrator(member)}
                              disabled={memberPermissionBusy === member.id}
                              title={member.userType === 'admin'
                                ? 'Remover acesso administrativo'
                                : 'Tornar administrador'}
                              className={`p-2 rounded-xl transition-all ${
                                member.userType === 'admin'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                              } disabled:opacity-50`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
"""

    texto = substituir_em_secao(
        texto,
        inicio_membros,
        fim_membros,
        '                      <div className="flex items-center space-x-2">\n',
        botao_admin,
        "botao para conceder acesso administrativo",
    )

    texto = substituir_uma_vez(
        texto,
        '      className="min-h-screen relative selection:bg-primary '
        'selection:text-white lg:pl-80 overflow-x-hidden"',
        '      className="eden-app-shell min-h-screen relative '
        'selection:bg-primary selection:text-white lg:pl-80 overflow-x-hidden"',
        "estrutura estabilizada para celulares",
    )

    texto = substituir_uma_vez(
        texto,
        '      <div className="fixed inset-0 bg-[radial-gradient'
        '(circle_at_top_right,_var(--tw-gradient-stops))] '
        'from-white/10 via-transparent to-transparent pointer-events-none" />',
        '      <div className="eden-app-overlay fixed inset-0 '
        'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] '
        'from-white/10 via-transparent to-transparent pointer-events-none" />',
        "camada de fundo responsavel por piscadas no celular",
    )

    texto = substituir_uma_vez(
        texto,
        '      <div className="relative z-0">\n'
        '        <AnimatePresence mode="wait">\n'
        '          <div key={activeView}>\n'
        '            {renderView()}\n'
        '          </div>\n'
        '        </AnimatePresence>\n',
        '      <div className="eden-page-stage relative z-0">\n'
        '        <div key={activeView} className="eden-active-view">\n'
        '          {renderView()}\n'
        '        </div>\n',
        "transicao principal que produzia tela em branco no celular",
    )

    texto = substituir_uma_vez(
        texto,
        '      <div className="hidden lg:flex fixed top-0 left-0 '
        'bottom-0 w-72 bg-card border-r border-slate-100 flex-col '
        'p-8 z-50 shadow-sm">',
        '      <div className="hidden lg:flex fixed top-0 left-0 '
        'bottom-0 w-72 bg-card border-r border-slate-100 flex-col '
        'p-6 z-50 shadow-sm overflow-hidden">',
        "menu lateral com espaco de rolagem",
    )

    cabecalho_antigo = """        <div className="mb-12 flex items-center space-x-4">
          <Logo size="sm" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Igreja</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">CONECTADA</p>
          </div>
        </div>"""

    cabecalho_novo = """        <button
          type="button"
          onClick={() => setActiveView('home')}
          aria-label="Voltar para a pagina inicial"
          className="mb-8 shrink-0 flex items-center space-x-4 text-left rounded-2xl"
        >
          <Logo size="sm" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Igreja</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">CONECTADA</p>
          </div>
        </button>"""
    texto = substituir_uma_vez(
        texto,
        cabecalho_antigo,
        cabecalho_novo,
        "nome Igreja clicavel para retornar ao inicio",
    )

    texto = substituir_uma_vez(
        texto,
        '        <nav className="flex-1 space-y-2">',
        '        <nav className="eden-sidebar-scroll min-h-0 flex-1 '
        'overflow-y-auto overscroll-contain space-y-2 pr-2">',
        "rolagem independente do menu lateral",
    )

    texto = substituir_uma_vez(
        texto,
        '        <div className="mt-auto space-y-6">',
        '        <div className="mt-4 shrink-0 space-y-6">',
        "rodape fixo do menu lateral",
    )

    texto = substituir_uma_vez(
        texto,
        "label={isMaster ? 'Painel Master' : 'Painel do Líder'}",
        "label={isMaster ? 'Painel Master' : "
        "userRole === 'admin' ? 'Painel Administrativo' : 'Painel do Líder'}",
        "rotulo dos novos administradores",
    )

    # V68: remove rotas de demonstracao e atalhos repetidos. As telas abaixo
    # exibiam dados fixos ou botoes sem persistencia e mascaravam as telas
    # verdadeiras conectadas ao Firebase.
    texto = substituir_trecho(
        texto,
        "      case 'prayers':\n"
        "        return (\n"
        "          <motion.div initial={{ opacity: 0, x: -30 }}",
        "      case 'announcements':",
        "",
        "mural de oracoes demonstrativo duplicado",
    )

    texto = substituir_trecho(
        texto,
        "      case 'events':\n        return (",
        "      case 'bible':",
        "",
        "tela Eventos duplicada da Agenda",
    )

    texto = substituir_trecho(
        texto,
        "      case 'lives':\n        return (",
        "      case 'courses':",
        "",
        "telas demonstrativas de lives e convidados",
    )

    texto = substituir_trecho(
        texto,
        "      case 'locations':\n        return (",
        "      case 'profile':",
        "",
        "enderecos e grupos ficticios",
    )

    for rota in ("events", "lives", "guests", "locations"):
        token = f" | '{rota}'"
        if texto.count(token) != 1:
            raise RevisaoEdenError(f"Rota demonstrativa nao localizada: {rota}.")
        texto = texto.replace(token, "", 1)

    blocos_home_falsos = [
        """          {
            label: 'Cultos',
            icon: Church,
            background:
              'bg-gradient-to-br from-[#E6F1FB] to-[#D6E8F7]',
            iconColor: 'text-[#0D4D82]',
            onClick: () => setActiveView('lives')
          },
""",
        """          {
            label: 'Contato',
            icon: MessageCircle,
            background:
              'bg-gradient-to-br from-[#EAF3FB] to-[#DCEBF7]',
            iconColor: 'text-[#1963A4]',
            onClick: () => setActiveView('locations')
          },
""",
        """          {
            label: 'Eventos',
            icon: CalendarDays,
            background:
              'bg-gradient-to-br from-[#EAF4FF] to-[#DBECFA]',
            iconColor: 'text-[#0C5A9D]',
            onClick: () => setActiveView('events')
          },
""",
    ]
    for indice, bloco in enumerate(blocos_home_falsos, start=1):
        texto = substituir_uma_vez(
            texto,
            bloco,
            "",
            f"atalho demonstrativo da pagina inicial {indice}",
        )

    texto = substituir_uma_vez(
        texto,
        "          { label: 'Pregações', info: 'Cultos e mensagens', "
        "icon: Video, view: 'lives' as View },",
        "          { label: 'Pregações', info: 'Vídeos publicados pelos membros', "
        "icon: Video, view: 'devotionals' as View },",
        "atalho Pregacoes conectado ao conteudo real",
    )
    texto = substituir_uma_vez(
        texto,
        "          { label: 'Eventos', info: 'Próximas programações', "
        "icon: CalendarDays, view: 'events' as View },\n",
        "",
        "atalho Eventos repetido no menu Mais",
    )

    texto = substituir_uma_vez(
        texto,
        "                 { icon: FileText, label: 'Boleto Bancário', "
        "sub: 'Compensação em até 48 horas', action: () => "
        "alert('Funcionalidade em implantação. Use PIX por enquanto.') }\n",
        "",
        "forma de contribuicao ainda nao implementada",
    )

    texto = substituir_trecho(
        texto,
        "                <div className=\"flex items-center justify-between "
        "mb-6 px-2\">\n"
        "                  <h3 className=\"text-xl font-black text-slate-800 "
        "italic\">Planos de leitura</h3>",
        "                <h3 className=\"text-xl font-black text-slate-800 "
        "mb-6 italic px-2\">Livros da Bíblia</h3>",
        "",
        "planos de leitura sem acao",
    )

    texto = substituir_trecho(
        texto,
        "        const displayCourses = courses.length > 0 ? courses : [",
        "        const recommendedOnes = displayCourses.filter",
        "        const displayCourses = courses;\n\n",
        "cursos ficticios usados como preenchimento",
    )

    texto = substituir_em_secao(
        texto,
        "      case 'courses':",
        "      case 'profile':",
        "            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n"
        "              {otherCourses.map((c: any) => {",
        "            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n"
        "              {otherCourses.length === 0 && (\n"
        "                <div className=\"md:col-span-2 rounded-[32px] "
        "border border-dashed border-slate-200 bg-white p-10 text-center\">\n"
        "                  <BookOpen className=\"mx-auto mb-3 h-10 w-10 "
        "text-slate-300\" />\n"
        "                  <p className=\"text-sm font-bold text-slate-500\">"
        "Nenhum curso foi publicado.</p>\n"
        "                </div>\n"
        "              )}\n"
        "              {otherCourses.map((c: any) => {",
        "estado vazio da lista real de cursos",
    )

    # A campanha de missoes de exemplo era gravada automaticamente no
    # Firestore e reaparecia mesmo sem publicacao da igreja. A V68 passa a
    # mostrar um estado vazio e so cria uma campanha quando o administrador
    # salvar dados reais. Campanhas existentes continuam intactas.
    texto = substituir_trecho(
        texto,
        "const MOCK_CAMPAIGN: MissionCampaign = {",
        "interface Announcement",
        """const EMPTY_MISSION_CAMPAIGN: MissionCampaign = {
  id: '',
  title: '',
  totalGoal: 0,
  departments: [],
  nextTargets: []
};

""",
        "campanha e cadastros demonstrativos",
    )

    texto = substituir_uma_vez(
        texto,
        "  const currentCampaign = (campaignData && campaignData[0] as "
        "MissionCampaign) || MOCK_CAMPAIGN;",
        "  const currentCampaign = (campaignData && campaignData[0] as "
        "MissionCampaign) || EMPTY_MISSION_CAMPAIGN;",
        "estado vazio das campanhas missionarias",
    )

    texto = substituir_trecho(
        texto,
        "  // Initialize mission data if it doesn't exist or needs cleanup",
        "  const handleCreateMember = async (e: React.FormEvent) => {",
        "",
        "gravacao automatica da campanha ficticia",
    )

    salvar_campanha_antigo = """  const handleSaveCampaign = async (e: React.FormEvent) => {
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
  };"""
    salvar_campanha_novo = """  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingCampaign) return;

    const title = editingCampaign.title.trim();
    if (!title) {
      window.alert('Informe o nome da campanha missionária.');
      return;
    }

    const campaignId = editingCampaign.id || `campanha-${Date.now()}`;
    try {
      await setDoc(doc(db, 'missions', campaignId), {
        title,
        totalGoal: Number(editingCampaign.totalGoal),
        departments: editingCampaign.departments,
        nextTargets: editingCampaign.nextTargets || [],
        updatedAt: Timestamp.now()
      }, { merge: true });
      await addActivityLog("Missão Atualizada", `Meta: R$ ${editingCampaign.totalGoal}`);
      setEditingCampaign(null);
    } catch (err) {
      console.error("Erro ao salvar campanha:", err);
      window.alert('Não foi possível salvar a campanha. Tente novamente.');
    }
  };"""
    texto = substituir_uma_vez(
        texto,
        salvar_campanha_antigo,
        salvar_campanha_novo,
        "criacao e atualizacao de campanha missionaria real",
    )

    inicio_missoes_antigo = """      case 'missions':
        const totalCollected = currentCampaign.departments.reduce((acc, d) => acc + d.collected, 0);
        const percent = (totalCollected / currentCampaign.totalGoal) * 100;

        return ("""
    inicio_missoes_novo = """      case 'missions':
        if (!currentCampaign.id) {
          return (
            <div className="pb-24 max-w-2xl mx-auto px-4 pt-12">
              <div className="flex items-center space-x-4 mb-8">
                <button
                  type="button"
                  onClick={() => setActiveView('financial')}
                  className="p-2 bg-white border border-slate-100 rounded-xl"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Missões</h1>
              </div>
              <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center">
                <Heart className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                <p className="font-bold text-slate-600">Nenhuma campanha missionária foi publicada.</p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditingCampaign({
                      id: '',
                      title: '',
                      totalGoal: 0,
                      departments: [],
                      nextTargets: []
                    })}
                    className="mt-6 rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
                  >
                    Criar campanha
                  </button>
                )}
              </div>
            </div>
          );
        }

        const totalCollected = currentCampaign.departments.reduce((acc, d) => acc + d.collected, 0);
        const percent = currentCampaign.totalGoal > 0
          ? (totalCollected / currentCampaign.totalGoal) * 100
          : 0;

        return ("""
    texto = substituir_uma_vez(
        texto,
        inicio_missoes_antigo,
        inicio_missoes_novo,
        "estado vazio funcional de missoes",
    )

    # Os dois boletins sao recursos diferentes. Mantemos ambos com nomes
    # inequívocos e retiramos a listagem semanal repetida no resumo Master.
    for antigo, novo in (
        ("Boletins Digitais", "Boletins Semanais"),
        ("Boletim Digital Elite", "Boletim Semanal"),
        ("Boletim Digital", "Boletim Semanal"),
        ("Boletim Virtual", "Boletim Semanal"),
        ("boletim virtual", "boletim semanal"),
    ):
        texto = texto.replace(antigo, novo)

    texto = substituir_em_secao(
        texto,
        "      case 'home': {",
        "      case 'bulletin-program':",
        "            label: 'Boletim',",
        "            label: 'BOLETIM DO CULTO',",
        "nome do boletim da programacao do culto",
    )

    texto = substituir_trecho(
        texto,
        "            <SectionHeader title=\"Boletins Semanais\" />",
        "            <SectionHeader title=\"Configurações da Igreja\" />",
        "",
        "listagem semanal repetida no resumo Master",
    )

    # V68: estudo lexical do original. A traducao portuguesa continua sendo a
    # leitura principal; cada palavra abre os termos Strong do versiculo, com
    # hebraico no AT e grego no NT.
    tipos_estudo = r'''type EdenOriginalWord = {
  number: string;
  surface: string;
  rootWord: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
  meaningPt: string;
};

type EdenBibleWordStudy = {
  clickedWord: string;
  reference: string;
  language: 'Hebraico' | 'Grego';
  originalVerse: string;
  words: EdenOriginalWord[];
  selectedStrong: string;
};

const EDEN_STRONG_MEANINGS_PT: Record<string, string> = {
  H3427: 'habitar, permanecer, morar ou assentar-se',
  H5643: 'lugar oculto, esconderijo ou abrigo',
  H5945: 'elevado, supremo, o Altíssimo',
  H3068: 'SENHOR, o nome divino YHWH',
  H430: 'Deus; o Poderoso',
  H7307: 'espírito, vento ou sopro',
  H2617: 'amor leal, misericórdia e bondade',
  G26: 'amor sacrificial e dedicado',
  G4102: 'fé, confiança ou fidelidade',
  G5485: 'graça, favor ou bondade concedida',
  G3056: 'palavra, mensagem, razão ou expressão',
  G4151: 'espírito, vento ou sopro',
  G2316: 'Deus',
  G2424: 'Jesus; o Senhor salva',
  G5547: 'Cristo, o Ungido',
  G2222: 'vida',
  G2889: 'mundo, ordem criada ou humanidade',
};

const EDEN_CLICK_TO_STRONG: Record<string, string> = {
  habita: 'H3427',
  habitar: 'H3427',
  esconderijo: 'H5643',
  altissimo: 'H5945',
  senhor: 'H3068',
  deus: 'H430',
  espirito: 'H7307',
  misericordia: 'H2617',
  amor: 'G26',
  fe: 'G4102',
  graca: 'G5485',
  palavra: 'G3056',
  jesus: 'G2424',
  cristo: 'G5547',
  vida: 'G2222',
  mundo: 'G2889',
};

'''
    texto = substituir_uma_vez(
        texto,
        "type EdenDadosRegistro = Record<string, string | number | boolean | undefined>;\n\n",
        "type EdenDadosRegistro = Record<string, string | number | boolean | undefined>;\n\n"
        + tipos_estudo,
        "tipos do estudo hebraico e grego",
    )

    texto = substituir_uma_vez(
        texto,
        '  const [isSearchingBible, setIsSearchingBible] = useState(false);',
        '  const [isSearchingBible, setIsSearchingBible] = useState(false);\n'
        '  const [bibleWordStudy, setBibleWordStudy] =\n'
        '    useState<EdenBibleWordStudy | null>(null);\n'
        '  const [isBibleWordStudyLoading, setIsBibleWordStudyLoading] =\n'
        '    useState(false);\n'
        '  const [bibleWordStudyError, setBibleWordStudyError] = useState(\'\');',
        "estados do estudo das palavras",
    )

    funcoes_estudo = r'''  const normalizeBibleStudyWord = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');

  const bibleStudyPrefixScore = (first: string, second: string) => {
    const a = normalizeBibleStudyWord(first);
    const b = normalizeBibleStudyWord(second);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.startsWith(b) || b.startsWith(a)) return 0.88;
    let shared = 0;
    while (shared < a.length && shared < b.length && a[shared] === b[shared]) {
      shared += 1;
    }
    return shared / Math.max(a.length, b.length);
  };

  const getBibleSuperSearchVerse = (
    payload: any,
    module: string,
    chapter: number,
    verse: number
  ) => payload?.results?.[0]?.verses?.[module]?.[String(chapter)]
    ?.[String(verse)]?.text || '';

  const fetchBibleSuperSearchPassage = async (
    module: string,
    reference: string,
    markup = 'none'
  ) => {
    const params = new URLSearchParams({ bible: module, reference, markup });
    const response = await fetch(
      `https://api.biblesupersearch.com/api?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Base lexical respondeu ${response.status}.`);
    }
    return response.json();
  };

  const openBibleOriginalWord = async (
    clickedWord: string,
    verseNumber: number
  ) => {
    if (!selectedBibleBook || isBibleWordStudyLoading) return;

    const bookIndex = BIBLE_BOOKS.indexOf(selectedBibleBook);
    const isOldTestament = bookIndex >= 0 && bookIndex < 39;
    const language = isOldTestament ? 'Hebraico' : 'Grego';
    const originalModule = isOldTestament ? 'wlc' : 'tr';
    const reference = `${BIBLE_BOOKS_MAP[selectedBibleBook] || selectedBibleBook} ${selectedBibleChapter}:${verseNumber}`;

    setIsBibleWordStudyLoading(true);
    setBibleWordStudyError('');
    setBibleWordStudy(null);

    try {
      let strongModule = 'rv_1909_strongs';
      let strongPayload = await fetchBibleSuperSearchPassage(
        strongModule,
        reference,
        'raw'
      );
      let markedText = getBibleSuperSearchVerse(
        strongPayload,
        strongModule,
        selectedBibleChapter,
        verseNumber
      );

      if (!/\{[HG]\d+\}/i.test(markedText)) {
        strongModule = 'kjv_strongs';
        strongPayload = await fetchBibleSuperSearchPassage(
          strongModule,
          reference,
          'raw'
        );
        markedText = getBibleSuperSearchVerse(
          strongPayload,
          strongModule,
          selectedBibleChapter,
          verseNumber
        );
      }

      const originalPayload = await fetchBibleSuperSearchPassage(
        originalModule,
        reference
      );
      const originalVerse = getBibleSuperSearchVerse(
        originalPayload,
        originalModule,
        selectedBibleChapter,
        verseNumber
      );

      const markedWords = markedText
        .split(/\s+/)
        .flatMap((piece: string) => {
          const numbers = Array.from(
            piece.matchAll(/\{([HG]\d+)\}/gi),
            match => match[1].toUpperCase()
          );
          const surface = piece
            .replace(/\{[HG]\d+\}/gi, '')
            .replace(/[^\p{L}\p{M}'’-]/gu, '');
          return numbers.map(number => ({ number, surface: surface || number }));
        });

      const uniqueNumbers = Array.from(
        new Set(markedWords.map(item => item.number))
      );
      if (uniqueNumbers.length === 0) {
        throw new Error('O versículo não retornou códigos Strong para análise.');
      }

      const strongParams = new URLSearchParams({
        strongs: uniqueNumbers.join(','),
      });
      const definitionResponse = await fetch(
        `https://api.biblesupersearch.com/api/strongs?${strongParams.toString()}`
      );
      if (!definitionResponse.ok) {
        throw new Error(`Léxico Strong respondeu ${definitionResponse.status}.`);
      }
      const definitionPayload = await definitionResponse.json();
      const definitions = Array.isArray(definitionPayload?.results)
        ? definitionPayload.results
        : [];
      const definitionsByNumber = new Map(
        definitions
          .filter((item: any) => !item.tvm)
          .map((item: any) => [String(item.number).toUpperCase(), item])
      );

      const words: EdenOriginalWord[] = markedWords.map(item => {
        const definition: any = definitionsByNumber.get(item.number) || {};
        return {
          number: item.number,
          surface: item.surface,
          rootWord: definition.root_word || '',
          transliteration: definition.transliteration || '',
          pronunciation: definition.pronunciation || '',
          definition: String(definition.entry || '')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' '),
          meaningPt: EDEN_STRONG_MEANINGS_PT[item.number] || '',
        };
      });

      const normalizedClicked = normalizeBibleStudyWord(clickedWord);
      const preferredStrong = EDEN_CLICK_TO_STRONG[normalizedClicked];
      const preferredMatch = preferredStrong
        ? words.find(item => item.number === preferredStrong)
        : undefined;
      const similarityMatch = [...words].sort(
        (first, second) =>
          bibleStudyPrefixScore(clickedWord, second.surface) -
          bibleStudyPrefixScore(clickedWord, first.surface)
      )[0];
      const selectedStrong = preferredMatch?.number || similarityMatch?.number || words[0].number;

      setBibleWordStudy({
        clickedWord,
        reference: `${selectedBibleBook} ${selectedBibleChapter}:${verseNumber}`,
        language,
        originalVerse,
        words,
        selectedStrong,
      });
    } catch (error) {
      console.error('Erro no estudo da palavra original:', error);
      setBibleWordStudyError(
        error instanceof Error
          ? error.message
          : 'Não foi possível consultar o texto original.'
      );
    } finally {
      setIsBibleWordStudyLoading(false);
    }
  };

'''
    texto = substituir_uma_vez(
        texto,
        "  const fetchBibleChapter = async (book: string, chapter: number) => {\n",
        funcoes_estudo
        + "  const fetchBibleChapter = async (book: string, chapter: number) => {\n",
        "consulta lexical do texto original",
    )

    versos_clicaveis = r'''                <div className="prose prose-slate max-w-none">
                  {bibleContent.verses?.map((v: any, idx: number) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={idx}
                      className="mb-5 font-serif leading-relaxed text-slate-700"
                    >
                      <sup className="mr-2 text-[10px] font-black text-primary/40 italic">
                        {v.verse}
                      </sup>
                      {String(v.text).split(/(\s+)/).map((fragment, wordIndex) => {
                        const word = fragment.match(/[\p{L}\p{M}]+/u)?.[0];
                        if (!word) return <React.Fragment key={wordIndex}>{fragment}</React.Fragment>;
                        return (
                          <button
                            type="button"
                            key={wordIndex}
                            onClick={() => void openBibleOriginalWord(word, v.verse)}
                            className="rounded px-0.5 text-left font-serif underline decoration-dotted decoration-primary/35 underline-offset-4 hover:bg-primary/10 hover:text-primary"
                            title={`Ver ${word} no original bíblico`}
                          >
                            {fragment}
                          </button>
                        );
                      })}
                    </motion.div>
                  ))}
                </div>

                <p className="mt-5 rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700">
                  Toque em qualquer palavra para consultar o hebraico do Antigo
                  Testamento ou o grego do Novo Testamento.
                </p>

                {isBibleWordStudyLoading && (
                  <div className="mt-6 rounded-[28px] border border-slate-100 bg-slate-50 p-6 text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Consultando o texto original...
                    </p>
                  </div>
                )}

                {bibleWordStudyError && (
                  <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">
                    {bibleWordStudyError} Verifique a internet e tente novamente.
                  </div>
                )}

                {bibleWordStudy && (() => {
                  const selectedWord = bibleWordStudy.words.find(
                    item => item.number === bibleWordStudy.selectedStrong
                  ) || bibleWordStudy.words[0];
                  return (
                    <section className="mt-6 rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                            Estudo do original • {bibleWordStudy.language}
                          </p>
                          <h3 className="mt-1 text-xl font-black text-slate-900">
                            “{bibleWordStudy.clickedWord}” — {bibleWordStudy.reference}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBibleWordStudy(null)}
                          className="rounded-xl bg-white p-2 text-slate-400 shadow-sm"
                          aria-label="Fechar estudo da palavra"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {bibleWordStudy.originalVerse && (
                        <div
                          dir={bibleWordStudy.language === 'Hebraico' ? 'rtl' : 'ltr'}
                          className="mt-5 rounded-2xl bg-slate-950 p-4 text-lg leading-loose text-white"
                        >
                          {bibleWordStudy.originalVerse}
                        </div>
                      )}

                      <p className="mt-5 text-xs font-bold text-slate-500">
                        Correspondência sugerida. Selecione outro termo abaixo para comparar todo o versículo.
                      </p>
                      <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                        {bibleWordStudy.words.map((item, index) => (
                          <button
                            type="button"
                            key={`${item.number}-${index}`}
                            onClick={() => setBibleWordStudy(current => current
                              ? { ...current, selectedStrong: item.number }
                              : current
                            )}
                            className={`rounded-xl border px-3 py-2 text-left ${
                              bibleWordStudy.selectedStrong === item.number
                                ? 'border-indigo-500 bg-indigo-600 text-white'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <span className="block text-base font-black">
                              {item.rootWord || item.surface}
                            </span>
                            <span className="block text-[9px] font-bold uppercase tracking-widest opacity-70">
                              {item.surface} • {item.number}
                            </span>
                          </button>
                        ))}
                      </div>

                      {selectedWord && (
                        <div className="mt-5 rounded-2xl border border-white bg-white/80 p-5">
                          <p className="text-3xl font-black text-slate-900">
                            {selectedWord.rootWord || selectedWord.surface}
                          </p>
                          <p className="mt-1 text-sm font-bold text-indigo-700">
                            {selectedWord.transliteration || 'Sem transliteração'}
                            {selectedWord.pronunciation
                              ? ` • pronúncia: ${selectedWord.pronunciation}`
                              : ''}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-slate-700">
                            <strong>Significado:</strong>{' '}
                            {selectedWord.meaningPt || selectedWord.definition ||
                              'Definição lexical não disponível.'}
                          </p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Léxico Strong {selectedWord.number}
                          </p>
                        </div>
                      )}
                    </section>
                  );
                })()}
'''

    texto = substituir_trecho(
        texto,
        '                <div className="prose prose-slate max-w-none">\n'
        '                  {bibleContent.verses?.map((v: any, idx: number) => (',
        '                <div className="mt-8">\n'
        '                  <button\n'
        '                    type="button"\n'
        "                    onClick={() => void registrarAtividadeEden('leitura_diaria', {",
        versos_clicaveis + '\n',
        "palavras clicaveis e painel do original biblico",
    )

    if "setShowNewsTicker" in texto:
        raise RevisaoEdenError("Ainda existe uma referencia ao temporizador removido.")

    casos = re.findall(r"case '([^']+)':", texto)
    casos_duplicados = sorted({caso for caso in casos if casos.count(caso) > 1})
    if casos_duplicados:
        raise RevisaoEdenError(
            "Ainda existem telas duplicadas: " + ", ".join(casos_duplicados)
        )

    botoes_sem_acao = []
    for correspondencia in re.finditer(r"<button\b[^>]*>", texto, re.DOTALL):
        abertura = correspondencia.group(0)
        if "onClick=" not in abertura and 'type="submit"' not in abertura:
            botoes_sem_acao.append(texto.count("\n", 0, correspondencia.start()) + 1)
    if botoes_sem_acao:
        raise RevisaoEdenError(
            "Ainda existem botoes sem acao nas linhas: "
            + ", ".join(map(str, botoes_sem_acao))
        )

    for marcador_falso in (
        "Simulando reprodução",
        "Funcionalidade em implantação",
        "GP Esperança",
        "Vitória da minha filha",
        "Maturidade Cristã",
        "MOCK_CAMPAIGN",
        "Missões Mundiais 2026",
        "Sua solicitação foi enviada ao Pastor Gilmar",
    ):
        if marcador_falso in texto:
            raise RevisaoEdenError(
                f"Conteudo demonstrativo ainda presente: {marcador_falso}."
            )

    for tipo in ("presenca", "estudo_biblico", "leitura_diaria"):
        if f"registrarAtividadeEden('{tipo}'" not in texto:
            raise RevisaoEdenError(f"Integracao n8n ausente para: {tipo}.")

    caminho.write_text(texto, encoding="utf-8")
    atualizar_metadados_gerados(raiz)

    print("Revisao V68 aplicada ao aplicativo gerado.")
    print("Logotipo: endereco corrigido para Android e GitHub Pages.")
    print("CSV: download no computador e compartilhamento no celular.")
    print("Administradores: autorizacao imediata a partir da conta Master.")
    print("Atividades: remocao definitiva em lotes no Firebase.")
    print("Mobile: redesenho de 5 segundos e transicao instavel removidos.")
    print("Menu lateral: rolagem habilitada e nome Igreja leva ao inicio.")
    print("Interface: telas falsas, atalhos repetidos e botoes sem acao removidos.")
    print("Boletins: BOLETIM DO CULTO e Boletim Semanal identificados.")
    print("Biblia: palavras clicaveis com estudo do hebraico e do grego.")
    print("Oracoes: tela real do Firebase ativada; demonstracao removida.")
    print("Presenca, estudo biblico e leitura diaria: n8n preservado.")


def atualizar_metadados_gerados(raiz: Path) -> None:
    for nome in ("play-store-build.json", "app-update-build.json"):
        caminho = raiz / nome
        if not caminho.is_file():
            continue
        metadados = json.loads(caminho.read_text(encoding="utf-8"))
        metadados["versionCode"] = CODIGO_VERSAO
        metadados["versionName"] = VERSAO
        if nome == "app-update-build.json":
            metadados["notes"] = (
                "Interface sem demonstracoes ou duplicidades, mural de oracoes "
                "real, boletins revisados e estudo biblico do hebraico e grego."
            )
            atualizador = raiz / "src" / "AppUpdate.tsx"
            if atualizador.is_file():
                codigo_atualizador = atualizador.read_text(encoding="utf-8")
                codigo_atualizador, alteracoes_codigo = re.subn(
                    r"(?m)^(const APP_UPDATE_VERSION_CODE\s*=\s*)\d+(;)$",
                    rf"\g<1>{CODIGO_VERSAO}\g<2>",
                    codigo_atualizador,
                    count=1,
                )
                codigo_atualizador, alteracoes_nome = re.subn(
                    r'(?m)^(const APP_UPDATE_VERSION_NAME\s*=\s*)"[^"]+"(;)$',
                    rf'\g<1>"{VERSAO}"\g<2>',
                    codigo_atualizador,
                    count=1,
                )
                if alteracoes_codigo != 1 or alteracoes_nome != 1:
                    raise RevisaoEdenError(
                        "Nao foi possivel atualizar a versao do atualizador Master."
                    )
                atualizador.write_text(codigo_atualizador, encoding="utf-8")
        caminho.write_text(
            json.dumps(metadados, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Metadados {nome}: {VERSAO} ({CODIGO_VERSAO}).")


def atualizar_workflow_nativo(caminho: Path) -> None:
    texto = caminho.read_text(encoding="utf-8")

    texto = texto.replace(
        "      - name: Aplicar revisao Master, Web e Mobile V67\n"
        "        run: python3 aplicar-revisao-master-web-v67.py --aplicar-build\n",
        "      - name: Aplicar revisao Master, Web e Mobile V68\n"
        f"        run: python3 {NOME_SCRIPT_PROJETO} --aplicar-build\n",
    )

    if "@capacitor/filesystem@8" not in texto:
        texto = substituir_uma_vez(
            texto,
            "            @capacitor/browser@8 \\\n"
            "            @capacitor-firebase/authentication@8",
            "            @capacitor/browser@8 \\\n"
            "            @capacitor/filesystem@8 \\\n"
            "            @capacitor/share@8 \\\n"
            "            @capacitor-firebase/authentication@8",
            f"plugins nativos de arquivo em {caminho.name}",
        )

    if "            '@capacitor/filesystem'," not in texto:
        texto = substituir_uma_vez(
            texto,
            "            '@capacitor/browser',\n"
            "            '@capacitor-firebase/authentication'",
            "            '@capacitor/browser',\n"
            "            '@capacitor/filesystem',\n"
            "            '@capacitor/share',\n"
            "            '@capacitor-firebase/authentication'",
            f"validacao dos novos plugins em {caminho.name}",
        )

    if '            "@capacitor/filesystem" \\' not in texto:
        texto = substituir_uma_vez(
            texto,
            '            "@capacitor/browser" \\\n'
            '            "@capacitor-firebase/authentication"; do',
            '            "@capacitor/browser" \\\n'
            '            "@capacitor/filesystem" \\\n'
            '            "@capacitor/share" \\\n'
            '            "@capacitor-firebase/authentication"; do',
            f"verificacao Android dos plugins CSV em {caminho.name}",
        )

    nome_etapa = "      - name: Aplicar revisao Master, Web e Mobile V68\n"
    if nome_etapa not in texto:
        marcador = "      - name: Revisar arquivos antes da compilação\n"
        texto = substituir_uma_vez(
            texto,
            marcador,
            nome_etapa
            + f"        run: python3 {NOME_SCRIPT_PROJETO} --aplicar-build\n\n"
            + marcador,
            f"etapa de revisao final em {caminho.name}",
        )

    if caminho.name == "gerar-aab-play-store.yml":
        for codigo_antigo in ("1066", "1067"):
            texto = texto.replace(codigo_antigo, str(CODIGO_VERSAO))
        for versao_antiga in ("1.0.66", "1.0.67"):
            texto = texto.replace(versao_antiga, VERSAO)
        if str(CODIGO_VERSAO) not in texto or VERSAO not in texto:
            raise RevisaoEdenError("Nao foi possivel atualizar a versao Google Play.")

    caminho.write_text(texto, encoding="utf-8")


def atualizar_workflow_web(caminho: Path) -> None:
    texto = caminho.read_text(encoding="utf-8")

    texto = texto.replace(
        "      - 'aplicar-revisao-master-web-v67.py'\n",
        f"      - '{NOME_SCRIPT_PROJETO}'\n",
    )
    texto = texto.replace(
        "      - name: Aplicar revisao Master, Web e Mobile V67\n"
        "        run: python3 aplicar-revisao-master-web-v67.py --aplicar-build\n",
        "      - name: Aplicar revisao Master, Web e Mobile V68\n"
        f"        run: python3 {NOME_SCRIPT_PROJETO} --aplicar-build\n",
    )

    entrada_caminho = f"      - '{NOME_SCRIPT_PROJETO}'\n"
    if entrada_caminho not in texto:
        texto = substituir_uma_vez(
            texto,
            "      - '.github/workflows/publicar-app-eden-web.yml'\n",
            "      - '.github/workflows/publicar-app-eden-web.yml'\n"
            + entrada_caminho,
            "disparo automatico da publicacao web",
        )

    etapa_dependencias = (
        "      - name: Instalar suporte de CSV e compartilhamento\n"
        "        run: npm install --no-save "
        "@capacitor/core@8 @capacitor/filesystem@8 @capacitor/share@8\n\n"
    )
    if "      - name: Instalar suporte de CSV e compartilhamento\n" not in texto:
        texto = substituir_uma_vez(
            texto,
            "      - name: Instalar dependencias\n        run: npm ci\n\n",
            "      - name: Instalar dependencias\n        run: npm ci\n\n"
            + etapa_dependencias,
            "dependencias do compartilhamento na versao web",
        )

    etapa_revisao = (
        "      - name: Aplicar revisao Master, Web e Mobile V68\n"
        f"        run: python3 {NOME_SCRIPT_PROJETO} --aplicar-build\n\n"
    )
    if etapa_revisao not in texto:
        marcador = "      - name: Verificar integracao com n8n\n"
        texto = substituir_uma_vez(
            texto,
            marcador,
            etapa_revisao + marcador,
            "revisao final antes da publicacao GitHub Pages",
        )

    for codigo_antigo in ("1066", "1067"):
        texto = texto.replace(codigo_antigo, str(CODIGO_VERSAO))
    for versao_antiga in ("1.0.66", "1.0.67"):
        texto = texto.replace(versao_antiga, VERSAO)
    caminho.write_text(texto, encoding="utf-8")


CSS_MOBILE_MENU = """

/* EDEN_REVISAO_MOBILE_E_MENU_V68 */
.eden-sidebar-scroll {
  scrollbar-color: rgba(111, 125, 170, 0.45) transparent;
  scrollbar-width: thin;
}

.eden-sidebar-scroll::-webkit-scrollbar {
  width: 7px;
}

.eden-sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(111, 125, 170, 0.45);
  border-radius: 999px;
}

@media (max-width: 1023px) {
  html,
  body,
  #root {
    min-height: 100%;
    width: 100%;
  }

  body {
    overflow-x: hidden;
    overscroll-behavior-x: none;
    -webkit-text-size-adjust: 100%;
  }

  .eden-app-shell,
  .eden-page-stage,
  .eden-active-view {
    min-height: 100svh;
  }

  .eden-app-shell {
    transition: none !important;
  }

  .eden-app-overlay {
    display: none;
  }
}
"""


def instalar_revisao(raiz: Path) -> None:
    obrigatorios = [
        raiz / "src" / "App.tsx",
        raiz / "src" / "index.css",
        raiz / ".github" / "workflows" / "compilar-apk.yml",
        raiz / ".github" / "workflows" / "gerar-aab-play-store.yml",
        raiz / ".github" / "workflows" / "publicar-app-eden-web.yml",
    ]

    ausentes = [str(caminho.relative_to(raiz)) for caminho in obrigatorios if not caminho.is_file()]
    if ausentes:
        raise RevisaoEdenError(
            "Execute a atualizacao dentro da pasta App-Eden-integracao-n8n. "
            "Arquivos ausentes: " + ", ".join(ausentes)
        )

    codigo_atual = obrigatorios[0].read_text(encoding="utf-8")
    if "EDEN_N8N_WEBHOOK_URL" not in codigo_atual:
        raise RevisaoEdenError(
            "A integracao n8n nao foi encontrada no App.tsx atual. "
            "A instalacao foi interrompida para proteger o projeto."
        )

    data = datetime.now().strftime("%Y%m%d-%H%M%S")
    pasta_backup = raiz.parent / "App-Eden-Backups" / f"revisao-master-web-v68-{data}"
    for caminho in obrigatorios:
        destino = pasta_backup / caminho.relative_to(raiz)
        destino.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(caminho, destino)

    destino_script = raiz / NOME_SCRIPT_PROJETO
    script_origem = Path(__file__).resolve()
    if destino_script.exists():
        shutil.copy2(destino_script, pasta_backup / NOME_SCRIPT_PROJETO)
    destino_script.write_text(script_origem.read_text(encoding="utf-8"), encoding="utf-8")

    css_path = raiz / "src" / "index.css"
    css = css_path.read_text(encoding="utf-8")
    if "/* EDEN_REVISAO_MOBILE_E_MENU_V67 */" in css:
        css = css.replace(
            "/* EDEN_REVISAO_MOBILE_E_MENU_V67 */",
            MARCADOR_CSS,
            1,
        )
        css_path.write_text(css, encoding="utf-8")
    elif MARCADOR_CSS not in css:
        css_path.write_text(css.rstrip() + CSS_MOBILE_MENU, encoding="utf-8")

    atualizar_workflow_nativo(raiz / ".github" / "workflows" / "compilar-apk.yml")
    atualizar_workflow_nativo(
        raiz / ".github" / "workflows" / "gerar-aab-play-store.yml"
    )
    atualizar_workflow_web(raiz / ".github" / "workflows" / "publicar-app-eden-web.yml")

    script_v67 = raiz / "aplicar-revisao-master-web-v67.py"
    if script_v67.is_file() and script_v67 != destino_script:
        shutil.copy2(script_v67, pasta_backup / script_v67.name)
        script_v67.unlink()

    print("APP EDEN - REVISAO MASTER, WEB E MOBILE V68 INSTALADA")
    print(f"Backup salvo: {pasta_backup}")
    print(f"Script incorporado ao projeto: {destino_script}")
    print(f"Nova versao Android / Google Play: {VERSAO} ({CODIGO_VERSAO})")
    print("CSV no celular: salvar ou compartilhar em Arquivos, Drive, Sheets ou WhatsApp.")
    print("Logotipo: corrigido no GitHub Pages e no aplicativo Android.")
    print("Mobile: corrigidos temporizador e transicao que provocavam oscilacao.")
    print("Master: botao de escudo para autorizar ou remover administradores.")
    print("Atividades: exclusao permanente no Firebase.")
    print("Menu: rolagem habilitada; clicar em Igreja retorna ao inicio.")
    print("Interface: demonstracoes e duplicidades removidas; botoes revisados.")
    print("Boletins: BOLETIM DO CULTO e Boletim Semanal.")
    print("Biblia: estudo por palavra no hebraico e no grego.")
    print("Oracoes: envio web e movel conectado ao Firebase.")
    print("n8n: presenca, estudo biblico e leitura diaria preservados.")
    print("Proximo passo: git diff --check e publicar as alteracoes no GitHub.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--aplicar-build",
        action="store_true",
        help="aplica as revisoes depois dos scripts visuais do GitHub Actions",
    )
    argumentos = parser.parse_args()
    raiz = Path.cwd().resolve()

    try:
        if argumentos.aplicar_build:
            atualizar_app_transformado(raiz)
        else:
            instalar_revisao(raiz)
    except (RevisaoEdenError, OSError, ValueError, json.JSONDecodeError) as erro:
        print(f"ERRO: {erro}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
