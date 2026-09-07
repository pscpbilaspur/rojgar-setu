import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Card } from "@/components/ui";

export default async function DisclaimerPage() {
  const { lang } = await getTranslations();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-[var(--ink)] mb-4">
        {lang === "hi" ? "अस्वीकरण" : "Disclaimer"}
      </h2>
      <Card>
        <p className="text-[var(--ink)] leading-relaxed">
          {lang === "hi"
            ? "रोजगार सेतु एक सामुदायिक सेवा एवं सुविधा प्रदान करने का प्रयास है, रोजगार की कोई गारंटी नहीं। यहाँ दी गई जानकारी संबंधित उपयोगकर्ताओं द्वारा उपलब्ध कराई जाती है। किसी भी नौकरी, व्यक्ति, संस्था, व्यवसाय, वेतन अथवा कार्य की शर्तों को स्वीकार करने से पहले दोनों पक्ष अपने विवेक से आवश्यक जानकारी की पुष्टि एवं उचित जाँच कर अपना निर्णय लें।"
            : "Rojgar Setu is an effort to provide a community service and facility — it does not guarantee employment. The information shown here is provided by the respective users themselves. Before accepting any job, person, organisation, business, salary or work terms, both parties should verify the necessary information and use their own judgement before deciding."}
        </p>
        <p className="text-[var(--ink)] leading-relaxed mt-3">
          {lang === "hi"
            ? "किसी भी गलत, अधूरी या भ्रामक जानकारी, व्यक्तिगत वादे/कमिटमेंट, आपसी लेन-देन या उससे उत्पन्न परिणाम के लिए रोजगार सेतु जिम्मेदार नहीं होगा। अंतिम निर्णय एवं उससे जुड़ी जिम्मेदारी संबंधित पक्षों की स्वयं की होगी।"
            : "Rojgar Setu will not be responsible for any incorrect, incomplete or misleading information, personal promises/commitments, mutual transactions, or any outcome arising from them. The final decision, and the responsibility for it, rests entirely with the parties involved."}
        </p>
      </Card>
      <Link href="/" className="inline-block mt-4 text-sm underline text-[var(--accent-ink)]">
        ← {lang === "hi" ? "होम" : "Home"}
      </Link>
    </div>
  );
}
