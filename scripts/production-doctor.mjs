import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ok = [];
const warn = [];
const fail = [];

const file = (path) => join(root, path);
const exists = (path) => existsSync(file(path));

const parseEnv = (path) => {
  if (!exists(path)) return {};
  return Object.fromEntries(
    readFileSync(file(path), "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
};

const env = parseEnv(".env.production");

const required = (condition, okMessage, failMessage) => {
  if (condition) ok.push(okMessage);
  else fail.push(failMessage);
};

const optional = (condition, okMessage, warnMessage) => {
  if (condition) ok.push(okMessage);
  else warn.push(warnMessage);
};

const read = (path) => exists(path) ? readFileSync(file(path), "utf8") : "";
const walkFiles = (dir, selected = []) => {
  if (!exists(dir)) return selected;
  for (const entry of readdirSync(file(dir))) {
    const relative = `${dir}/${entry}`;
    const absolute = file(relative);
    const stat = statSync(absolute);
    if (stat.isDirectory()) walkFiles(relative, selected);
    else if (/\.(js|jsx|ts|java|sql|html|json)$/i.test(entry)) selected.push(relative);
  }
  return selected;
};

const mojibakePattern = /(Ã|Ä|Å|Â·|GÃ¶rev|gÃ¶nderdi|zamanÄ±|koÃ§|danÄ±ÅŸan)/;
const sourceFiles = [...walkFiles("src"), ...walkFiles("supabase"), ...walkFiles("android/app/src/main")];
const mojibakeFiles = sourceFiles.filter((path) => mojibakePattern.test(read(path)));

required(exists("supabase/schema.sql"), "Supabase schema dosyasi var", "Supabase schema dosyasi yok");
required(exists("supabase/migrations/20260531110000_stepwise_plus_schema.sql"), "Supabase migration dosyasi var", "Supabase migration dosyasi yok");
required(exists("supabase/functions/admin-create-user/index.ts"), "Admin kullanici Edge Function var", "Admin kullanici Edge Function yok");
required(exists("supabase/functions/coach-create-client/index.ts"), "Koc danisan Edge Function var", "Koc danisan Edge Function yok");
required(exists("supabase/functions/admin-import-workspace/index.ts"), "Veri aktarim Edge Function var", "Veri aktarim Edge Function yok");
required(exists("supabase/functions/notify-user/index.ts"), "Bildirim Edge Function var", "Bildirim Edge Function yok");
required(exists(".env.production"), ".env.production dosyasi var", ".env.production dosyasi yok");
required(env.VITE_APP_ENV === "production", "Production env modu aktif", "VITE_APP_ENV production degil");
required(env.VITE_ENABLE_DEMO_ACCOUNTS === "false", "Demo hesaplari production'da kapali", "Demo hesaplari production'da kapali degil");
required(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(env.VITE_SUPABASE_URL || ""), "Supabase URL gercek proje formatinda", "Supabase URL girilmemis veya proje formatinda degil");
required((env.VITE_SUPABASE_ANON_KEY || "").length > 80, "Supabase anon key girilmis", "Supabase anon key girilmemis");
required((env.VITE_SUPABASE_MEDIA_BUCKET || "") === "stepwise-media", "Supabase Storage bucket adi stepwise-media", "Supabase Storage bucket stepwise-media degil");
optional((env.VITE_FCM_VAPID_KEY || "").length > 20, "Firebase web VAPID key girilmis", "Firebase web VAPID key eksik, Android push icin zorunlu degil");
required(exists("android/app/google-services.json"), "Android Firebase google-services.json var", "Android Firebase google-services.json eksik");
required(
  exists("android/app/src/main/java/app/stepwise/plus/StepWiseFirebaseMessagingService.java") &&
    /onMessageReceived/.test(read("android/app/src/main/java/app/stepwise/plus/StepWiseFirebaseMessagingService.java")),
  "Android FCM gelen bildirim servisi aktif",
  "Android FCM gelen bildirim servisi eksik"
);
required(
  exists("android/app/src/main/java/app/stepwise/plus/StepWiseAlarmReceiver.java") &&
    /CATEGORY_ALARM/.test(read("android/app/src/main/java/app/stepwise/plus/StepWiseAlarmReceiver.java")),
  "Android alarm bildirimi yuksek oncelikli",
  "Android alarm bildirimi yeterince guclu degil"
);

const envText = exists(".env.production") ? readFileSync(file(".env.production"), "utf8") : "";
required(!/SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE/i.test(envText), "Service role key APK env dosyasina konmamis", "Service role key APK env dosyasina konmus, hemen kaldir");
required(!/FIREBASE_SERVICE_ACCOUNT_JSON/i.test(envText), "Firebase service account APK env dosyasina konmamis", "Firebase service account APK env dosyasina konmus, hemen kaldir");
required(mojibakeFiles.length === 0, "Turkce karakter bozulmasi temel kaynaklarda yok", `Turkce karakter bozulmasi supheli: ${mojibakeFiles.join(", ")}`);
required(
  /isDemoAccountsEnabled\(\)&&<div style=\{\{marginTop:short\?8:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6/.test(read("src/App.jsx")),
  "Demo giris kartlari feature flag arkasinda",
  "Demo giris kartlari feature flag olmadan gorunebilir"
);

const capacitor = exists("capacitor.config.json") ? readFileSync(file("capacitor.config.json"), "utf8") : "";
if (/app\.coachtrack\.preview/.test(capacitor)) {
  warn.push("Paket adi hala preview: Google Play oncesi kalici package id secilmeli");
} else if (/app\.stepwise\.plus/.test(capacitor)) {
  ok.push("Kalici paket adi app.stepwise.plus");
} else if (capacitor) {
  ok.push("Paket adi preview disinda gorunuyor");
}

const print = (title, items) => {
  if (!items.length) return;
  console.log(`\n${title}`);
  items.forEach((item) => console.log(`- ${item}`));
};

print("OK", ok);
print("UYARI", warn);
print("EKSIK", fail);

if (fail.length) {
  console.error("\nProduction baglantisi henuz tamam degil.");
  process.exit(1);
}

console.log("\nProduction baglanti temel kontrolleri gecti.");
