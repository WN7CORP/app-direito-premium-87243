import { useState } from "react";
import { ImageIcon, Loader2, ZoomIn, X } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface ImageWithZoomProps {
  imageUrl?: string;
  alt: string;
  onGenerate: () => void;
  isLoading?: boolean;
  placeholderText?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export const ImageWithZoom = ({
  imageUrl,
  alt,
  onGenerate,
  isLoading,
  placeholderText = "Gerar ilustração",
  gradientFrom = "from-primary/10",
  gradientTo = "to-primary/5"
}: ImageWithZoomProps) => {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!imageUrl) {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden aspect-video bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => !isLoading && onGenerate()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Gerando ilustração...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8 text-primary/60" />
            <span className="text-sm text-muted-foreground">{placeholderText}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative rounded-lg overflow-hidden aspect-video bg-muted group cursor-pointer" onClick={() => setIsZoomed(true)}>
        <img 
          src={imageUrl} 
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Zoom overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-3">
              <ZoomIn className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-white/10 hover:bg-white/20 p-2 transition-colors">
            <X className="h-6 w-6 text-white" />
          </DialogClose>
          
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={imageUrl} 
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
