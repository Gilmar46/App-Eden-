from pathlib import Path
import re

JAVA_DIR = Path("android/app/src/main/java/com/jsonia/appeden")
MANIFEST = Path("android/app/src/main/AndroidManifest.xml")

if not MANIFEST.exists():
    raise SystemExit("ERRO: AndroidManifest.xml não encontrado.")

JAVA_DIR.mkdir(parents=True, exist_ok=True)

PLUGIN_JAVA = r"""package com.jsonia.appeden;

import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.os.Build;
import android.provider.Settings;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NativeUpdater")
public class NativeUpdaterPlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName", "Igreja-Batista-Eden-update.apk");

        if (url == null || url.trim().isEmpty()) {
            call.reject("URL_INVALIDA");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getContext().getPackageManager().canRequestPackageInstalls()) {
            try {
                Intent settingsIntent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName())
                );
                settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(settingsIntent);
                call.reject("INSTALL_PERMISSION_REQUIRED");
            } catch (Exception error) {
                call.reject("INSTALL_PERMISSION_REQUIRED: " + error.getMessage());
            }
            return;
        }

        final String safeFileName = sanitizeFileName(fileName);

        executor.execute(() -> {
            File updatesDir = new File(getContext().getCacheDir(), "app-eden-updates");
            if (!updatesDir.exists() && !updatesDir.mkdirs()) {
                call.reject("NAO_FOI_POSSIVEL_CRIAR_PASTA");
                return;
            }

            File apkFile = new File(updatesDir, safeFileName);

            try {
                if (apkFile.exists() && !apkFile.delete()) {
                    throw new Exception("Não foi possível substituir o APK temporário.");
                }

                downloadFile(url, apkFile);

                PackageInfo archiveInfo = getContext()
                    .getPackageManager()
                    .getPackageArchiveInfo(apkFile.getAbsolutePath(), 0);

                if (archiveInfo == null) {
                    throw new Exception("APK_INVALIDO_PARA_ANDROID");
                }

                if (!getContext().getPackageName().equals(archiveInfo.packageName)) {
                    throw new Exception("PACOTE_INCORRETO: " + archiveInfo.packageName);
                }

                long archiveVersionCode = getArchiveVersionCode(archiveInfo);
                if (archiveVersionCode <= 0) {
                    throw new Exception("VERSION_CODE_INVALIDO");
                }

                int sessionId = installWithPackageInstaller(apkFile);

                JSObject result = new JSObject();
                result.put("sessionId", sessionId);
                result.put("size", apkFile.length());
                result.put("versionCode", archiveVersionCode);
                call.resolve(result);

            } catch (Exception error) {
                if (apkFile.exists()) {
                    apkFile.delete();
                }
                call.reject("ERRO_ATUALIZACAO: " + error.getMessage());
            }
        });
    }

    private int installWithPackageInstaller(File apkFile) throws Exception {
        PackageInstaller installer = getContext()
            .getPackageManager()
            .getPackageInstaller();

        PackageInstaller.SessionParams params =
            new PackageInstaller.SessionParams(
                PackageInstaller.SessionParams.MODE_FULL_INSTALL
            );

        params.setAppPackageName(getContext().getPackageName());

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            params.setRequireUserAction(
                PackageInstaller.SessionParams.USER_ACTION_REQUIRED
            );
        }

        params.setSize(apkFile.length());

        int sessionId = installer.createSession(params);
        PackageInstaller.Session session = installer.openSession(sessionId);

        try (
            InputStream input = new BufferedInputStream(new FileInputStream(apkFile));
            OutputStream output = session.openWrite(
                "Igreja-Batista-Eden.apk",
                0,
                apkFile.length()
            )
        ) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }

            output.flush();

            // O Android exige o MESMO OutputStream retornado por
            // session.openWrite() ao chamar fsync().
            session.fsync(output);
        }

        Intent resultIntent = new Intent(
            getContext(),
            UpdateInstallResultReceiver.class
        );
        resultIntent.setAction("com.jsonia.appeden.UPDATE_INSTALL_STATUS");
        resultIntent.putExtra("sessionId", sessionId);

        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            pendingFlags |= PendingIntent.FLAG_MUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            getContext(),
            sessionId,
            resultIntent,
            pendingFlags
        );

        session.commit(pendingIntent.getIntentSender());
        session.close();

        return sessionId;
    }

    private long getArchiveVersionCode(PackageInfo info) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return info.getLongVersionCode();
        }
        return info.versionCode;
    }

    private void downloadFile(String sourceUrl, File target) throws Exception {
        URL currentUrl = new URL(sourceUrl);
        HttpURLConnection connection = null;

        for (int redirect = 0; redirect < 8; redirect++) {
            connection = (HttpURLConnection) currentUrl.openConnection();
            connection.setConnectTimeout(20000);
            connection.setReadTimeout(90000);
            connection.setRequestProperty("User-Agent", "App-Eden-Android-Updater/2.1");
            connection.setRequestProperty("Accept", "application/octet-stream,*/*");
            connection.setInstanceFollowRedirects(false);

            int status = connection.getResponseCode();

            if (status >= 300 && status < 400) {
                String location = connection.getHeaderField("Location");
                connection.disconnect();

                if (location == null || location.trim().isEmpty()) {
                    throw new Exception("Redirecionamento sem destino.");
                }

                currentUrl = new URL(currentUrl, location);
                connection = null;
                continue;
            }

            if (status < 200 || status >= 300) {
                throw new Exception("Servidor respondeu HTTP " + status);
            }

            break;
        }

        if (connection == null) {
            throw new Exception("Muitos redirecionamentos.");
        }

        long contentLength = connection.getContentLengthLong();
        long totalBytes = 0L;
        long lastProgressAt = 0L;

        try (
            InputStream input = new BufferedInputStream(connection.getInputStream());
            BufferedOutputStream output = new BufferedOutputStream(new FileOutputStream(target))
        ) {
            byte[] buffer = new byte[64 * 1024];
            int read;

            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
                totalBytes += read;

                long now = System.currentTimeMillis();
                if (now - lastProgressAt >= 200) {
                    notifyProgress(totalBytes, contentLength);
                    lastProgressAt = now;
                }
            }

            output.flush();
        } finally {
            connection.disconnect();
        }

        if (target.length() <= 0L) {
            throw new Exception("APK baixado está vazio.");
        }

        notifyProgress(target.length(), contentLength);
    }

    private void notifyProgress(long bytes, long contentLength) {
        JSObject data = new JSObject();
        data.put("bytes", bytes);
        data.put("contentLength", contentLength);

        if (contentLength > 0L) {
            data.put("percent", (bytes * 100.0) / contentLength);
        }

        getActivity().runOnUiThread(
            () -> notifyListeners("downloadProgress", data)
        );
    }

    private String sanitizeFileName(String name) {
        String safe = name == null
            ? "Igreja-Batista-Eden-update.apk"
            : name.replaceAll("[^A-Za-z0-9._-]", "-");

        if (!safe.toLowerCase().endsWith(".apk")) {
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

RECEIVER_JAVA = r"""package com.jsonia.appeden;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.widget.Toast;

