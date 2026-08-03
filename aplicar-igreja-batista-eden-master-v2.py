# IGREJA BATISTA EDEN - MASTER V2 CORRIGIDO BUILD WEB
# Destino: raiz do repositorio
# Nome no GitHub: aplicar-igreja-batista-eden-master-v2.py
# Nao coloque em .github/workflows.

from __future__ import annotations

import base64
import zlib

PAYLOAD_PARTS = [
    "eNrtXM1z28aSv/OvmMBbj+QzSUuKHTu0ZS8lS4mrZEslOT6spOIbkkNyYgCD4EMfYXjaw/4Pe0vtIfUOOW29y171j233zAAY",
    "AAOSUrxvX9WuEkskMB89Pd2/6W50YxoKjwQ0nrt8RLgXiDAmJ/C1oT+HrNEYnJwMTwYfvye78lbLicLxk0EQ9OLoxmk33g/O",
    "Ph6cDg/eD94dQRNnxl2PhmORxGIU8lj888yj3O2Nhec0Ph2cnr07/oDNPBrFLOxeveiORRiyMRXdUcLdSfeajZxGozFhU5g9",
    "cOmYDYU/Zq2Y3cR9EsVhhwh3oj/57Fp/YmEoQvm5Tbqv8W+/QeCHT7E58UVMuE/kIPI6/oSUR4yc3QIl3sENj1tykLa8H7I4",
    "CVWHnqajBQPJKTtku61JBN6N50O1mCGfMD/m8W1Oa4UWZyz8KCZFpjl28oCNn1mIzGI3cjdgQpq4MZkm/jjmwiewC602WThZ",
    "FxwAOhQYl91MG3QKV9QsxWtTK5mkuTAvLJsvL/wLf6EGWDrFIZyD09PjPizq7vcxFyQIuT/mAXXJRBAauHxMY34liH/3H4Iw",
    "H6aLQzoRvXwpwGH8k0TA2JwThCjKzvF6h7iCTrg/09t/CS3g+iCJ52cxjVmLwqf2S6fEfB69l/tVy/gHcNEgs/YGeUwcB4kp",
    "k5Et9E2PobK86cXiSFyzcJ9GrNXuxSH3YJ93d3cLO/ISRrMynUUx8BLEhQADUCTH9O43ZPRabuuVF6Q+a+MAiZKvr5p04nG/",
    "SX4hTReEPpSfPOaNQtF83Uo/tQ3qjL5KWWSXew+z3diYWF+EHnX5z2xygDyV3GvWg1PTJNbW1+S8Y5IBqDAMQjHlLhuOXDH+",
    "jHLqOOlgIHetr3ApLDzzaQA7HMS3oLTGxil5UG3e0pjCAEaHiRhH51uXvQncASmgEXkvb740RohY/APIz6lwWSsfp4cy9fE2",
    "YOSXnLFtS7+3LKBh7IGovJuY/SfGdRzDT1y30B8XZ5tPMlvtbhsneRcN8EsrDhNmDLAkzAUExlGwq5L+tTtVZJ659HTK0hJX",
    "z147WJVhS9Rf+Q1OgXWb3iiCwL1UO9fLFeQpPdpwsfa9Lm2osR/3FtniobKJ+NYszDJQrTAbbdu2AQuLrRvYJuW1A28k8YvC",
    "VKs2ZflFpFEZOSWBrDvW7HhpRbLi6VKR+eLt7fJhIrkxHIOgD7k/YTfp3FP41tKqgndTvvWddrqaatdd0t1eYbnpky9mLlWd",
    "OVhdaGLQ0qFHe06BvIjNcOc1beflifuXGYcdqRZc7eQPPjKATcif/kS+Sk/ydmZPFMbOya4bZW1H65oLd43jH/bmp4Sh0SVC",
    "kCF/bmfJVHC7LWBsoY1Phe92QapZZGd9oxI/N5KwjUlrvppvk7FLo+gD9diugzvefXrjAiv8uDuCxp+lFHQjFyyV7rdbWwR4",
    "M/4MFmY35rM5Gms8BsNg7Lw+odxnLtpYR2i6UP/uN/rqyXz7dTOnudlsvprwq9eVjfqCdFTGJmSR8s9yj5A3pKlpV42a1lb9",
    "rFVhhc1ldS246Eajlgjc0ZZljleByQIv7u6oNd9EFTacP9rafzb49u2ldblEL6RPiu6Jbc4nQXWEdrnlqye4abB5NXan9vYC",
    "CuzJXRNDzIyhPIGOWg8GBO3mMafu7mJBREDH4Cf2yRZZLkm+A03qcw+2vNBmu9TG4Fow6u48BXpuutfdHZAf76YLFj8o/k33",
    "KQni7vaO8/rCb5rEIwSd/LB39G5/cPdvd/96TPYPPnw8HRy9+5fB28E6GDJXjv5gs7nxlqMiFDZ81H1OQpEAyE665zsvgptL",
    "Mpp1Z4BFHObsxqI7Csk0FB5u/4udw2ffXBK4mMkCCbrfKPG4nvOYkWgOKHbdBS7oTyM3kbrzZPuZRW7K9ExdOGVgHC/qgvcE",
    "zvaMBt2nVoErd73ubj8lc/wVzcHN/dzdyhaGmwKrkhQCHcSYZQyrBFb9mEQxn97qrzUC/upszpk72Z8zUInCzC9g4hcOeWKl",
    "U8pxo2YFNTMFFWA6397CzTGUMgkCFsqTO4Ol863ezg7zLo0defJ8q2Y5hNRKoJ0oVFv7nflOCUW2NYqYYFpLxiAPRGjJlV9q",
    "iJjv1FFRA2WRR1wmAxTdEAyTGzjeDPa8eFZL1zEZgc0Xc48EyQhJBG/eR68e7W74DUbh3a8koi5GUETNIIc8ZCPcJEYoGLhs",
    "LDv5IjLiLxGZwD9lWka9Omoiwq5APKElUEIjaS9ExKdkMGP+hJKYeqO7v3okArOiZoyI++NQ+Pxn2RVBCnAOiEB8Yb36Xa+V",
    "6o0uWy4C2jcAtxqmTWYD9AfYY9r8ouAbxElIMdJVOGlrLdEHWlkWsjvrGpDHhatr7CsjCHreL5vGlzBWgcpGISaqZr3iER9x",
    "d0VQFJyYIw4sowTOLcUuH43TEAREAAXUJeOQowYEzBUkgi9BTD7t9DLv5xE5NFuDQAZ3v844yOfBTeCKkIZqBCoNYiX8YbfX",
    "63WvdnrBrZI+T4QMaI6BNb6M/WGoIeCmPxo6rTcnr4KQTfnNa+W4YK9mn1wsLqI/O0ZD5R4zOT17h3gPY16ct53SYCMxuX3d",
    "+/Obyo0omeIsFz4MfHH50rSEgbS3xx8HR0edglGC9HvIeYweGYvpRYyG47lkf+ZfoXTnPVb4VbbwossRiQqLs/G86mTQasBR",
    "EoFcSKmWBPVmcIAGrSbeaLbTXR6QKxYixsDuq9EDEUUJJ/vCn/IZqNzdb3d/YxFCJayChiG97ZET2HMeRSITLz3aBDANgRS0",
    "HH5zjJcCYMYKkQiFXwiOZMrGc3lNxlPNRfcye+qK42OINJpJI/IJLmS2VLbEnM1KN9AOUGEjg8sglq1WZkj98kslmIzRADPa",
    "sLqNiqu2G0UP4HxRwU8XYMvtkxWuwyaOg+E2CHJ09ztO3qm04/5UrJtqkHmsKnQ9A4SQus1nIfuR1kz+HRyS2Fr1hW2lrm1+",
    "kMc+OWNxDEdzVL1v3c9Sq+Vlozj3+WW7k0GSit7AqQuoVHQOFOQVvuIJlMpIL4Ql86DV7sHJGl1zfN7WcYr7J+NEcLVhcdYx",
    "RoODVeasKpcCspJsPLaQUmqQrat0PRdq24iFqRW6GVO3bUGq877RUxrlrTYeOtkaH6tmRitgWqudxmwekT3EAIJONAoPaBvG",
    "hyICTgYcYFqB4cPnWARDfEpYiOGCQ9OqUTi7kqHb8+oMPo9oiAhB6BhsLHDm1F8UInOcpZTD3UUqh0ulg7sXTlmFLhwi/H04",
    "tj7vLjBY/Bojg4Ns0CzsvQQ/YJnCSbouH2ctr8sAGPK/scbcVaygihVDlvdkQArN5uZuFA81OnRMFspHvkr5EPEfuApnw+fQ",
    "tlN3JCSy5UZlNi5a4qOCpK+O71WNu+LDbBndjjYz3d4LhGgZ0g+VTyBDsAC/Y8DeDurce1gd+CD4bDyU9Ktj2LTfjtPVybYA",
    "TGMeUTCkQx5m9gSMpdZ1wsIpd5XyQjfwJKq6++oDvVopnjqOLQV9tei+B3T5XoT8Z/S83FxJkdS1iplOIyUz1UxNdEUx1xIt",
    "rU0bxX+n1cj5s6WkOmbswUYqlrfvGKywKtj96NpUu4oKJUVukmoQmCZgNYjQrkKZKfpO2oyhKfcWqzj1Oop+y/+7G//g7kbJ",
    "rNd4uJFhr9raLftFamM3tdQ0O9oSbh7hEkEbkmgMK02jLAIbSFMVnwJGHVJDEFl2zJn+r9mdBs//YQzPFB8Sj/yU0EnI/bnI",
    "wUKQufDYR9D2qCa2IYfBRvfHCOxVjxH5xH8IIPA3ftQ2xEVrPWLI1aSIYS6tFjHyHg9CjHypk6JVshlUyNk1VOSU1EBFWbMz",
    "jMhGqWBEzNG0LmNEw+KT53jRqHqxChoKN0Z0/Hkmn0D0S05rs/YJy8Hzw68P9/UTlrfPDr49fH5pmW9fuJhl2Sw+lis11Id1",
    "n9gPa41epnoXAUzy7D4oljH5S6AYDlaZsyoANShWJcXWYA2UoWjYuj0IyoyeJSiTK9VQZrQqQdkx2OPiRxYLQuMElOfHu1/T",
    "uBua6NSENeWZ9Mg+jQRBjfPTJwKP4ABX57gHoEizSN40wVB5RwfhQkIFSL3KXTxlUeKJPMq2IHxinH4d23GaqwSpMwcFTH3F",
    "le2th0wvGWOqybMhP4bAFXBgfwhQVs1nB9lw1snulbcBzIxM/8588J5iVkg9A7WiStbG5rk+mu6O9Sqmql74lWf699yBTjl/",
    "o7PaB5VO6BV1+QT82OGM+bD4mE2GMpIblbzQD8JnmRuKEWAGBzPVVoKKGeKjJjFC2Y1k/BC/g/xlB8OTQjg382n0uYRHZI7H",
    "TtbL6VuPYn3KrjiD68/hcpuao1jdrD2DS9wuHcOS60aOq7n2DZZkdz1Wuh8PWtXGi1iqzZriIx2Uj6FPPdZJNw9VMd3Hnnzg",
    "Dphm5DEoM8RqgZjaLR2XogWymUpPC6bIIqdwWX4KSGhw958RwUe7Ycik4NbnYqWui3EQOHjNKZINXNNLCp0l8nXhdGTf9kPX",
    "MaVuLBJydfd7OEsA2DGYwzCTAdQEgMpcYD31Nsp68r/Wl6ZPP7+RJHr41HwCpp/w4fxyLGOsXUEeHYvmNARIGiUuPqD360Jj",
    "rhhTV2VJrjXh02zai/N01JOQuckEpBlsp73itYtL0B7H0juiVyxvK2Z4UoAWti6kEXaxKHVDdL9YvrSZ7abVni5XpziHMuVH",
    "l2BsQO1lXtygKjKaTZVOWxriu5Dhn1lhjPTipoN8f+v5hQHwwqadT5muJDH662ubDnEixbXEBry06QDHUww+lYhIL246yHsW",
    "RXRWJENf23SIPTiXojId6cV1g6gQp+70Q4BH+WTvVomZMVx2B27oup2NhxvEdcMN4vsM9y46wfSaaI5rLY9o3iwPCmgTMXNc",
    "u/LR6NYfay9o0ciKQXTKa54mfs39ibjuUZeFBsQ1z4R+Fq2zfvSzBoC5xDMyeidwAjbJ47xfIADPdOIQNE9ziXrpM9MshVxZ",
    "Di/N47SGAWniuqq7CW8z0tXyr0UIzYJ85bndFEgg4KJPSnChSx9y/IloMqFjKo5D/J23T2Gg0gEIE2D4zUI2owrc806o+pUO",
    "LuPobexxyZq8sdbzSntPboA4EskVer1FPa+0nvCfuSeiY1DXmEZ581SBq8PD4Qla6VXo0epa6TACq4GKQ15YaaqXldaB2j0G",
    "JjvuXn4jSVWvXypRedOb8Ah8hVtMZCvmFRjVacUbZsqtZQpZP9WvHWh19wGcrB+5h4lvXtDzxXXmTS+zmgx6TXmMYvtWjHPd",
    "mcCXyahDmmOZGtLET/MEzI6mwaBFWW6X5j2PhTOmWJdVabRL09LJRIY2eHx7JGaG6u7p9L2TNH3PzArX02VOChknLibt6raU",
    "oAdDYiHdlzw7r1khogY39sq5gz1y4JaSAM0azAJ4yEmTOLRPrApVxtJ81tWyBSiAmXvyskHOAXxHvz5DJI1HfYMnss+m6/uQ",
    "hu8wDHH3+xX4yha0Ky7rE6jglP+UaDRlN9IIxwh6wEKPwzh/U/k+adZkddVT1Ds3h746qEwPh7S8Z/kyyzeUdaMwfyJT/Cw2",
    "Yi9KRn7LNLo6Zqfd7SzkqAb5apdsUBWDyXSJe/dryIWaFBeaZpiuetCltMeW416odMPSrp48kM7YGA6VtmFkOxj+y2+p87PS",
    "4WWholJPK09PZXM2KtMVVddWnBZkp5GlQ7lYrGS3tnTnXnp8yaKzSq1d2VLNuhXPstWd8ajKOlbPtNWd9dGV9S8ecav7qnMs",
    "61o47Vb3TI+0rG/x7FvdWZ9u+bzFY3B15/S0y3obZ+LqnpnBmXXNDqmsY6nOr9RwEGP15lv4aKnwqxiiZV+1MpgeC4tAgemg",
    "lWBcSqY2g7i7d1oKLRerBqu1gjVElPhhlBtmoJQWpdnU6ssVyBegZMUt8thUf2t5e55Lrk9QkLhxKQU0SxTc7GEPRpEihCYZ",
    "AMAFG1BXMlzNQvGyjWq7h/ptu65V13ZLaabtTqp5tntasWy3UrXR99r3KAqdOq+4HyQxBmYTrExa5IxaLsuvfchah7C6Y9+9",
    "hQ6pw7NcbjZGJQ0d9w2gaU2tla00J+g+I5HXD7rPzQqqKIBVdm+7T7E25/zR4eHhweHepbVU6syoWwA6PMMgq9ENXFkSDUfi",
    "plohZSOxUCokQsznUn+Asv3Dg+2Dw0tF5sHh4XN8RLdpWZK1ounrugojWVu0z8Oxy3aKJUbfkDn8y0qb5KM/5mGe2aT7zdaW",
    "LD6yj1lbZWStM4o8W+Hf4OvtZy8uaytlCFmxQ3Vz15YTWUp5trOqRGspj6rQRDbUU7gYWYIUdT9vyF/u/t0Fw4ymRq0EuT75",
    "p+owy7+sGKgPhjLz54mXWXrSZM7qiSgY17TXXD6ASYtKeKeuyHMtU9WOY+6Ywc5nK9lJcq8KCzr6FnKW9aTYi4qsdaAr643W",
    "FSI1TKv1YeelgXmr7mFqTIY51gMTLH9GMRguO97910RUHIBVhyO+FmCUxLHwaxBN3bSwKL4NYMPVbcdyP0vrs8TPbLtRwKUp",
    "tMdE/+68e/7sGyxRLFVd5qWiRpmoDWrSIsZrDqd7ZVrb3p8Njj4NTsnJ6fF3p4P3qo7RIglq5a8zUwufuq/i5EKflIAC1pLp",
    "WkavZ/X9mY0RrYiOXDbZXdgipvY+f4ctyujq6xppAAzbku2Kbl1Low6Mm7pS9cPbY3IyOB2Qj8dvj896vV6zUQu7usup0YHA",
    "/+8P3u+dHp817YXpWlSq1ekwYmuD077EWAWk21tbaC4ojuqC45XIW3+QHUSwMylk3P0V47qAGXOuctcw/TVNVbBXcx6jTY7B",
    "JZn2IVNJNi8GrYHa9rIQWalF2CK65nDWKST+lK+V8u6ZrLc1Q0w1r9Nak16vgzuyojYaetoZrnmMiLRSWWQ7RK0188XB3Tub",
    "i2tVgosFkIXAk7z/genb+Ey+tSAxj10GAtrswEdPf8IjU39iKgGRYwoHgNOy/bLwvqMvRki+MRlBxiWvdCUjML9SJDSNCRvR",
    "2VLE8ECWL68IiJZksBg7LEZLJ9bIaPlVPCavNsqKL3XqlDmu3jloFywPbLlWKSlGJy+kL2/syfSrQhJEXbTQeL3jyuCgXkU2",
    "A3p8Q7zYwsZoKu86STztvtAJeLZVOxfhBTjHmGzktM2r6bU0Cw3gB5OjEunqqzwJdPMVmAQqbh7pp/5YaxIIldWvXskIyMOI",
    "UW34SIXY8T2KGGMDUKQoHz7F9xR6jIcYJMbn9DrC8FOi7mPmWgpdKlPDXNmKuud2tV1NmY3he9a8ncCxlDiwnxKOqGKWemMS",
    "znnRHCwVeZZfyFOpYio3sBU1lds8tDTKOsw9C0BKY9Rlnpbb1SX6l5qtTX8zOlzmvhM+XQBlWLM36noxliLC9B2gsOP2Pa4k",
    "9BfeXiAxwkISNrRR9cDExTxzKS/vepKmhYJ7DqoEBybtW3JvHhPU9N6PAhDMSlK7LplodZ5g3i3Dp+sQjEsFUOqRih2mVKyW",
    "++XUci3OmP6KDySvqNLGXpquybJE2OIqHZW0GTJQdJWBKPnFZ2A6RQVnK9dmBPiGBTIsr5lt/w8gUKWlLempvpnFtMmOLi3D",
    "Ni2wvxq3U75vvL31j7xe1OxcB7RGk9U2vdmyGEE376yKJRrN6kF6JUCvA+cvAMx/FJQ3AeQNwHhjINaIl+KKTeg0XtZAbRlk",
    "6wE2f01gabZ7lq5ImFBliXKTcvTswaUQjdeQoc8UoZ0alSHVBqcVINXKuAmA3gc8GzlyOqfpMlLbrA906bd/t82G+2ZmU/YQ",
    "R7U3kaDQqfhWHZxJJgGAnT5mbuKCPccqNdE9pzBEitV55/rK5bywoThGmmdhvttIFXJlSQTFDgf6LUqT7M1JcsWhl2amg2QE",
    "6i02pZ6fdLmEXvKnFxljJZBEyRjAVpnmDZDBoXyyMhziazOd4RD9g+HQ6eu316Gz0PhvxvIZ1g==",
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
