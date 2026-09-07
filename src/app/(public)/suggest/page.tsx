import { getTranslations } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { SuggestForm } from "./SuggestForm";

export default async function SuggestPage() {
  const { lang } = await getTranslations();

  const strings = {
    title: lang === "hi" ? "सुझाव दें" : "Give a suggestion",
    lead:
      lang === "hi"
        ? "Rojgar Setu को बेहतर बनाने में मदद करें। आपका सुझाव सीधे केंद्रीय टीम तक पहुंचेगा।"
        : "Help us make Rojgar Setu better. Your suggestion goes directly to the central team.",
    placeholder: lang === "hi" ? "आपका सुझाव यहाँ लिखें..." : "Write your suggestion here...",
    submit: lang === "hi" ? "सुझाव भेजें" : "Submit suggestion",
    thanks: lang === "hi" ? "धन्यवाद! आपका सुझाव प्राप्त हुआ।" : "Thank you! Your suggestion has been received.",
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-[var(--ink)] mb-2">{strings.title}</h2>
      <p className="text-[var(--ink-muted)] mb-4">{strings.lead}</p>
      <Card>
        <SuggestForm strings={strings} />
      </Card>
    </div>
  );
}
