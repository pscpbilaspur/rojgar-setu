import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Card } from "@/components/ui";

export default async function HelpPage() {
  const { lang, t } = await getTranslations();

  const faqs =
    lang === "hi"
      ? [
          {
            q: "क्या Rojgar Setu पर पंजीकरण मुफ़्त है?",
            a: "हां, यह पूरी तरह निःशुल्क सामुदायिक सेवा है — कोई सदस्यता, कमीशन या भुगतान नहीं।",
          },
          {
            q: "मेरा मोबाइल नंबर कौन देख सकता है?",
            a: "कोई भी अनाम विज़िटर कभी नहीं। यह आपकी Privacy Settings के अनुसार ही साझा होता है।",
          },
          {
            q: "\"मूल सत्यापन\" (Basic Verification) का क्या मतलब है?",
            a: "यह कोई गारंटी नहीं है — केवल यह दर्शाता है कि सामुदायिक अप्रूवर द्वारा एक बुनियादी जांच प्रक्रिया पूरी हुई है। इसे चरित्र प्रमाण पत्र या रोजगार गारंटी न समझें।",
          },
          {
            q: "अगर मुझे कोई नौकरी संदिग्ध लगे तो क्या करूं?",
            a: "नौकरी के पेज पर \"Report this job\" पर क्लिक करें — हमारी टीम इसकी समीक्षा करेगी। कभी भी OTP, पासवर्ड या भुगतान किसी को न दें।",
          },
        ]
      : [
          {
            q: "Is registering on Rojgar Setu free?",
            a: "Yes, it is a completely free community service — no subscription, commission or payment.",
          },
          {
            q: "Who can see my mobile number?",
            a: "No anonymous visitor, ever. It is only shared according to your own Privacy Settings.",
          },
          {
            q: "What does \"Basic Verification\" mean?",
            a: "This is not a guarantee — it only means a basic community-level check has been completed by an Approver. It is not a character certificate or an employment guarantee.",
          },
          {
            q: "What if I find a job listing suspicious?",
            a: 'Click "Report this job" on the job\'s page — our team will review it. Never share OTPs, passwords, or make payments to anyone.',
          },
        ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-[var(--ink)] mb-4">{t("footer_help")}</h2>
      <div className="space-y-3">
        {faqs.map((f) => (
          <Card key={f.q}>
            <p className="font-semibold text-[var(--ink)]">{f.q}</p>
            <p className="text-[var(--ink-muted)] mt-1.5 leading-relaxed">{f.a}</p>
          </Card>
        ))}
      </div>
      <Link href="/" className="inline-block mt-4 text-sm underline text-[var(--accent-ink)]">
        ← {lang === "hi" ? "होम" : "Home"}
      </Link>
    </div>
  );
}
