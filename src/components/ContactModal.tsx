import { useState } from "react";
import { X, Mail, Send } from "lucide-react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "opening">("idle");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio contact from ${formData.name.trim()}`);
    const body = encodeURIComponent(`From: ${formData.name.trim()}\nEmail: ${formData.email.trim()}\n\nMessage:\n${formData.message.trim()}`);
    setStatus("opening");
    window.location.href = `mailto:mailtoyukesh33@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close contact form" onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-all duration-200">
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold gradient-text">Get in Touch</h2>
          </div>
          <p className="text-xs text-muted-foreground">Prepare an email message to send directly to me.</p>
        </div>

        {status === "opening" ? (
          <div role="status" className="py-8 text-center">
            <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-sm font-medium">Your email app should open</p>
            <p className="text-xs text-muted-foreground mt-2">The message is not sent until you review it and press Send in your email app.</p>
            <button type="button" onClick={() => setStatus("idle")} className="mt-5 text-xs text-primary hover:underline">Back to form</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
              <input id="contact-name" type="text" required maxLength={120} value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg glass bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200" placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <input id="contact-email" type="email" required maxLength={254} value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg glass bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200" placeholder="your@email.com" />
            </div>
            <div>
              <label htmlFor="contact-message" className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
              <textarea id="contact-message" required minLength={5} maxLength={5000} rows={4} value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg glass bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 resize-none" placeholder="What would you like to say?" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-200">
              <Send className="w-4 h-4" /> Open email app
            </button>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-border/50 text-center space-y-1">
          <p className="text-[10px] text-muted-foreground">Email: <a href="mailto:mailtoyukesh33@gmail.com" className="text-primary hover:underline">mailtoyukesh33@gmail.com</a></p>
          <p className="text-[10px] text-muted-foreground">WhatsApp: <a href="https://wa.me/919080861733" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">9080861733</a></p>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
