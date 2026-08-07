from pathlib import Path
import re

JAVA_DIR = Path(
    "android/app/src/main/java/com/jsonia/appeden"
)
MANIFEST = Path(
    "android/app/src/main/AndroidManifest.xml"
)
XML_DIR = Path(
    "android/app/src/main/res/xml"
)

if not MANIFEST.exists():
    raise SystemExit(
        "ERRO: AndroidManifest.xml não encontrado."
    )

JAVA_DIR.mkdir(parents=True, exist_ok=True)
XML_DIR.mkdir(parents=True, exist_ok=True)

PLUGIN_JAVA = r"""package com.jsonia.appeden;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NativeUpdater")
public class NativeUpdaterPlugin extends Plugin {

    private static final String UPDATE_PROVIDER_SUFFIX =
        ".appedenupdates";

    private final ExecutorService executor =
        Executors.newSingleThreadExecutor();

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString(
            "fileName",
            "Igreja-Batista-Eden-update.apk"
        );

        if (url == null || url.trim().isEmpty()) {
            call.reject("URL_INVALIDA");
            return;
        }

        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && !getContext()
                .getPackageManager()
                .canRequestPackageInstalls()
        ) {
            try {
                Intent settingsIntent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse(
                        "package:"
                        + getContext().getPackageName()
                    )
                );

                settingsIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                );

                getContext().startActivity(
                    settingsIntent
                );

                call.reject(
                    "INSTALL_PERMISSION_REQUIRED"
                );
            } catch (Exception error) {
                call.reject(
                    "INSTALL_PERMISSION_REQUIRED: "
                    + error.getMessage()
                );
            }

            return;
        }

        final String safeFileName =
            sanitizeFileName(fileName);

        executor.execute(() -> {
            File updatesDir = new File(
                getContext().getCacheDir(),
                "app-eden-updates"
            );

            if (
                !updatesDir.exists()
                && !updatesDir.mkdirs()
            ) {
                call.reject(
                    "NAO_FOI_POSSIVEL_CRIAR_PASTA"
                );
                return;
            }

            File apkFile = new File(
                updatesDir,
                safeFileName
            );

            try {
                if (
                    apkFile.exists()
                    && !apkFile.delete()
                ) {
                    throw new Exception(
                        "Falha ao substituir APK temporário."
                    );
                }

                downloadFile(
                    url,
                    apkFile
                );

                getActivity().runOnUiThread(() -> {
                    try {
                        String authority =
                            getContext()
                                .getPackageName()
                            + UPDATE_PROVIDER_SUFFIX;

                        Uri apkUri =
                            FileProvider.getUriForFile(
                                getContext(),
                                authority,
                                apkFile
                            );

                        Intent installIntent =
                            new Intent(
                                Intent.ACTION_VIEW
                            );

                        installIntent.setDataAndType(
                            apkUri,
                            "application/vnd.android."
                            + "package-archive"
                        );

                        installIntent.addFlags(
                            Intent.FLAG_GRANT_READ_URI_PERMISSION
                            | Intent.FLAG_ACTIVITY_NEW_TASK
                        );

                        getActivity().startActivity(
                            installIntent
                        );

                        JSObject result =
                            new JSObject();

                        result.put(
                            "size",
                            apkFile.length()
                        );

                        call.resolve(result);
                    } catch (Exception error) {
                        call.reject(
                            "ERRO_ABRIR_INSTALADOR: "
                            + error.getMessage()
                        );
                    }
                });
            } catch (Exception error) {
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                call.reject(
                    "ERRO_DOWNLOAD_APK: "
                    + error.getMessage()
                );
            }
        });
    }

    private void downloadFile(
        String sourceUrl,
        File target
    ) throws Exception {

        URL currentUrl = new URL(sourceUrl);
        HttpURLConnection connection = null;

        for (
            int redirect = 0;
            redirect < 8;
            redirect++
        ) {
            connection =
                (HttpURLConnection)
                currentUrl.openConnection();

            connection.setConnectTimeout(20000);
            connection.setReadTimeout(90000);

            connection.setRequestProperty(
                "User-Agent",
                "App-Eden-Android-Updater/1.1"
            );

            connection.setRequestProperty(
                "Accept",
                "application/octet-stream,*/*"
            );

            connection.setInstanceFollowRedirects(
                false
            );

            int status =
                connection.getResponseCode();

            if (
                status >= 300
                && status < 400
            ) {
                String location =
                    connection.getHeaderField(
                        "Location"
                    );

                connection.disconnect();

                if (
                    location == null
                    || location.trim().isEmpty()
                ) {
                    throw new Exception(
                        "Redirecionamento sem destino."
                    );
                }

                currentUrl =
                    new URL(
                        currentUrl,
                        location
                    );

                connection = null;
                continue;
            }

            if (
                status < 200
                || status >= 300
            ) {
                throw new Exception(
                    "Servidor respondeu HTTP "
                    + status
                );
            }

            break;
        }

        if (connection == null) {
            throw new Exception(
                "Muitos redirecionamentos."
            );
        }

        long contentLength =
            connection.getContentLengthLong();

        long totalBytes = 0L;
        long lastProgressAt = 0L;

        try (
            InputStream input =
                new BufferedInputStream(
                    connection.getInputStream()
                );
            BufferedOutputStream output =
                new BufferedOutputStream(
                    new FileOutputStream(target)
                )
        ) {
            byte[] buffer =
                new byte[64 * 1024];

            int read;

            while (
                (read = input.read(buffer))
                != -1
            ) {
                output.write(
                    buffer,
                    0,
                    read
                );

                totalBytes += read;

                long now =
                    System.currentTimeMillis();

                if (
                    now - lastProgressAt >= 200
                ) {
                    notifyProgress(
                        totalBytes,
                        contentLength
                    );

                    lastProgressAt = now;
                }
            }

            output.flush();
        } finally {
            connection.disconnect();
        }

        if (target.length() <= 0L) {
            throw new Exception(
                "APK baixado está vazio."
            );
        }

        notifyProgress(
            target.length(),
            contentLength
        );
    }

    private void notifyProgress(
        long bytes,
        long contentLength
    ) {
        JSObject data = new JSObject();

        data.put(
            "bytes",
            bytes
        );

        data.put(
            "contentLength",
            contentLength
        );

        if (contentLength > 0L) {
            data.put(
                "percent",
                (bytes * 100.0)
                / contentLength
            );
        }

        getActivity().runOnUiThread(
            () -> notifyListeners(
                "downloadProgress",
                data
            )
        );
    }

    private String sanitizeFileName(
        String name
    ) {
        String safe =
            name == null
                ? "Igreja-Batista-Eden-update.apk"
                : name.replaceAll(
                    "[^A-Za-z0-9._-]",
                    "-"
                );

        if (
            !safe.toLowerCase()
                .endsWith(".apk")
        ) {
            safe += ".apk";
        }

        return safe;
    }

    @Override
    protected void handleOnDestroy() {
        executor.shutdownNow();
        super.handleOnDestroy();
    }
}
"""

