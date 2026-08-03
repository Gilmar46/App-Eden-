# IGREJA BATISTA EDEN - MASTER V2 COMPLETO E COMPACTO
# Destino: raiz do repositorio
# Nome no GitHub: aplicar-igreja-batista-eden-master-v2.py
# Nao coloque este arquivo em .github/workflows.

from __future__ import annotations

import base64
import zlib

PAYLOAD_PARTS = [
    "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",
]

payload = base64.b64decode(''.join(PAYLOAD_PARTS))
source = zlib.decompress(payload).decode('utf-8')

compiled = compile(
    source,
    'aplicar-igreja-batista-eden-master-v2-interno.py',
    'exec',
)

scope = {
    '__name__': '__main__',
    '__file__': __file__,
}

exec(compiled, scope)
