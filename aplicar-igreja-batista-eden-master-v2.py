# IGREJA BATISTA EDEN - MASTER V2 CORRIGIDO LINHA 124
# Destino: raiz do repositorio
# Nome no GitHub: aplicar-igreja-batista-eden-master-v2.py
# Nao coloque em .github/workflows.

from __future__ import annotations

import base64
import zlib

PAYLOAD_PARTS = [
    "eNrtXE9z27iSv+tTYJStJ+lFYmxPMskocbKyY8+kyo5ddiaHtV16EAVJSEiCwz/+Mx6d9rDfYW9T7zD1DnN8l736i203AJIg",
    "CcpyZvbtq9p1JbZEAI1Go/uHRqPBWSR8EtJk4fEJ4X4oooQcw9eW/hyxVmt0fDw+Hn34nmzLom47jtwnozB0kvi63Wsdjk4/",
    "7J2M9w5H7w6gSnvOPZ9GrkgTMYl4Iv517lPuOa7w262Peyen747eYzWfxgmLBpfPB66IIuZSMfB4sKCDza2n7VarNWUz6D30",
    "qMvGInBZN2HXyZDESdQnwpvqTwG70p9YFIlIfu6RwWv8O2wR+OEzrE4CkRAeEElEPsefiPKYkdMb4MTfu+ZJVxLpyfKIJWmk",
    "Gjiajy4Qkl32yWZPswiycxdjNZgxn7Ig4clNwWuNl7YrgjghZaG17eyBGD+zCIXFruVsQIc09RIySwM34SIgMAvdHrlt502Q",
    "ADQoCS4vzCr0S09UL+VnMyubpHNrPlh2Xp4H58GtIrBsl0m0905OjoYwqLvfXC5IGPHA5SH1yFQQGnrcpQm/FCS4+6sgLIDu",
    "kohOhVMMBSSMf9IYBFtIghDF2Rk+7xNP0CkP5nr6L6AGPB+lyeI0oQnrUvjUe9muCJ/Hh3K+GgX/BVI02GwsII9Ju43MVNnI",
    "B/rGYWgsb5xEHIgrFu3SmHV7ThJxH+Z5e3u7NCMvgZpV6CxOQJagLgQEgCrp0rtfUdD3SluPvKT1eZ02sCjl+qpDpz4POuRn",
    "0vFA6SP5yWf+JBKd193sU8/gzmirjEU2eTCZzdbazAYi8qnHf2LTPZSplF6nGZw6JrO2tqbk2yYbgArjMBIz7rHxxBPuZ9TT",
    "djsjBnrX/QqHwqLTgIYww2FyA0ZrTJzSB1XnLU0oEDAaTIUbn21cOFMoAS2gMTmUhS8NCjFLfgD9OREe6xZ0HNSpDzchIz8X",
    "gu1Z2r1lIY0SH1Tl3dRsPzWeI40g9bxSexycrT8pbDW7PezkXTzCL90kSplBYEmYBwiMVLCp0v57Z6osPHPoWZeVIa7uvZFY",
    "XWBLtF/5DVaB+ya9VQaBB5l2YZcr2FN2tOZg7XNdmVBjPh6ssuVFZR31bRiYhVCjMht1ezaCpcE2EbZpeSPhtTT+ttTVqklZ",
    "/iHaqJycikI2LWt2vLQiWXl1qel8uXizuphIaYxdUPQxD6bsOut7Bt+62lSwNJPbsN3LRlNvuk0Gmys8N73yJcyjqjEHrwtd",
    "DFpZ9KjTLrEXsznOvObtrNrx8CKXcFuaBVcz+UOAAmBT8qc/ka+ylbyX+xMl2gXbTVTubWgdc6nUWP5hbn5MGTpdIgIdAqfa",
    "KpKZ4HZfwJhCm5xK3+2K1DDI/v2VKvJcS8PWZq3zarFJXI/G8Xvqs+02zvjg6bUHogiSwQQqf5ZaMIg98FQG325sEJCN+xk8",
    "zEHC5wt01ngCjoHbfn1MecA89LEO0HWhwd2v9NWTxebrTsFzp9N5NeWXr2sT9QfyUaNNyG0mP0sZIW9IR/OuKnWstYZ5rdII",
    "O8v6WHDQrVYjEzijXUsfr0JTBH4y2FJjvo5rYjh7tLH7bPTt2wvrcIkeyJCUtye2Pp+EdQq9as1XT3DSYPIa/E692wspiKfY",
    "mhhqZpDyBW7UHCAI1s0TTr3t21siQurCPnFINshySYoZ6NCA+zDlpTqblTqG1MLJYOsp8HM9uBpsgf741wPw+MHwrwdPSZjA",
    "Xrr9+jzomMwjBB3/sHPwbnd09x93/35EdvfefzgZHbz7t9Hb0X0wZI4c94OdztpTjoZQmvDJ4DmJRAogOx2cbb0Iry/IZD6Y",
    "AxZx6HOQiMEkIrNI+Dj9L7b2n31zQeBhrgskHHyj1ONqwRNG4gWg2NUApKA/TbxU2s6TzWcWvanyM/NglQE6fjyA3RNstuc0",
    "HDy1Kly16dVg8ylZ4K94Advcz4ONfGA4KTAqySHwQYxeXBgliOpTGid8dqO/Nij4q9MFZ950d8HAJEo9v4COX7TJEyufUo9b",
    "DSNo6CmsAdPZ5gZOjmGUaRiySK7cOSydbThbW8y/MGbkyfONhuEQ0qiBdqbQbO0li60KimxqFDHBtJGNURGI0JorvzQwsdhq",
    "4qIBymKfeEwGKAYROCbXsLwZ4nnxrJGvIzIBny/hPgnTCbIIu/kAd/Xod8NvcArvfiEx9TCCIhqI7POITXCSGKHg4DJXNgpE",
    "bMRfYjKF/8q1jJ0mbmLCLkE9oSZwQmPpL8QkoGQ0Z8GUkoT6k7u/+SQGt6KBRswDNxIB/0k2RZACnAMmEF+Y0zzrjVq91mPL",
    "Q0D7FuBWy/TJbID+Bf6Ydr8o7A2SNKIY6SqttI2e6Bd6WRa2+/dVII9LT+/xr4wg6Nmw6hpfAK0Sl61STFT1esljPuHeiqAo",
    "bGIOOIiMEli3lLgCdE4jUBABHFCPuBFHCwiZJ0gMX8KEfNxy8t3PI7Jv1gaFDO9+mXPQz73r0BMRjRQFKh1ipfzRwHGcweWW",
    "E94o7fNFxIDnBEQTyNgfhhpCbu5Ho3b3zfGrMGIzfv1abVywVWdIzm/P4z+3jYpqe8xk9+wd4j3QPD/rtSvEJmJ689r585ta",
    "QZzOsJfzAAifX7w0PWFg7e3Rh9HBQb/klCD/Pkoeo0fGYJyY0chdSPHn+yvU7qLFin2VLbzocUSi0uBsMq9vMmg94CiZQClk",
    "XEuGnDksoGG3gwWdXjbLI3LJIsQYmH1FPRRxnHKyK4IZn4PJ3f1693cWI1TCKGgU0RuHHMOc8zgWuXppalPANARSsHL4zTFe",
    "CoCZKEQiFH4hOJIZcxfymYynmoN2cn/qkuMxRBbNpDH5CA9yXyofYiFmZRvoB6iwkSFlUMtuN3ekfv65FkzGaIAZbVhdR8VV",
    "e63yDuDstoafHsCWNyQrtg7rbByMbYMgB3e/Yef9Wj0ezMR9XY3yHasKXc8BIaRt83nEPtGGzr+DRRJrq7YwrdSz9Q/6OCSn",
    "LElgaY7r5db5rNRaXrTKfZ9d9Po5JKnoDay6gErlzYGCvNJXXIEyHXEiGDIPuz0HVtb4iuN5W79dnj8ZJ4KnLctmHWM0SKzW",
    "Z924FJBVdOOxhZVKhXxcleeFUtsolrpW6GZ03bMFqc6GRkvplHd7uOjkY3ysqhm1QGjdXhazeUR2EAMIbqJRecDaMD4UE9hk",
    "wAKmDRg+fE5EOMZTwlIMFzY03QaDsxsZbntencLnCY0QIQh1wceCzZz6i0pk0llKPdy+zfRwqWxw+7xdNaHzNhHBLixbn7dv",
    "MVj8GiODo5xoHvZewj5gmcFJNq4Ae62OywAY8r8xxmKrWEMVK4YsHyiADJrNyV0rHmo06JsilEe+yvgQ8b9wFO01z6Ftq+5E",
    "SGQrnMqcLnrik5Kmr47v1Z278mG2jG7H67luhwIhWob0I7UnkCFYgF8XsLePNncIo4M9CJ6NR5J/tQyb/ttRNjpZF4DJ5TEF",
    "RzriUe5PAC01rmMWzbinjBeawU6ibruv3tPLleqp49hS0Ver7iGgy/ci4j/hzssrjBRZvdcws26kZmaWqZmuGea9TEtv08bx",
    "P2g0sv98KJmNGXOwlokV9fuGKKwG9jC+1rWuskFJlZtmFgSuCXgNIrKbUO6KvpM+Y2TqvcUrznYd5X3L/283/sm3GxW3XuPh",
    "Wo69qmv37G8zH7ujtabT155w5wCHCNaQxi6MNIuyCKwgXVU8BYz7pIEhsuybPf1f8zsNmf/TOJ4ZPqQ++TGl04gHC1GAhSAL",
    "4bMPYO1xQ2xDksFKD8cIbNWMEUXHvwsg8Dd+1D7Eefd+xJCjyRDDHFojYhQtvggxiqFOy17JelAhe9dQUXDSABVVy84xIqdS",
    "w4iEo2tdxYiWZU9e4EWrvotV0FAqmFD381yeQAwrm9ZO4wnL3vP9r/d39QnL22d73+4/v7D0tys8zLLslI/lKhX1Yj0k9sVa",
    "o5dp3mUAQzNDudWwpD4NDViSS70JS4w5sDX9IswwWlYwQw5GY4ZRq4IZR+D4ik8sEYQmKWjpp7tfsgAX+sLUxA+1BXDILo0F",
    "QdUOstD7I1gp1YLpA/rQPGQ2SzEm3dfRrohQAeqlkgRPWJz6oghn3RI+NZaZvm3dKnSPNPldArq+5MrJ1SSzRwZN1XlO8kME",
    "UoGd4g8hKoUZpM/JWTt7UIIECDM2N1LmCXcGDhH1DXiIa+kR6yfVaL771qeYE3oe1A7PHzgD/WqiRH/dzV68oBGbjieph+dN",
    "QdNOzxMu9VTSz70rUpYcdn6WUT2OmJdOWR+hYKf87PwCVpu2pXVML1lRV8xxPmDJ6p5LTDm/rTRDGZ4vX9pWIXMRyoarM/Yi",
    "eYKtM4rX4PaiyNVVCcadjsoOq5D4LmL4Z16ikT1cl8j3N35QIoAP1m18wnRitNFeP1uXxLG0p4oY8NG6BI5muJeqMJE9XJfI",
    "IYtjOi+zoZ+tS2IHfIC4ykf28D4iaseuG/0QTqHKdOdGqZlBLi+BAp2Gvja5UdJEbpQ8hNy7+BhPi+MFjrVK0SysEp1R8OxN",
    "unbjo/FN4OpF/baV5zbrDK4i6/GKB1Nx5VCPRQYGd06FPlrRh9g6dCZS9JKLBLUpbFw65HHRLhQA0PocHKpnR+NOdgSQZ0Qq",
    "jFPflq1VAsjyMFUaeXSTs66GfyUiqBYWIy/cslACAYdNWwUudCZvgT8xTafUpeIowt9F/QwGag2AMbErgnnE5tTlIqBe0QhN",
    "v9bAYxzX9B0uRVNU1nZeq+/LCRAHIr1EJ65s57XaU/4T90V8BOaa0LionhlwnTwL0Cr9Gj/aXGsNJrC+UrHPSyPN7LJWO1Sz",
    "x2BhxNkrCtLM9IaVjOs3zpTHsCLfYF5G+ZjMuGxRLjAzyCxdyOsAw0ZCq5uPYGX9wH3M4/BDJxBXuVu6zFOM6RXlCartW+EW",
    "tjOFL9NJn3RcedLZwU+LFDZNHUNAt1W9XZplPovmTIkuTzruVbql06n01HlycyDmhunu6GyU4ywbxUxy1N3pczpwq9zUwxw0",
    "XZcS3LbDxgITP4xkk06NiQbc2Kmmwjhkz6vktJhXikrgITtNk8jescq7duWmVF/+KkEB9OzIxwY7e/AdvecckTQeDQ2ZyDbr",
    "ju99thtFZ//ut0vwSC1oVx7WRzDBGf8x1WjKrmVmCQaEQhb5HOj8XR1fZ0lA9VHP0O68AvqaoDJbHLJs9eXLPH1GXoOC/lOZ",
    "sWLxEZ04nQRd0+nqm422N/MdtCLy1TZZI8kbc0NS7+6XiAvVKQ40S5haFbdV1mNL2Sxd3MCbCo5ckE6ZC4tKjxSeZht3s0WR",
    "Wj9rDV6WLgjpbuXqqXzOVq27suna7lqE+WpkaVC9+1DxW7u6sZMtX/IORe3qSNVTzZuV17LVjXGpyhvW17TVjfXSlbcvL3Gr",
    "26p1LG9aWu1Wt8yWtLxtee1b3VivbkW/5WVwdeNstctbG2vi6pa5w5k3zRepvGHl2kql4ijBy0hv4aPlwkrNEa1upmvENC28",
    "0wRCB6sE51IKtRMmg52TSoymfAmmfvWlgYmKPIzbMzkoZXcsbGb1x933LEHJiiLY3xvmb72tWaRG6hUUNM6tZDTleS/rxS5n",
    "ePEDoWkcoOsDAzagruK4mvceqz6qrQzt2/Zcm66tSFmmrSSzPFuZNixbUWY2uqz3gDtOs/YrHoRpQi6pl2Ki/W0hqOWyeos5",
    "rx3B6I4C7wYaZBue5XI9GrWsSpw3gKZ7rg7YMs3DwTMS+8Nw8Ny8EBCHMMrBzeApppqfPdrf39/b37mwZv6fGmm4wIdvOGQN",
    "toEjS+PxRFzXE/5tLJYy30WE6QnqD3C2u7+3ubd/odjc299/jhHndbPsrQn6XzclzMtU+V0euR7bKmfMf0MW8D/P1JeRbOZj",
    "2sR08M3Ghsylt9NsTJq3ps3Hvu0ey+jrzWcvLhoTvwlZMUNNfTdmx1sy0zfzSzbWzHR14QjF0Mzh7cQSpGj6eUP+cvefHjhm",
    "NHNqJcgNyb/UySz/soLQEBxlFixSP/f0pMucp8dTcK6p01l+gZBua+GdpjtL9wpVzTimQhjifLZSnKTYVWF+8tDCzrKZFXuO",
    "vPVa08r0+fvy6lum1/pl66WBeavK8KQ3xxzrggmeP6MYtZcN7/5rKmobgFWLI95ynaRJIoIGRFOFFhElNyFMuCpuW8rzLBVL",
    "/Mw2GyVcmkF9zFsdLAZnz77BGzeVS0TFzSfj1pMNarI7OVccVvdat7a5Px0dfBydkOOTo+9ORofqWo5FE9TIX+euFp5trZLk",
    "rV4pAQWsNwAbBX2/qB8ubIxoxXTisen2rS1iam/zD5iinK+hvvIHgGEbst3QrWNpNYFxR1+8ev/2iByPTkbkw9Hbo1PHcTqt",
    "RtjVTU6MBgT+He4d7pwcnXbs9yy1qtQvWwLF7hqrfUWwCkg3NzbQXVAS1ffnViJv80K2F8PMZJBx9zeM6wJmLLhKxcBsruxA",
    "0H456Qh9cgwuycNVeWC7/t2mBqjtLUuRlUaELaNrAWf90gl69VkljZTJ62NmiKnh7TDrHSDKC2Lx2Neb4YZjROSVyjtjY7Ra",
    "M/0RtnunC3GlbpThfZ5S4EmWv2e6GJPAurck4YnHQEE7ffjo60+4ZOpPTOXTcDwoBXBa9l6WXt/xhzFSTEzOkPHIrzzJGSye",
    "lBnNYsJGdLYSMdyTt/FWBEQrOliOHZajpVNrZLT6ZglTVmsleVYa9asSV6/QsiuWD75cVyrOexGwoZkSlL2LzJFJDnG3d3+0",
    "0Hhb2crgoB5F3gPu+Mb4sIuV0VXebqfJbPBCZ8XZRt0+j85hc4xH+u2e+TR7luV6APxgCkIqt/pRxPQ2X4FJqOLmsb6EhKnT",
    "oVBJquoNY4A8jBiXZx6pEDu+FgxjbACKFPUjoPjaLZ/xCIPEeE6vIww/pqoc80My6JIljjmyFdf4evV6DVnjxt6z4bJt25Kx",
    "y35MOaKKeXMRM9bOyu5g5c5S9f0StaT8agVbjn61zpdm+lvJPDCfuUKjKZGqWq8pb7VS7d4kE6PBRbF3wtMFMIZ75kY9L8dS",
    "RJS90g5m3D7HtfzU0mVciREWlrCijasvTA/KLPKvxm2FJ1nyFWzPwZRgwaRDUvfSHhO0dOeTAASzstRrestKjjtXETiNCnjU",
    "UYkdflQMlgfVDEitppg8hgeNl1RZmZMlO7E8jazMfVulPEUMDFj6MUzKgc/BJYpLm6jCShG4WxYosLwNsfc/gCy1mrZkpuZq",
    "FpclX5K0btq02/4Gx3613HjJ4O95C57ZuAlAjSqrfXWzZjkybpasihEa1ZrBdyXw3ge6fwDg/l6wXQdo1wDZtQFWI1mGFzal",
    "0zjYAKFV8GwGzuJtVpXeHphhLWFC3Z6Rk1SgogOPInRKI4Z7oRj9z7gKlTaYrAGkNsaHAGOrQMX2ScZi5k8NoU/9AtqeWXHX",
    "zEbKD15UfdPKS43KL3bAnuTBPfjWLvNSD3wwVruW57RLJDIcLho3X54rUn7LNLLcCPP1GuouQX7wX26wp1/kMc1f3iFHHPkK",
    "8/GGrB+qFylUWn7UicR6yB+f54KVIBGnLgCpcqdboF9jeRoyHuOb29rjMfr043F7qF+ghA5+678BVS+YAg==",
]

payload = base64.b64decode(''.join(PAYLOAD_PARTS))
source = zlib.decompress(payload).decode('utf-8')

compiled = compile(
    source,
    'aplicar-igreja-batista-eden-master-v2-interno.py',
    'exec',
)

exec(
    compiled,
    {
        '__name__': '__main__',
        '__file__': __file__,
    },
)