plugin_path = (
    JAVA_DIR
    / "NativeUpdaterPlugin.java"
)

plugin_path.write_text(
    PLUGIN_JAVA,
    encoding="utf-8",
)

java_main = list(
    Path(
        "android/app/src/main/java"
    ).rglob("MainActivity.java")
)

kotlin_main = list(
    Path(
        "android/app/src/main/java"
    ).rglob("MainActivity.kt")
)

if java_main:
    main_path = java_main[0]

    text = main_path.read_text(
        encoding="utf-8"
    )

    if "NativeUpdaterPlugin.class" not in text:
        if "import android.os.Bundle;" not in text:
            package_line = re.search(
                r"(?m)^package\s+[^;]+;\s*$",
                text
            )

            if not package_line:
                raise SystemExit(
                    "ERRO: package Java não encontrado."
                )

            text = (
                text[:package_line.end()]
                + "\n\nimport android.os.Bundle;"
                + text[package_line.end():]
            )

        empty_class = re.compile(
            r"public\s+class\s+MainActivity"
            r"\s+extends\s+BridgeActivity"
            r"\s*\{\s*\}",
            re.DOTALL,
        )

        replacement = """public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}"""

        text, count = empty_class.subn(
            replacement,
            text,
            count=1,
        )

        if count == 0:
            on_create = re.search(
                r"public\s+void\s+onCreate"
                r"\s*\([^)]*\)\s*\{",
                text
            )

            if not on_create:
                raise SystemExit(
                    "ERRO: onCreate Java não encontrado."
                )

            text = (
                text[:on_create.end()]
                + "\n        registerPlugin("
                + "NativeUpdaterPlugin.class"
                + ");"
                + text[on_create.end():]
            )

        main_path.write_text(
            text,
            encoding="utf-8",
        )