public class UpdateInstallResultReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        int status = intent.getIntExtra(
            PackageInstaller.EXTRA_STATUS,
            PackageInstaller.STATUS_FAILURE
        );

        String message = intent.getStringExtra(
            PackageInstaller.EXTRA_STATUS_MESSAGE
        );

        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirmIntent = intent.getParcelableExtra(Intent.EXTRA_INTENT);

            if (confirmIntent != null) {
                confirmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(confirmIntent);
            }
            return;
        }

        if (status == PackageInstaller.STATUS_SUCCESS) {
            Toast.makeText(
                context,
                "App Éden atualizado com sucesso.",
                Toast.LENGTH_LONG
            ).show();
            return;
        }

        String detail = message == null
            ? "Código " + status
            : message;

        Toast.makeText(
            context,
            "Falha ao instalar atualização: " + detail,
            Toast.LENGTH_LONG
        ).show();
    }
}
"""

plugin_path = JAVA_DIR / "NativeUpdaterPlugin.java"
receiver_path = JAVA_DIR / "UpdateInstallResultReceiver.java"

plugin_path.write_text(PLUGIN_JAVA, encoding="utf-8")
receiver_path.write_text(RECEIVER_JAVA, encoding="utf-8")

java_main = list(Path("android/app/src/main/java").rglob("MainActivity.java"))
kotlin_main = list(Path("android/app/src/main/java").rglob("MainActivity.kt"))

if java_main:
    main_path = java_main[0]
    text = main_path.read_text(encoding="utf-8")

    if "NativeUpdaterPlugin.class" not in text:
        if "import android.os.Bundle;" not in text:
            package_line = re.search(r"(?m)^package\s+[^;]+;\s*$", text)
            if not package_line:
                raise SystemExit("ERRO: package Java não encontrado.")
            text = text[:package_line.end()] + "\n\nimport android.os.Bundle;" + text[package_line.end():]

        empty_class = re.compile(
            r"public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{\s*\}",
            re.DOTALL,
        )
        replacement = """public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}"""
        text, count = empty_class.subn(replacement, text, count=1)

        if count == 0:
            on_create = re.search(r"public\s+void\s+onCreate\s*\([^)]*\)\s*\{", text)
            if not on_create:
                raise SystemExit("ERRO: onCreate Java não encontrado.")
            text = (
                text[:on_create.end()]
                + "\n        registerPlugin(NativeUpdaterPlugin.class);"
                + text[on_create.end():]
            )

        main_path.write_text(text, encoding="utf-8")

elif kotlin_main:
    main_path = kotlin_main[0]
    text = main_path.read_text(encoding="utf-8")

    if "NativeUpdaterPlugin::class.java" not in text:
        if "import android.os.Bundle" not in text:
            package_line = re.search(r"(?m)^package\s+[^\n]+\s*$", text)
            if not package_line:
                raise SystemExit("ERRO: package Kotlin não encontrado.")
            text = text[:package_line.end()] + "\n\nimport android.os.Bundle" + text[package_line.end():]

        empty_class = re.compile(
            r"class\s+MainActivity\s*:\s*BridgeActivity\(\)\s*\{\s*\}",
            re.DOTALL,
        )
        replacement = """class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(NativeUpdaterPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}"""
        text, count = empty_class.subn(replacement, text, count=1)

        if count == 0:
            on_create = re.search(r"override\s+fun\s+onCreate\s*\([^)]*\)\s*\{", text)
            if not on_create:
                raise SystemExit("ERRO: onCreate Kotlin não encontrado.")
            text = (
                text[:on_create.end()]
                + "\n        registerPlugin(NativeUpdaterPlugin::class.java)"
                + text[on_create.end():]
            )

        main_path.write_text(text, encoding="utf-8")
else:
    raise SystemExit("ERRO: MainActivity não encontrado.")

manifest = MANIFEST.read_text(encoding="utf-8")

permission = '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />'
if permission not in manifest:
    app_index = manifest.find("<application")
    if app_index == -1:
        raise SystemExit("ERRO: <application> não encontrado.")
    manifest = manifest[:app_index] + "    " + permission + "\n\n" + manifest[app_index:]

receiver_marker = 'android:name=".UpdateInstallResultReceiver"'
if receiver_marker not in manifest:
    receiver_xml = """
        <receiver
            android:name=".UpdateInstallResultReceiver"
            android:exported="false" />
"""
    close_index = manifest.rfind("</application>")
    if close_index == -1:
        raise SystemExit("ERRO: </application> não encontrado.")
    manifest = manifest[:close_index] + receiver_xml + manifest[close_index:]

MANIFEST.write_text(manifest, encoding="utf-8")

checks = [
    (plugin_path, "PackageInstaller.SessionParams"),
    (plugin_path, "getPackageArchiveInfo"),
    (plugin_path, "session.commit"),
    (receiver_path, "STATUS_PENDING_USER_ACTION"),
    (main_path, "registerPlugin"),
    (MANIFEST, "REQUEST_INSTALL_PACKAGES"),
    (MANIFEST, "UpdateInstallResultReceiver"),
]
for path, marker in checks:
    if marker not in path.read_text(encoding="utf-8"):
        raise SystemExit(f"ERRO: validação falhou: {path} -> {marker}")

print("NativeUpdater configurado com PackageInstaller Session.")
print("MainActivity:", main_path)
print("Receiver:", receiver_path)
