import { getTranslations } from "@/lib/i18n";
import { Card } from "@/components/ui";

export default async function PolicyPage() {
  const { lang, t } = await getTranslations();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-[var(--ink)] mb-4">{t("footer_policy")}</h2>
      <Card>
        <p className="text-[var(--ink)] leading-relaxed">
          {lang === "hi"
            ? "Rojgar Setu पूज्य सिंधी सेंट्रल पंचायत बिलासपुर की एक निःशुल्क सामुदायिक सेवा पहल है। इसका उद्देश्य रोजगार खोजने वालों और अवसर देने वालों के बीच संपर्क को सुगम बनाना है। Rojgar Setu रोजगार, नियुक्ति, वेतन, कार्य-स्थिति, व्यवसाय की वैधता, कर्मचारी की उपयुक्तता या भविष्य के व्यवहार की कोई गारंटी नहीं देता। दोनों पक्षों को अपनी स्वतंत्र जांच करके स्वयं निर्णय लेना चाहिए। कभी भी OTP, पासवर्ड या भुगतान किसी को न दें।"
            : "Rojgar Setu is a free community-service initiative of Pujya Sindhi Central Panchayat Bilaspur. Its purpose is to facilitate connections between people seeking employment and people/businesses providing opportunities. Rojgar Setu does not guarantee employment, salary, work conditions, business legitimacy, employee suitability, or future conduct. Both parties should independently verify information and use their own judgement. Never share OTPs, passwords or make payments to anyone."}
        </p>
        <p className="text-[12.5px] text-[var(--ink-faint)] mt-3 font-mono">
          {lang === "hi" ? "संपर्क" : "Contact"}: [TO BE UPDATED]
        </p>
      </Card>
    </div>
  );
}