elif kotlin_main:
    main_path = kotlin_main[0]

    text = main_path.read_text(
        encoding="utf-8"
    )

    if (
        "NativeUpdaterPlugin::class.java"
        not in text
    ):
        if "import android.os.Bundle" not in text:
            package_line = re.search(
                r"(?m)^package\s+[^\n]+\s*$",
                text
            )

            if not package_line:
                raise SystemExit(
                    "ERRO: package Kotlin não encontrado."
                )

            text = (
                text[:package_line.end()]
                + "\n\nimport android.os.Bundle"
                + text[package_line.end():]
            )

        empty_class = re.compile(
            r"class\s+MainActivity"
            r"\s*:\s*BridgeActivity\(\)"
            r"\s*\{\s*\}",
            re.DOTALL,
        )

        replacement = """class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(NativeUpdaterPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}"""

        text, count = empty_class.subn(
            replacement,
            text,
            count=1,
        )

        if count == 0:
            on_create = re.search(
                r"override\s+fun\s+onCreate"
                r"\s*\([^)]*\)\s*\{",
                text
            )

            if not on_create:
                raise SystemExit(
                    "ERRO: onCreate Kotlin não encontrado."
                )

            text = (
                text[:on_create.end()]
                + "\n        registerPlugin("
                + "NativeUpdaterPlugin::class.java"
                + ")"
                + text[on_create.end():]
            )

        main_path.write_text(
            text,
            encoding="utf-8",
        )

else:
    raise SystemExit(
        "ERRO: MainActivity não encontrado."
    )

manifest = MANIFEST.read_text(
    encoding="utf-8"
)

permission = (
    '<uses-permission '
    'android:name="android.permission.'
    'REQUEST_INSTALL_PACKAGES" />'
)

if permission not in manifest:
    application_index = manifest.find(
        "<application"
    )

    if application_index == -1:
        raise SystemExit(
            "ERRO: <application> não encontrado."
        )

    manifest = (
        manifest[:application_index]
        + "    "
        + permission
        + "\n\n"
        + manifest[application_index:]
    )

update_authority = (
    '${applicationId}.appedenupdates'
)

update_paths_marker = (
    '@xml/app_eden_update_paths'
)

provider_already_correct = (
    update_authority in manifest
    and update_paths_marker in manifest
)

if not provider_already_correct:
    provider = """
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.appedenupdates"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/app_eden_update_paths" />
        </provider>
"""

    application_close = manifest.rfind(
        "</application>"
    )

    if application_close == -1:
        raise SystemExit(
            "ERRO: </application> não encontrado."
        )

    manifest = (
        manifest[:application_close]
        + provider
        + manifest[application_close:]
    )

MANIFEST.write_text(
    manifest,
    encoding="utf-8",
)

paths_xml = """<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path
        name="app_eden_updates"
        path="app-eden-updates/" />
</paths>
"""

paths_path = (
    XML_DIR
    / "app_eden_update_paths.xml"
)

paths_path.write_text(
    paths_xml,
    encoding="utf-8",
)

manifest_final = MANIFEST.read_text(
    encoding="utf-8"
)

validations = [
    (
        plugin_path,
        '@CapacitorPlugin(name = "NativeUpdater")',
    ),
    (
        plugin_path,
        'UPDATE_PROVIDER_SUFFIX =',
    ),
    (
        main_path,
        "registerPlugin",
    ),
    (
        MANIFEST,
        "REQUEST_INSTALL_PACKAGES",
    ),
    (
        MANIFEST,
        '${applicationId}.appedenupdates',
    ),
    (
        MANIFEST,
        '@xml/app_eden_update_paths',
    ),
    (
        paths_path,
        '<cache-path',
    ),
]

for path, marker in validations:
    text = path.read_text(
        encoding="utf-8"
    )

    if marker not in text:
        raise SystemExit(
            "ERRO: validação nativa falhou: "
            f"{path} -> {marker}"
        )

provider_count = manifest_final.count(
    '${applicationId}.appedenupdates'
)

if provider_count != 1:
    raise SystemExit(
        "ERRO: provider de atualização deveria "
        f"aparecer 1 vez, apareceu {provider_count}."
    )

print(
    "NativeUpdater Android corrigido e validado."
)
print(
    "Authority:",
    '${applicationId}.appedenupdates'
)
print(
    "MainActivity:",
    main_path
)
print(
    "Manifest:",
    MANIFEST
)
