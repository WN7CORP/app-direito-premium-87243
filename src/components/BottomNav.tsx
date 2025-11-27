import { useNavigate, useLocation } from "react-router-dom";
import { Home, Wrench, Menu, MonitorSmartphone, Sparkles, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { useState } from "react";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  
  // Esconder menu nas páginas de flashcards e OAB
  if (location.pathname.includes('/flashcards/estudar') || location.pathname === '/oab') {
    return null;
  }

  const leftNavItems = [
    {
      id: "inicio",
      label: "Início",
      icon: Home,
      path: "/",
    },
    {
      id: "ferramentas",
      label: "Ferramentas",
      icon: Wrench,
      path: "/ferramentas",
    },
  ];

  const rightNavItems = [
    {
      id: "novidades",
      label: "Novidades",
      icon: Sparkles,
      path: "/novidades",
    },
  ];

  const handleProfessoraClick = () => {
    navigate('/chat-professora');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card">
      <div className="max-w-2xl mx-auto px-1 py-2">
        <div className="flex items-center justify-between relative">
          {/* Itens da Esquerda */}
          <div className="flex items-center gap-0.5 flex-1">
            {leftNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all min-w-[60px]",
                    active
                      ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <Icon className={cn("w-6 h-6 transition-transform", active && "scale-110")} />
                  <span className="text-[11px] font-medium leading-tight text-center">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Botão Central da Professora - Maior e Sobreposto */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-50 flex flex-col items-center gap-1">
            <button
              onClick={handleProfessoraClick}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
            >
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </button>
            <span className="text-[10px] font-medium text-primary">Professora</span>
          </div>

          {/* Itens da Direita */}
          <div className="flex items-center gap-0.5 flex-1 justify-end">
            {rightNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all min-w-[60px]",
                    active
                      ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <Icon className={cn("w-6 h-6 transition-transform", active && "scale-110")} />
                  <span className="text-[11px] font-medium leading-tight text-center">{item.label}</span>
                </button>
              );
            })}

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all min-w-[60px]",
                    "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <Menu className="w-6 h-6 transition-transform" />
                  <span className="text-[11px] font-medium leading-tight">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <AppSidebar onClose={() => setIsMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};