const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-trusted rounded-full animate-pulse" />
            <span className="font-mono text-sm text-muted-foreground">
              Aligned Intelligence
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Trust-first architecture for distinguishing legitimate automation from malicious traffic
          </p>
          
          <p className="text-sm text-muted-foreground">
            Jakob Hallin • 2024
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
