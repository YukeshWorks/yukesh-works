import { useState } from "react";
import { X, Mail, Send, CheckCircle, Loader2 } from "lucide-react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    
    // Simulate sending - in real app, this would be an API call
    setTimeout(() => {
      // Open email client with pre-filled data
      const subject = encodeURIComponent(`Contact from ${formData.name}`);
      const body = encodeURIComponent(`From: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
      window.location.href = `mailto:mailtoyukesh33@gmail.com?subject=${subject}&body=${body}`;
      
      setStatus("sent");
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setFormData({ name: "", email: "", message: "" });
      }, 1500);
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md glass rounded-2xl p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold gradient-text">Get in Touch</h2>
          </div>
          <p className="text-xs text-muted-foreground">Send me a message and I'll get back to you</p>
        </div>

        {status === "sent" ? (
          <div className="flex flex-col items-center justify-center py-8 animate-scale-in">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-sm font-medium">Message sent!</p>
            <p className="text-xs text-muted-foreground">Opening your email client...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg glass bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg glass bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg glass bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 resize-none"
                placeholder="What would you like to say?"
              />
            </div>
            
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-200 disabled:opacity-70"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}
        
        {/* Direct contact info */}
        <div className="mt-4 pt-4 border-t border-border/50 text-center space-y-1">
          <p className="text-[10px] text-muted-foreground">
            Email: <a href="mailto:mailtoyukesh33@gmail.com" className="text-primary hover:underline">mailtoyukesh33@gmail.com</a>
          </p>
          <p className="text-[10px] text-muted-foreground">
            Phone: <a href="tel:9080861733" className="text-primary hover:underline">9080861733</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
