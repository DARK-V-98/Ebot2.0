export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-black text-slate-900 mb-6">Terms of Service</h1>
        <p className="text-slate-500 mb-8 font-medium">Last updated: April 2026</p>

        <div className="space-y-8 text-slate-600 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-black text-slate-900 mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing and interacting with E BOT 2.1 via WhatsApp or our web dashboard, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 mb-3">2. Description of Service</h2>
            <p>
              E BOT 2.1 provides AI-driven customer support, e-commerce ordering capabilities, and conversation management integrated through third-party platforms like Meta (WhatsApp) and Google (Gemini).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 mb-3">3. User Responsibilities</h2>
            <p>
              You agree to use our services only for lawful purposes. You must not use the bot to transmit spam, malware, or offensive content. We reserve the right to block users who violate these guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 mb-3">4. Third-Party Integrations</h2>
            <p>
              Our service relies on Meta Platforms (WhatsApp Cloud API) and Google AI. Your interactions carry over their respective terms of service. E BOT 2.1 is not responsible for outages or policy changes enforced by these third-party providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 mb-3">5. Disclaimer of Warranties</h2>
            <p>
              The service is provided on an "as is" and "as available" basis. E BOT 2.1 makes no warranties, expressed or implied, regarding the accuracy of AI-generated responses or the uninterrupted functionality of the WhatsApp integration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 mb-3">6. Limitation of Liability</h2>
            <p>
              In no event shall E BOT 2.1 or its developers be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 mb-3">7. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide noticeable communication prior to any new terms taking effect.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
