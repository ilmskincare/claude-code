export const metadata = { title: "Privacy notice" };
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 prose">
      <h1 className="text-4xl font-bold">Privacy notice</h1>
      <p className="mt-4 badge badge-warn">Draft: requires owner and data-protection review before go-live</p>
      <h2 className="text-2xl font-bold mt-8">Who we are</h2><p>Rebellious Ink (legal entity to be confirmed by the owner) is the data controller for client records. Independent chair-rent artists may be joint or separate controllers for their own client lists; this will be stated in your booking confirmation.</p>
      <h2 className="text-2xl font-bold mt-6">What we collect and why</h2>
      <ul className="list-disc pl-6 space-y-1"><li>Contact details, enquiry, references and messages: to plan and provide your tattoo or piercing (contract, UK GDPR Article 6(1)(b)).</li><li>Date of birth and in-person ID check outcome: legal obligation under the Tattooing of Minors Act 1969 and studio policy (Article 6(1)(c)). We do not keep copies of your ID.</li><li>Health questionnaire answers: special-category data processed with your explicit consent (Article 9(2)(a)) and, where relevant, for the provision of care-related services, stored separately with restricted access and a defined retention period.</li><li>Payment records: contract and legal obligation. Card details are handled by Stripe and never stored by us.</li><li>Photographs, portfolio publication and marketing: only with your separate opt-in, which you can withdraw.</li></ul>
      <h2 className="text-2xl font-bold mt-6">Marketing and third parties</h2><p>We only email you news and offers if you have told us we may, whether on our website, in your portal or at the studio desk, and we record when and how you agreed. Every marketing email has a one-click unsubscribe, and you can change your answer at any time in your portal. We never share or sell your details with third parties for their marketing. The only companies that process your data do so on our behalf to run this service (hosting, email delivery and card payments) under contracts that forbid any other use.</p>
      <h2 className="text-2xl font-bold mt-6">Your rights</h2><p>You can ask for a copy of your data, correction, erasure where applicable, and withdrawal of consent, from your portal or by contacting the studio. You can complain to the ICO at ico.org.uk.</p>
      <h2 className="text-2xl font-bold mt-6">Retention</h2><p>Consent and treatment records are kept for the period required by our insurer and local authority (to be confirmed and published). Enquiries that do not proceed are deleted after 12 months.</p>
    </div>
  );
}
